import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { priyasaApi, apiError } from '@/lib/priyasa-api';
import { db } from '@/lib/db';
const schema = z.object({ items: z.array(z.object({ variantId: z.string(), quantity: z.number().int().min(1).max(20) })).min(1).max(50), coupon: z.string().trim().max(40).optional(), pincode: z.string().regex(/^\d{6}$/).optional() });
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid cart data', details: parsed.error.flatten() }, { status: 400 });
  const token = (await cookies()).get('priyasa_access_token')?.value || '';
  try {
    if (token) {
      const { response, body } = await priyasaApi('/api/v1/storefront/checkout/validate', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ coupon_code: parsed.data.coupon || null }) });
      if (!response.ok) return NextResponse.json({ error: apiError(body, 'Unable to validate your bag') }, { status: response.status });
      const quote = body?.data || body;
      return NextResponse.json({ subtotal: Number(quote?.subtotal || 0), discount: Number(quote?.discount_total || 0), shipping: Number(quote?.shipping_total || 0), tax: Number(quote?.tax_total || 0), total: Number(quote?.grand_total || 0), coupon: quote?.coupon || null, onlinePaymentDiscount: 0, onlinePaymentTotal: Number(quote?.grand_total || 0), codAvailable: true, items: (quote?.lines || []).map((line: any) => ({ variantId: String(line?.variant_id ?? line?.variant?.id ?? ''), unitPrice: Number(line?.unit_price || line?.price || 0), available: Number(line?.available || 0) })) });
    }
    const ids = [...new Set(parsed.data.items.map(x => x.variantId))];
    const variants = await db.productVariant.findMany({ where: { id: { in: ids } }, include: { product: true } });
    if (variants.length !== ids.length) return NextResponse.json({ error: 'One or more products are no longer available. Refresh your bag.' }, { status: 409 });
    const lines = parsed.data.items.map(i => ({ i, v: variants.find(v => v.id === i.variantId)! }));
    const unavailable = lines.find(x => x.i.quantity > x.v.stock - x.v.reserved);
    if (unavailable) return NextResponse.json({ error: `${unavailable.v.product.name} has only ${Math.max(0, unavailable.v.stock - unavailable.v.reserved)} available.` }, { status: 409 });
    const subtotal = lines.reduce((s, x) => s + Number(x.v.price ?? x.v.product.salePrice ?? 0) * x.i.quantity, 0);
    let discount = 0; let coupon = null;
    if (parsed.data.coupon) { const c = await db.coupon.findUnique({ where: { code: parsed.data.coupon.toUpperCase() } }); const now = new Date(); if (c && c.active && now >= c.startsAt && now <= c.endsAt && subtotal >= c.minCart && (!c.maxUses || c.usedCount < c.maxUses)) { coupon = c.code; discount = c.type === 'PERCENTAGE' ? Math.floor(subtotal * c.value / 100) : Math.min(c.value, subtotal); } }
    const shipping = subtotal - discount >= 999 ? 0 : 99; const total = Math.max(0, subtotal - discount) + shipping;
    return NextResponse.json({ subtotal, discount, shipping, tax: 0, total, coupon, onlinePaymentDiscount: 0, onlinePaymentTotal: total, codAvailable: true, items: lines.map(x => ({ variantId: x.v.id, unitPrice: Number(x.v.price ?? x.v.product.salePrice ?? 0), available: x.v.stock - x.v.reserved })) });
  } catch (error) { return NextResponse.json({ error: apiError(error, 'Unable to calculate your order') }, { status: 502 }); }
}
