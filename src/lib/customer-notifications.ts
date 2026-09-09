import { db } from '@/lib/db';

const copy: Record<string, { title: string; body: string }> = {
  CREATED: { title: 'Order received', body: 'We received your PRIYASA order and are getting it ready.' },
  PAYMENT_PENDING: { title: 'Payment pending', body: 'Your PRIYASA order is waiting for payment confirmation.' },
  CONFIRMED: { title: 'Order confirmed', body: 'Your PRIYASA order is confirmed. We will start processing it shortly.' },
  PROCESSING: { title: 'Order processing', body: 'Your PRIYASA order is being prepared for dispatch.' },
  SHIPPED: { title: 'Order shipped', body: 'Your PRIYASA order has been shipped. Track it from My Orders.' },
  DELIVERED: { title: 'Order delivered', body: 'Your PRIYASA order has been delivered. We hope you love it.' },
  CANCELLED: { title: 'Order cancelled', body: 'Your PRIYASA order has been cancelled. Any eligible refund will be processed according to the payment method.' },
  RETURN_REQUESTED: { title: 'Return request received', body: 'Your PRIYASA return request has been received and is being reviewed.' },
  RETURNED: { title: 'Return received', body: 'We have received your returned PRIYASA item.' },
  REFUNDED: { title: 'Refund completed', body: 'Your PRIYASA refund has been processed.' },
};

function label(status: string) { return status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()); }

async function deliverEmail(deliveryId: string, email: string, subject: string, body: string, data: Record<string, unknown>) {
  const endpoint = process.env.NOTIFICATION_EMAIL_WEBHOOK_URL?.trim();
  if (!endpoint) return;
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: process.env.NOTIFICATION_EMAIL_WEBHOOK_TOKEN ? `Bearer ${process.env.NOTIFICATION_EMAIL_WEBHOOK_TOKEN}` : '' }, body: JSON.stringify({ to: email, subject, text: body, data }), cache: 'no-store' });
    if (!response.ok) throw new Error(`email provider ${response.status}`);
    await db.notificationDelivery.update({ where: { id: deliveryId }, data: { status: 'SENT', sentAt: new Date() } });
  } catch (error) {
    await db.notificationDelivery.update({ where: { id: deliveryId }, data: { status: 'FAILED', error: error instanceof Error ? error.message : 'Email delivery failed' } });
  }
}

export async function notifyOrderStatus(orderId: string, status: string, previousStatus?: string, note?: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { user: true } });
  if (!order?.userId || !order.user) return;
  const message = copy[status] || { title: `Order ${label(status)}`, body: `Your PRIYASA order is now ${label(status)}.` };
  const data = { orderId, orderNumber: order.orderNumber, status: label(status), previousStatus: previousStatus ? label(previousStatus) : null, note: note || null, url: `/account/orders/${orderId}` };
  const notification = await db.notification.create({ data: { userId: order.user.id, type: `ORDER_${status}`, title: message.title, body: message.body, data } });
  await db.notificationDelivery.create({ data: { notificationId: notification.id, channel: 'IN_APP', status: 'SENT', sentAt: new Date() } });

  if (order.user.email) {
    const delivery = await db.notificationDelivery.create({ data: { notificationId: notification.id, channel: 'EMAIL', status: process.env.NOTIFICATION_EMAIL_WEBHOOK_URL ? 'PENDING' : 'SKIPPED' } });
    if (process.env.NOTIFICATION_EMAIL_WEBHOOK_URL) await deliverEmail(delivery.id, order.user.email, `PRIYASA · ${message.title}`, `${message.body}\n\nOrder: ${order.orderNumber}`, data);
  }

  // WhatsApp is intentionally delivered by SEND_WHATSAPP automation actions. This keeps Meta credentials server-side,
  // avoids duplicate sends, and lets admins choose the approved template for every order-status transition.
  return notification;
}
