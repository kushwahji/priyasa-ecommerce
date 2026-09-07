import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {hmacSha256,safeEqual} from '@/lib/crypto';
import {emitOrderEvent} from '@/lib/events';
import {recordOrderStatus} from '@/lib/order-state';

export async function POST(req:Request){
 const body=await req.text();
 const signature=req.headers.get('x-razorpay-signature');
 if(!signature||!process.env.RAZORPAY_WEBHOOK_SECRET)return NextResponse.json({error:'Webhook not configured'},{status:503});
 if(!safeEqual(hmacSha256(body,process.env.RAZORPAY_WEBHOOK_SECRET),signature))return NextResponse.json({error:'Invalid signature'},{status:401});
 let event:any;try{event=JSON.parse(body)}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 const eventId=String(event.id||'');if(!eventId)return NextResponse.json({error:'Missing event id'},{status:400});
 try{await db.webhookEvent.create({data:{provider:'razorpay',eventId,eventType:String(event.event||'unknown'),payload:event}})}catch(e:any){
  const existing=await db.webhookEvent.findUnique({where:{eventId}}).catch(()=>null);
  if(existing)return NextResponse.json({received:true,duplicate:true});
  return NextResponse.json({error:'Unable to record webhook'},{status:500});
 }
 const paymentEntity=event.payload?.payment?.entity;
 const providerOrderId=String(paymentEntity?.order_id||'');
 if(!providerOrderId){await db.webhookEvent.update({where:{eventId},data:{processed:true,processedAt:new Date()}});return NextResponse.json({received:true});}
 const p=await db.payment.findFirst({where:{providerOrderId},include:{order:{include:{items:true}}}});
 if(!p){await db.webhookEvent.update({where:{eventId},data:{processed:true,processedAt:new Date()}});return NextResponse.json({received:true});}
 try{
  await db.$transaction(async tx=>{
   const fresh=await tx.payment.findUnique({where:{id:p.id},include:{order:{include:{items:true}}}});
   if(!fresh)throw new Error('PAYMENT_NOT_FOUND');
   if(event.event==='payment.captured'){
    const expectedAmount=Math.round(Number(fresh.order.total)*100);
    const actualAmount=Number(paymentEntity?.amount);
    if(!Number.isFinite(actualAmount)||actualAmount!==expectedAmount||String(paymentEntity?.currency||'')!=='INR')throw new Error('PAYMENT_AMOUNT_MISMATCH');
    if(fresh.status!=='CAPTURED'){
     for(const item of fresh.order.items){
      const changed=await tx.$executeRaw`UPDATE ProductVariant SET stock = stock - ${item.quantity}, reserved = reserved - ${item.quantity} WHERE id = ${item.variantId} AND reserved >= ${item.quantity} AND stock >= ${item.quantity}`;
      if(changed!==1)throw new Error(`Inventory finalization failed for ${item.sku}`);
      await tx.inventoryMovement.create({data:{variantId:item.variantId,quantity:-item.quantity,reason:'SALE',referenceId:fresh.orderId}});
     }
    }
    await tx.payment.update({where:{id:fresh.id},data:{providerPaymentId:String(paymentEntity?.id||''),status:'CAPTURED',signatureVerified:true,rawWebhookId:eventId}});
   } else if(event.event==='payment.failed'){
    if(fresh.status!=='FAILED'&&fresh.status!=='CAPTURED'){
     for(const item of fresh.order.items){
      const changed=await tx.$executeRaw`UPDATE ProductVariant SET reserved = reserved - ${item.quantity} WHERE id = ${item.variantId} AND reserved >= ${item.quantity}`;
      if(changed!==1)throw new Error(`Inventory release failed for ${item.sku}`);
      await tx.inventoryMovement.create({data:{variantId:item.variantId,quantity:0,reason:'PAYMENT_FAILED_RELEASE',referenceId:fresh.orderId}});
     }
    }
    await tx.payment.update({where:{id:fresh.id},data:{providerPaymentId:String(paymentEntity?.id||''),status:'FAILED',signatureVerified:true,rawWebhookId:eventId}});
   }
   await tx.paymentEvent.create({data:{provider:'razorpay',eventId,eventType:event.event,payload:event,paymentId:fresh.id}}).catch(()=>undefined);
   await tx.webhookEvent.update({where:{eventId},data:{processed:true,processedAt:new Date()}});
  });
  if(event.event==='payment.captured'){await recordOrderStatus(p.orderId,'CONFIRMED');await emitOrderEvent(p.orderId,'PAYMENT_CAPTURED');await emitOrderEvent(p.orderId,'ORDER_CONFIRMED');}
  if(event.event==='payment.failed'){await recordOrderStatus(p.orderId,'CANCELLED',undefined,'Razorpay payment failed');}
  return NextResponse.json({received:true});
 }catch(e){await db.webhookEvent.update({where:{eventId},data:{error:e instanceof Error?e.message:'processing failed'}}).catch(()=>undefined);return NextResponse.json({error:'Webhook processing failed'},{status:500});}
}
