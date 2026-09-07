import {NextResponse} from 'next/server';
import {Prisma} from '@prisma/client';
import {cookies} from 'next/headers';
import {db} from '@/lib/db';

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const body=await req.json().catch(()=>({}));
 const reason=typeof body?.reason==='string'?body.reason.trim().slice(0,240):'Cancelled by customer';
 const jar=await cookies();
 const userId=jar.get('priyasa_local_user_id')?.value;
 if(!userId)return NextResponse.json({error:'Please sign in to cancel this order.'},{status:401});
 try{
  const result=await db.$transaction(async tx=>{
   const order=await tx.order.findFirst({where:{id,userId},include:{items:true,payment:true}});
   if(!order)return NextResponse.json({error:'Order not found.'},{status:404});
   if(!['CREATED','PAYMENT_PENDING','CONFIRMED'].includes(order.status))return NextResponse.json({error:'This order can no longer be cancelled.'},{status:409});
   if(order.payment&&['CAPTURED','AUTHORIZED'].includes(order.payment.status))return NextResponse.json({error:'This paid order cannot be cancelled automatically. Please request cancellation/refund from support.'},{status:409});
   for(const item of order.items){
    const released=await tx.$executeRaw(Prisma.sql`UPDATE ProductVariant SET reserved = GREATEST(0, reserved - ${item.quantity}) WHERE id = ${item.variantId}`);
    if(released===1)await tx.inventoryMovement.create({data:{variantId:item.variantId,quantity:-item.quantity,reason:'RELEASE',referenceId:order.id}});
   }
   await tx.order.update({where:{id:order.id},data:{status:'CANCELLED',fulfillmentStatus:'CANCELLED'}});
   if(order.payment)await tx.payment.update({where:{id:order.payment.id},data:{status:'FAILED'}});
   await tx.orderStatusHistory.create({data:{orderId:order.id,fromStatus:order.status,toStatus:'CANCELLED',actorId:userId,note:reason}});
   return {orderId:order.id,orderNumber:order.orderNumber,status:'CANCELLED'};
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,maxWait:5000,timeout:15000});
  if(result instanceof NextResponse)return result;
  return NextResponse.json(result);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to cancel order.'},{status:409});}
}
