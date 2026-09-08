import {NextResponse} from 'next/server';
import {requireAdminPermission} from '@/lib/auth';
import {db} from '@/lib/db';
import {recordOrderStatus} from '@/lib/order-state';
import {emitOrderEvent} from '@/lib/events';

const allowed = new Set(['CREATED','PAYMENT_PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','RETURN_REQUESTED','RETURNED','REFUNDED']);
const MAX = 100;

export async function POST(req: Request) {
  try {
    const admin = await requireAdminPermission('orders.write');
    const body = await req.json();
    const rawIds: unknown[] = Array.isArray(body.orderIds) ? body.orderIds : [];
    const validIds = rawIds.filter((x: unknown): x is string => typeof x === 'string' && x.length > 0);
    const ids = [...new Set<string>(validIds)];
    const status = typeof body.status === 'string' ? body.status : '';
    const note = typeof body.note === 'string' ? body.note.slice(0, 500) : undefined;
    if (!ids.length || ids.length > MAX) return NextResponse.json({error:`Select between 1 and ${MAX} orders`},{status:400});
    if (!allowed.has(status)) return NextResponse.json({error:'Invalid order status'},{status:400});

    const existing = await db.order.findMany({where:{id:{in:ids}},select:{id:true,status:true}});
    if (existing.length !== ids.length) return NextResponse.json({error:'One or more orders were not found'},{status:404});

    const results: Array<{id:string;ok:boolean;error?:string}> = [];
    for (const order of existing) {
      try {
        if (order.status === 'REFUNDED' && status !== 'REFUNDED') throw new Error('Refunded order cannot move backwards');
        await recordOrderStatus(order.id,status,admin.userId,note);
        if (status === 'DELIVERED') await emitOrderEvent(order.id,'DELIVERED');
        results.push({id:order.id,ok:true});
      } catch (error) {
        results.push({id:order.id,ok:false,error:error instanceof Error ? error.message : 'Unable to update'});
      }
    }
    const failed = results.filter(x=>!x.ok);
    return NextResponse.json({updated:results.length-failed.length,failed,results});
  } catch (error) {
    const forbidden = error instanceof Error && (error.message.includes('FORBIDDEN') || error.message.includes('FORBIDDEN_PERMISSION'));
    return NextResponse.json({error:forbidden?'Forbidden':'Unable to process bulk order update'},{status:forbidden?403:500});
  }
}
