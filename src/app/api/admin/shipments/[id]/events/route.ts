import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireAdminPermission} from '@/lib/auth';
import {recordShipmentEvent} from '@/lib/fulfillment';

const schema=z.object({status:z.enum(['CREATED','AWB_ASSIGNED','PICKUP_REQUESTED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','RTO','CANCELLED']),location:z.string().max(200).optional(),description:z.string().max(1000).optional(),providerEventId:z.string().max(200).optional(),payload:z.unknown().optional(),occurredAt:z.string().datetime().optional()});
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){try{await requireAdminPermission('orders.write');const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:'Invalid shipment event',details:p.error.flatten()},{status:400});const {id}=await params;const event=await recordShipmentEvent({shipmentId:id,...p.data,occurredAt:p.data.occurredAt?new Date(p.data.occurredAt):undefined});return NextResponse.json({data:event});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to record shipment event'},{status:400});}}
