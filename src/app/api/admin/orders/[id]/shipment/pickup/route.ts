import {NextResponse} from 'next/server';
import {requireAdminPermission} from '@/lib/auth';
import {db} from '@/lib/db';
import {getShippingProvider} from '@/lib/shipping';
import {recordFulfillmentStatus} from '@/lib/order-state';

export async function POST(_req:Request,{params}:{params:Promise<{id:string}>}){
 try{const admin=await requireAdminPermission('orders.write');const {id}=await params;const shipment=await db.shipment.findUnique({where:{orderId:id}});if(!shipment||!shipment.providerShipmentId)return NextResponse.json({error:'Shipment not found'},{status:404});if(!shipment.trackingNumber)return NextResponse.json({error:'Assign AWB before requesting pickup'},{status:409});const result=await getShippingProvider(shipment.provider).requestPickup(shipment.providerShipmentId);const updated=await db.$transaction(async tx=>{const s=await tx.shipment.update({where:{id:shipment.id},data:{status:'PICKUP_REQUESTED'}});await tx.shipmentEvent.create({data:{shipmentId:s.id,status:'PICKUP_REQUESTED',description:'Pickup requested',payload:result}});await tx.auditLog.create({data:{userId:admin.userId,action:'PICKUP_REQUESTED',entity:'Shipment',entityId:s.id}});return s;});await recordFulfillmentStatus(id,'PICKUP_REQUESTED','Pickup requested');return NextResponse.json(updated);}catch(e){const forbidden=e instanceof Error&&e.message.includes('FORBIDDEN');return NextResponse.json({error:forbidden?'Forbidden':e instanceof Error?e.message:'Unable to request pickup'},{status:forbidden?403:500});}
}
