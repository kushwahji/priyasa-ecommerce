import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {hmacSha256,safeEqual} from '@/lib/crypto';
import {emitOrderEvent} from '@/lib/events';
import {recordOrderStatus} from '@/lib/order-state';

export async function POST(req:Request){
 const body=await req.text();const signature=req.headers.get('x-razorpay-signature');
 if(!signature||!process.env.RAZORPAY_WEBHOOK_SECRET)return NextResponse.json({error:'Webhook not configured'},{status:503});
 if(!safeEqual(hmacSha256(body,process.env.RAZORPAY_WEBHOOK_SECRET),signature))return NextResponse.json({error:'Invalid signature'},{status:401});
 let event:any;try{event=JSON.parse(body)}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 const eventId=String(event.id||'');if(!eventId)return NextResponse.json({error:'Missing event id'},{status:400});
 try{await db.webhookEvent.create({data:{provider:'razorpay',eventId,eventType:String(event.event||'unknown'),payload:event}})}catch{return NextResponse.json({received:true,duplicate:true})}
 const payment=event.payload?.payment?.entity;const providerOrderId=payment?.order_id;
 if(!providerOrderId){await db.webhookEvent.update({where:{eventId},data:{processed:true,processedAt:new Date()}});return NextResponse.json({received:true});}
 const p=await db.payment.findFirst({where:{providerOrderId},include:{order:{include:{items:true}}}});if(!p){await db.webhookEvent.update({where:{eventId},data:{processed:true,processedAt:new Date()}});return NextResponse.json({received:true});}
 try{
  await db.$transaction(async tx=>{
   if(event.event==='payment.captured'){
    if(p.status!=='CAPTURED'){for(const item of p.order.items){await tx.productVariant.update({where:{id:item.variantId},data:{stock:{decrement:item.quantity},reserved:{decrement:item.quantity}}});await tx.inventoryMovement.create({data:{variantId:item.variantId,quantity:-item.quantity,reason:'SALE',referenceId:p.orderId}});}}
    await tx.payment.update({where:{id:p.id},data:{providerPaymentId:payment.id,status:'CAPTURED',signatureVerified:true,rawWebhookId:eventId}});
   } else if(event.event==='payment.failed'){
    if(p.status!=='FAILED'&&p.status!=='CAPTURED'){for(const item of p.order.items){await tx.productVariant.update({where:{id:item.variantId},data:{reserved:{decrement:item.quantity}}});await tx.inventoryMovement.create({data:{variantId:item.variantId,quantity:0,reason:'PAYMENT_FAILED_RELEASE',referenceId:p.orderId}});}}
    await tx.payment.update({where:{id:p.id},data:{providerPaymentId:payment.id,status:'FAILED',signatureVerified:true,rawWebhookId:eventId}});
   }
   await tx.paymentEvent.create({data:{provider:'razorpay',eventId,eventType:event.event,payload:event,paymentId:p.id}}).catch(()=>undefined);
   await tx.webhookEvent.update({where:{eventId},data:{processed:true,processedAt:new Date()}});
  });
  if(event.event==='payment.captured'){await recordOrderStatus(p.orderId,'CONFIRMED');await emitOrderEvent(p.orderId,'PAYMENT_CAPTURED');await emitOrderEvent(p.orderId,'ORDER_CONFIRMED');}
  if(event.event==='payment.failed'){await recordOrderStatus(p.orderId,'CANCELLED',undefined,'Razorpay payment failed');}
  return NextResponse.json({received:true});
 }catch(e){await db.webhookEvent.update({where:{eventId},data:{error:e instanceof Error?e.message:'processing failed'}});return NextResponse.json({error:'Webhook processing failed'},{status:500});}
}
