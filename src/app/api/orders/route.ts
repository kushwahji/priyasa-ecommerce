import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { sha256 } from '@/lib/crypto';
import { debitWallet, ensureWalletTables } from '@/lib/wallet';

const schema = z.object({
  phone: z.string().regex(/^\+?\d{10,15}$/),
  fullName: z.string().trim().min(2).max(120),
  line1: z.string().trim().min(3).max(250),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().regex(/^\d{6}$/),
  addressId: z.string().optional(),
  items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
  coupon: z.string().trim().max(40).optional(),
  paymentMethod: z.enum(['razorpay', 'cod', 'wallet']).default('razorpay'),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid checkout data', details: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const jar = await cookies();
  const userId = jar.get('priyasa_local_user_id')?.value;
  const mobile = jar.get('priyasa_mobile')?.value;
  if (!userId || !mobile) return NextResponse.json({ error: 'Please sign in with your mobile number before checkout.' }, { status: 401 });
  if (data.phone.replace(/\D/g, '').slice(-10) !== mobile.replace(/\D/g, '').slice(-10)) return NextResponse.json({ error: 'Checkout phone does not match the signed-in customer.' }, { status: 403 });
  if (data.paymentMethod === 'cod' && process.env.COD_ENABLED?.trim().toLowerCase() === 'false') return NextResponse.json({ error: 'Cash on Delivery is currently unavailable.' }, { status: 400 });
  if (data.paymentMethod === 'wallet') await ensureWalletTables();

  const key = req.headers.get('idempotency-key') || crypto.randomUUID();
  const hash = sha256(JSON.stringify(data));
  const existing = await db.idempotencyKey.findUnique({ where: { key } });
  if (existing) {
    if (existing.scope !== 'checkout' || existing.requestHash !== hash) return NextResponse.json({ error: 'Idempotency key was reused for different checkout data' }, { status: 409 });
    if (existing.response) return NextResponse.json(existing.response);
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('CUSTOMER_NOT_FOUND');

      const lock = await tx.idempotencyKey.create({ data: { key, scope: 'checkout', requestHash: hash, expiresAt: new Date(Date.now() + 86400000) } }).catch(() => null);
      if (!lock) {
        const prior = await tx.idempotencyKey.findUnique({ where: { key } });
        if (prior?.response) return prior.response as any;
        throw new Error('IDEMPOTENCY_IN_PROGRESS');
      }

      const ids = [...new Set(data.items.map((item) => item.variantId))];
      const variants = await tx.productVariant.findMany({ where: { id: { in: ids }, product: { active: true } }, include: { product: true } });
      if (variants.length !== ids.length) throw new Error('One or more products are unavailable.');
      const lines = data.items.map((item) => ({ item, variant: variants.find((variant) => variant.id === item.variantId)! }));

      for (const line of lines) {
        const updated = await tx.$executeRaw(Prisma.sql`UPDATE ProductVariant SET reserved = reserved + ${line.item.quantity} WHERE id = ${line.variant.id} AND (stock - reserved) >= ${line.item.quantity}`);
        if (updated !== 1) throw new Error(`${line.variant.product.name} is no longer available in the selected quantity.`);
      }

      const subtotal = lines.reduce((sum, line) => sum + (line.variant.price ?? line.variant.product.salePrice) * line.item.quantity, 0);
      let discount = 0;
      let couponCode: string | undefined;
      if (data.coupon) {
        const coupon = await tx.coupon.findUnique({ where: { code: data.coupon.toUpperCase() } });
        const now = new Date();
        if (coupon && coupon.active && now >= coupon.startsAt && now <= coupon.endsAt && subtotal >= coupon.minCart && (!coupon.maxUses || coupon.usedCount < coupon.maxUses)) {
          discount = coupon.type === 'PERCENTAGE' ? Math.floor(subtotal * coupon.value / 100) : Math.min(coupon.value, subtotal);
          const consumed = await tx.$executeRaw(Prisma.sql`UPDATE Coupon SET usedCount = usedCount + 1 WHERE id = ${coupon.id} AND active = 1 AND (maxUses IS NULL OR usedCount < ${coupon.maxUses ?? 2147483647})`);
          if (consumed !== 1) throw new Error('This coupon has just reached its usage limit. Please try another offer.');
          couponCode = coupon.code;
        }
      }

      const shipping = subtotal - discount >= 999 ? 0 : 99;
      const total = Math.max(0, subtotal - discount) + shipping;
      const codMax = Number(process.env.COD_MAX_AMOUNT || '5000');
      if (data.paymentMethod === 'cod' && Number.isFinite(codMax) && total > codMax) throw new Error(`Cash on Delivery is available for orders up to ₹${codMax.toLocaleString('en-IN')}.`);

      let address;
      if (data.addressId) {
        address = await tx.address.findFirst({ where: { id: data.addressId, userId: user.id } });
        if (!address) throw new Error('Saved address not found.');
      } else {
        address = await tx.address.create({ data: { userId: user.id, fullName: data.fullName, phone: user.phone, line1: data.line1, city: data.city, state: data.state, pincode: data.pincode, isDefault: false } });
      }

      const walletPayment = data.paymentMethod === 'wallet';
      const codPayment = data.paymentMethod === 'cod';
      const order = await tx.order.create({
        data: {
          orderNumber: `PRI-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
          userId: user.id,
          addressId: address.id,
          status: codPayment || walletPayment ? 'CONFIRMED' : 'PAYMENT_PENDING',
          fulfillmentStatus: 'UNFULFILLED', subtotal, discount, shipping, tax: 0, total, couponCode,
          items: { create: lines.map((line) => ({ variantId: line.variant.id, productName: line.variant.product.name, sku: line.variant.sku, size: line.variant.size, color: line.variant.color, unitPrice: line.variant.price ?? line.variant.product.salePrice, quantity: line.item.quantity })) },
          payment: { create: { provider: codPayment ? 'cod' : walletPayment ? 'priyasa_wallet' : 'razorpay', amount: total, status: walletPayment ? 'CAPTURED' : 'PENDING', signatureVerified: walletPayment } },
        },
        include: { payment: true },
      });

      if (walletPayment) await debitWallet(user.id, total, order.id, `Payment for ${order.orderNumber}`, tx);
      for (const line of lines) await tx.inventoryMovement.create({ data: { variantId: line.variant.id, quantity: line.item.quantity, reason: 'RESERVE', referenceId: order.id } });
      await tx.orderStatusHistory.create({ data: { orderId: order.id, toStatus: codPayment || walletPayment ? 'CONFIRMED' : 'PAYMENT_PENDING', note: codPayment ? 'COD order placed' : walletPayment ? 'Paid from Priyasa Wallet' : 'Checkout order created' } });

      const response = { orderId: order.id, orderNumber: order.orderNumber, total: order.total, paymentId: order.payment?.id, paymentMethod: data.paymentMethod, status: order.status };
      await tx.idempotencyKey.update({ where: { key }, data: { orderId: order.id, response } });
      return response;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 15000 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const prior = await db.idempotencyKey.findUnique({ where: { key } }).catch(() => null);
    if (prior?.response) return NextResponse.json(prior.response);
    const message = error instanceof Error ? error.message : 'Unable to create order';
    return NextResponse.json({ error: message }, { status: message === 'IDEMPOTENCY_IN_PROGRESS' ? 409 : 409 });
  }
}
