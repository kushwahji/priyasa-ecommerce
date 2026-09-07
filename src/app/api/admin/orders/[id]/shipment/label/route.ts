import {NextResponse} from 'next/server';
import {requireAdminPermission} from '@/lib/auth';
import {db} from '@/lib/db';
import {getShippingProvider} from '@/lib/shipping';

export async function POST(_req:Request,{params}:{params:Promise<{id:string}>}){
 try{const admin=await requireAdminPermission('orders.write');const {id}=await params;const shipment=await db.shipment.findUnique({where:{orderId:id}});if(!shipment||!shipment.providerShipmentId)return NextResponse.json({error:'Shipment not found'},{status:404});const result=await getShippingProvider(shipment.provider).generateLabel(shipment.providerShipmentId);if(!result.labelUrl)return NextResponse.json({error:'Provider did not return a label URL'},{status:502});const updated=await db.$transaction(async tx=>{const s=await tx.shipment.update({where:{id:shipment.id},data:{labelUrl:result.labelUrl}});await tx.shipmentEvent.create({data:{shipmentId:s.id,status:s.status,description:'Shipping label generated',payload:result}});await tx.auditLog.create({data:{userId:admin.userId,action:'LABEL_GENERATED',entity:'Shipment',entityId:s.id}});return s;});return NextResponse.json(updated);}catch(e){const forbidden=e instanceof Error&&e.message.includes('FORBIDDEN');return NextResponse.json({error:forbidden?'Forbidden':e instanceof Error?e.message:'Unable to generate label'},{status:forbidden?403:500});}
}
