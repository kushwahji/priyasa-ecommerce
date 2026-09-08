import {db} from '@/lib/db';
import {recordFulfillmentStatus} from '@/lib/order-state';

export const SHIPMENT_FLOW=['CREATED','AWB_ASSIGNED','PICKUP_REQUESTED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','RTO','CANCELLED'] as const;
export type ShipmentFlowStatus=typeof SHIPMENT_FLOW[number];

export async function recordShipmentEvent(input:{shipmentId:string,status:ShipmentFlowStatus,location?:string,description?:string,providerEventId?:string,payload?:unknown,occurredAt?:Date}){
  const shipment=await db.shipment.findUnique({where:{id:input.shipmentId}});
  if(!shipment) throw new Error('SHIPMENT_NOT_FOUND');
  const event=input.providerEventId?await db.shipmentEvent.findUnique({where:{providerEventId:input.providerEventId}}):null;
  if(event) return event;
  const created=await db.$transaction(async tx=>{
    const e=await tx.shipmentEvent.create({data:{shipmentId:input.shipmentId,status:input.status,location:input.location,description:input.description,providerEventId:input.providerEventId,payload:input.payload as any,occurredAt:input.occurredAt||new Date()}});
    await tx.shipment.update({where:{id:input.shipmentId},data:{status:input.status,shippedAt:input.status==='IN_TRANSIT'||input.status==='PICKED_UP'?shipment.shippedAt||new Date():shipment.shippedAt,deliveredAt:input.status==='DELIVERED'?new Date():shipment.deliveredAt}});
    return e;
  });
  const orderStatus=input.status==='DELIVERED'?'DELIVERED':input.status==='CANCELLED'?'CANCELLED':input.status==='OUT_FOR_DELIVERY'?'SHIPPED':input.status==='RTO'?'RETURNED':input.status==='IN_TRANSIT'||input.status==='PICKED_UP'?'SHIPPED':undefined;
  if(orderStatus) await recordFulfillmentStatus(shipment.orderId,input.status);
  return created;
}

export async function createShipmentRecord(orderId:string, provider:string, data:{carrier?:string;trackingNumber?:string;trackingUrl?:string;providerShipmentId?:string;labelUrl?:string;invoiceUrl?:string;weightGrams?:number}){
  return db.shipment.upsert({where:{orderId},create:{orderId,provider,carrier:data.carrier,trackingNumber:data.trackingNumber,trackingUrl:data.trackingUrl,providerShipmentId:data.providerShipmentId,labelUrl:data.labelUrl,invoiceUrl:data.invoiceUrl,weightGrams:data.weightGrams},update:{provider,carrier:data.carrier,trackingNumber:data.trackingNumber,trackingUrl:data.trackingUrl,providerShipmentId:data.providerShipmentId,labelUrl:data.labelUrl,invoiceUrl:data.invoiceUrl,weightGrams:data.weightGrams}});
}
