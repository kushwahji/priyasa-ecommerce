import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { authenticateCustomApi, finishCustomApi } from '@/lib/custom-api-auth';
import { serializeOrder, orderInclude } from '@/lib/custom-api-orders';
import { queueConnectionEvent } from '@/lib/custom-api';

export async function GET(req: Request) {
  const a = await authenticateCustomApi(req, 'orders.read');
  if (a.response) return a.response;
  const u = new URL(req.url);
  const page = Math.max(1, Number(u.searchParams.get('page') || 1));
  const per = Math.min(100, Math.max(1, Number(u.searchParams.get('per_page') || 50)));
  const where: any = {};
  for (const k of ['status', 'created_after', 'created_before', 'updated_after', 'updated_before'] as const) {
    const v = u.searchParams.get(k);
    if (!v) continue;
    if (k === 'status') where.status = String(v).toUpperCase();
    else {
      const field = k.startsWith('created') ? 'createdAt' : 'updatedAt';
      const date = new Date(v);
      if (Number.isNaN(date.getTime())) {
        await finishCustomApi(req, a.connection, 400);
        return NextResponse.json({ success: false, error: `Invalid ${k} date` }, { status: 400 });
      }
      where[field] = { [k.endsWith('after') ? 'gte' : 'lte']: date };
    }
  }
  const [rows, total] = await Promise.all([
    db.order.findMany({ where, include: orderInclude, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * per, take: per }),
    db.order.count({ where }),
  ]);
  await finishCustomApi(req, a.connection, 200);
  return NextResponse.json({ success: true, data: await Promise.all(rows.map(serializeOrder)), pagination: { page, per_page: per, total, total_pages: Math.ceil(total / per) } });
}

export async function POST(req: Request) {
  const a = await authenticateCustomApi(req, 'orders.write');
  if (a.response) return a.response;
  const idem = req.headers.get('idempotency-key')?.trim();
  if (!idem) {
    await finishCustomApi(req, a.connection, 400);
    return NextResponse.json({ success: false, error: 'Idempotency-Key header required' }, { status: 400 });
  }
  const b = await req.json().catch(() => null);
  if (!b || !Array.isArray(b.items) || !b.items.length || !b.customer?.phone || !b.shipping?.postcode) {
    await finishCustomApi(req, a.connection, 400);
    return NextResponse.json({ success: false, error: 'customer.phone, shipping.postcode and items are required' }, { status: 400 });
  }
  const key = `custom:${a.connection!.id}:${idem}`;
  const requestHash = JSON.stringify(b);
  try {
    const result = await db.$transaction(async tx => {
      const prior = await tx.idempotencyKey.findUnique({ where: { key } });
      if (prior?.response) return { data: prior.response as any, order: null };
      await tx.idempotencyKey.create({ data: { key, scope: 'custom-api-order', requestHash, expiresAt: new Date(Date.now() + 86400000) } }).catch(async () => {
        const raced = await tx.idempotencyKey.findUnique({ where: { key } });
        if (raced?.response) throw new Error(`IDEMPOTENT:${JSON.stringify(raced.response)}`);
        throw new Error('IDEMPOTENCY_IN_PROGRESS');
      });
      let user = await tx.user.findFirst({ where: { phone: b.customer.phone } });
      if (!user) user = await tx.user.create({ data: { phone: b.customer.phone, email: b.customer.email || null, name: [b.customer.first_name, b.customer.last_name].filter(Boolean).join(' ') || null } });
      const address = await tx.address.create({ data: { userId: user.id, fullName: [b.shipping.first_name, b.shipping.last_name].filter(Boolean).join(' ') || user.name || 'Customer', phone: b.shipping.phone || b.customer.phone, line1: b.shipping.address_1 || '', line2: b.shipping.address_2 || null, city: b.shipping.city || '', state: b.shipping.state || '', pincode: b.shipping.postcode } });
      let subtotal = 0;
      const items: any[] = [];
      for (const i of b.items) {
        if (!Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 20) throw new Error('Each item quantity must be between 1 and 20.');
        const where = i.variant_id ? { id: i.variant_id } : i.sku ? { sku: i.sku } : i.product_id ? { productId: i.product_id } : null;
        if (!where) throw new Error('Each item requires variant_id, sku or product_id.');
        let v = await tx.productVariant.findFirst({ where, include: { product: true } });
        if (!v && i.product_id) v = await tx.productVariant.findFirst({ where: { productId: i.product_id, stock: { gt: 0 } }, orderBy: { stock: 'desc' }, include: { product: true } });
        if (!v || !v.product.active) throw new Error(`Product is unavailable: ${i.product_id || i.sku || i.variant_id}`);
        const price = typeof v.price === 'number' && v.price > 0 ? v.price : v.product.salePrice;
        const changed = await tx.$executeRaw(Prisma.sql`UPDATE ProductVariant SET stock = stock - ${i.quantity} WHERE id = ${v.id} AND stock >= ${i.quantity}`);
        if (changed !== 1) throw new Error(`Insufficient stock for ${i.product_id || i.sku || i.variant_id}`);
        subtotal += price * i.quantity;
        items.push({ variantId: v.id, productName: v.product.name, sku: v.sku, size: v.size, color: v.color, unitPrice: price, quantity: i.quantity });
        await tx.inventoryMovement.create({ data: { variantId: v.id, quantity: -i.quantity, reason: 'SALE', referenceId: key } });
      }
      const order = await tx.order.create({ data: { orderNumber: `ORD-${Date.now().toString().slice(-10)}-${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`, userId: user.id, addressId: address.id, subtotal, shipping: 0, discount: 0, tax: 0, total: subtotal, status: 'CREATED', fulfillmentStatus: 'UNFULFILLED', items: { create: items }, payment: { create: { provider: b.payment?.method || 'custom_api', amount: subtotal, status: 'PENDING' } } }, include: orderInclude });
      const data = { success: true, data: { id: order.id, number: order.orderNumber, status: 'pending', payment_status: 'pending', total: order.total, currency: 'INR' } };
      await tx.idempotencyKey.update({ where: { key }, data: { orderId: order.id, response: data } });
      return { data, order };
    });
    if (result.order) await queueConnectionEvent('order.created', await serializeOrder(result.order));
    await finishCustomApi(req, a.connection, result.order ? 201 : 200);
    return NextResponse.json(result.data, { status: result.order ? 201 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create custom order';
    if (message.startsWith('IDEMPOTENT:')) return NextResponse.json(JSON.parse(message.slice(11)));
    await finishCustomApi(req, a.connection, 409);
    return NextResponse.json({ success: false, error: message }, { status: 409 });
  }
}
