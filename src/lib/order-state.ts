import { db } from '@/lib/db';
import { triggerAutomationEvent } from '@/lib/automation-engine';
import { queueConnectionEvent, toNormalizedStatus } from '@/lib/custom-api';
import { notifyOrderStatus } from '@/lib/customer-notifications';

export async function recordOrderStatus(
  orderId: string,
  toStatus: any,
  actorId?: string,
  note?: string,
  emitExternal = true,
) {
  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
    if (!order) throw new Error('ORDER_NOT_FOUND');

    if (order.status === toStatus) {
      const unchanged = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
      return { updated: unchanged, changed: false, from: order.status };
    }

    const updated = await tx.order.update({ where: { id: orderId }, data: { status: toStatus } });
    await tx.orderStatusHistory.create({ data: { orderId, fromStatus: order.status, toStatus, actorId, note } });
    await tx.auditLog.create({ data: { userId: actorId, action: 'ORDER_STATUS_CHANGED', entity: 'Order', entityId: orderId, metadata: { from: order.status, to: toStatus, note } } });
    return { updated, changed: true, from: order.status };
  });

  if (!result.changed) return result.updated;

  const payload = {
    orderId,
    status: toNormalizedStatus(result.updated.status),
    previousStatus: toNormalizedStatus(result.from),
    note,
  };
  await triggerAutomationEvent('order.status_changed', payload);
  await triggerAutomationEvent(`order.${toNormalizedStatus(result.updated.status)}`, payload);

  // Customer notifications are best-effort: a provider outage must never roll back an order state change.
  try { await notifyOrderStatus(orderId, String(result.updated.status), String(result.from), note); }
  catch (error) { console.error('[PRIYASA notifications] order status delivery failed', error instanceof Error ? error.message : error); }

  if (emitExternal) {
    await queueConnectionEvent('order.updated', payload);
    await queueConnectionEvent(`order.${toNormalizedStatus(result.updated.status)}`, payload);
  }

  return result.updated;
}

export async function recordFulfillmentStatus(orderId: string, status: any, note?: string) {
  const order = await db.order.update({ where: { id: orderId }, data: { fulfillmentStatus: status } });
  await db.auditLog.create({ action: 'FULFILLMENT_STATUS_CHANGED', entity: 'Order', entityId: orderId, metadata: { status, note } });
  return order;
}
