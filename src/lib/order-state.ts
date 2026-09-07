import { db } from '@/lib/db';

export async function recordOrderStatus(orderId: string, toStatus: any, actorId?: string, note?: string) {
  return db.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status === toStatus) return order;
    const updated = await tx.order.update({ where: { id: orderId }, data: { status: toStatus } });
    await tx.orderStatusHistory.create({ data: { orderId, fromStatus: order.status, toStatus, actorId, note } });
    await tx.auditLog.create({ data: { userId: actorId, action: 'ORDER_STATUS_CHANGED', entity: 'Order', entityId: orderId, metadata: { from: order.status, to: toStatus, note } } });
    return updated;
  });
}

export async function recordFulfillmentStatus(orderId: string, status: any, note?: string) {
  const order = await db.order.update({ where: { id: orderId }, data: { fulfillmentStatus: status } });
  await db.auditLog.create({ data: { action: 'FULFILLMENT_STATUS_CHANGED', entity: 'Order', entityId: orderId, metadata: { status, note } } });
  return order;
}
