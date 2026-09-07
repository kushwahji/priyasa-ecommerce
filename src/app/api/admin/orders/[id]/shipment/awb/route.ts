import {NextResponse} from 'next/server';
import {requireAdminPermission} from '@/lib/auth';
import {db} from '@/lib/db';
import {getShippingProvider} from '@/lib/shipping';
import {recordFulfillmentStatus} from '@/lib/order-state';

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const admin=await requireAdminPermission('orders.write'); const {id}=await params; const body=await req.json().catch(()=>({}));
  const shipment=await db.shipment.findUnique({where:{orderId:id}}); if(!shipment)return NextResponse.json({error:'Shipment not found'},{status:404});
  const provider=getShippingProvider(shipment.provider); if(!shipment.providerShipmentId)return NextResponse.json({error:'Provider shipment ID missing'},{status:409});
  const result=await provider.assignAwb(shipment.providerShipmentId,body.courierId?String(body.courierId):undefined);
  const updated=await db.$transaction(async tx=>{const s=await tx.shipment.update({where:{id:shipment.id},data:{trackingNumber:result.awb||shipment.trackingNumber,carrier:result.carrier||shipment.carrier,trackingUrl:result.trackingUrl||shipment.trackingUrl,status:result.awb?'AWB_ASSIGNED':shipment.status}});await tx.shipmentEvent.create({data:{shipmentId:s.id,status:s.status,description:'AWB assigned',payload:result}});await tx.auditLog.create({data:{userId:admin.userId,action:'AWB_ASSIGNED',entity:'Shipment',entityId:s.id,metadata:{awb:result.awb,carrier:result.carrier}}});return s;});
  if(result.awb)await recordFulfillmentStatus(id,'SHIPMENT_CREATED','AWB assigned'); return NextResponse.json(updated);
 }catch(e){const forbidden=e instanceof Error&&e.message.includes('FORBIDDEN');return NextResponse.json({error:forbidden?'Forbidden':e instanceof Error?e.message:'Unable to assign AWB'},{status:forbidden?403:500});}
}
