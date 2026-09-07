import { db } from '@/lib/db';

export async function notifyUser(userId:string,type:string,title:string,body:string,data?:Record<string,unknown>){
 const n=await db.notification.create({data:{userId,type,title,body,data:data as any}});
 await db.notificationDelivery.createMany({data:[{notificationId:n.id,channel:'in_app'},{notificationId:n.id,channel:'email'},{notificationId:n.id,channel:'whatsapp'},{notificationId:n.id,channel:'fcm'}],skipDuplicates:true});
 return n;
}

export async function emitOrderEvent(orderId:string,event:string){
 const order=await db.order.findUnique({where:{id:orderId},include:{user:true,items:true,payment:true,shipment:true}}); if(!order)return;
 const uid=order.userId;if(!uid)return;
 const messages:Record<string,[string,string]>={
  PAYMENT_CAPTURED:['Payment received','Your payment was received and your Priyasa order is confirmed.'],
  ORDER_CONFIRMED:['Order confirmed',`Your order ${order.orderNumber} is confirmed.`],
  SHIPMENT_CREATED:['Shipment created',`Your order ${order.orderNumber} has been handed to the shipping workflow.`],
  OUT_FOR_DELIVERY:['Out for delivery',`Your Priyasa order ${order.orderNumber} is out for delivery.`],
  DELIVERED:['Order delivered',`Your Priyasa order ${order.orderNumber} was delivered.`],
  RETURN_APPROVED:['Return approved',`Your return request for ${order.orderNumber} was approved.`]
 };
 const m=messages[event]; if(m) await notifyUser(uid,event,m[0],m[1],{orderId,orderNumber:order.orderNumber});
}
