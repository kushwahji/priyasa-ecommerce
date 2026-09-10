import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { priyasaApi, apiError } from '@/lib/priyasa-api';
import { db } from '@/lib/db';

const item = z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) });
const body = z.object({ items: z.array(item).max(100), couponCode: z.string().trim().max(40).optional() });
async function upstreamToken() { return (await cookies()).get('priyasa_access_token')?.value || ''; }
function authHeaders(token: string) { return token ? { Authorization: `Bearer ${token}` } : {}; }
function mapUpstreamCart(data: any) {
  const cart = data?.data || data || null;
  return cart ? { id: cart.id, couponCode: cart.coupon_code || cart.couponCode || null, items: (cart.items || []).map((i: any) => ({ id: String(i.id), variantId: String(i.variant_id ?? i.variantId ?? i.variant?.id), productId: String(i.variant?.product_id ?? i.variant?.product?.id ?? i.product_id ?? ''), name: i.variant?.product?.name || i.product?.name || 'Product', price: Number(i.unit_price ?? i.variant?.price ?? i.variant?.product?.price ?? 0), quantity: Number(i.quantity || 0), image: i.variant?.image_url || i.variant?.product?.media?.[0]?.url || '' })) } : null;
}
async function identity() { const c = await cookies(); const userId = c.get('priyasa_local_user_id')?.value; let sessionKey = c.get('priyasa_cart_session')?.value; if (!userId && !sessionKey) sessionKey = crypto.randomUUID(); return { userId, sessionKey }; }
async function guestGet() { const { userId, sessionKey } = await identity(); const cart = await db.cart.findFirst({ where: userId ? { userId } : { sessionKey }, include: { items: { include: { variant: { include: { product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } } } } } } }); return cart ? { id: cart.id, couponCode: cart.couponCode, items: cart.items.map(i => ({ id: String(i.id), variantId: i.variantId, productId: i.variant.productId, name: i.variant.product.name, price: i.variant.price ?? i.variant.product.salePrice, quantity: i.quantity, image: i.variant.product.images[0]?.url || '' })) } : null; }

export async function GET() {
  const token = await upstreamToken();
  try {
    if (token) { const { response, body: result } = await priyasaApi('/api/v1/storefront/cart', { headers: authHeaders(token) }); if (!response.ok) return NextResponse.json({ error: apiError(result, 'Unable to load cart') }, { status: response.status }); return NextResponse.json({ data: mapUpstreamCart(result) }); }
    return NextResponse.json({ data: await guestGet() });
  } catch (error) { return NextResponse.json({ error: apiError(error, 'Unable to load cart') }, { status: 502 }); }
}

export async function PUT(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid cart', details: parsed.error.flatten() }, { status: 400 });
  const token = await upstreamToken();
  try {
    if (token) {
      const currentResponse = await priyasaApi('/api/v1/storefront/cart', { headers: authHeaders(token) });
      if (!currentResponse.response.ok) return NextResponse.json({ error: apiError(currentResponse.body, 'Unable to load cart') }, { status: currentResponse.response.status });
      const current = mapUpstreamCart(currentResponse.body) || { items: [] };
      const target = parsed.data.items;
      const currentByVariant = new Map(current.items.map((i: any) => [String(i.variantId), i]));
      const targetByVariant = new Map(target.map(i => [String(i.variantId), i]));
      for (const next of target) {
        const existing = currentByVariant.get(String(next.variantId));
        const result = existing
          ? await priyasaApi(`/api/v1/storefront/cart/items/${encodeURIComponent(existing.id)}`, { headers: authHeaders(token), method: 'PATCH', body: JSON.stringify({ quantity: next.quantity }) })
          : await priyasaApi('/api/v1/storefront/cart/items', { headers: authHeaders(token), method: 'POST', body: JSON.stringify({ variant_id: Number(next.variantId), quantity: next.quantity }) });
        if (!result.response.ok) return NextResponse.json({ error: apiError(result.body, 'Unable to update your bag') }, { status: result.response.status });
      }
      for (const existing of current.items) if (!targetByVariant.has(String(existing.variantId))) {
        const result = await priyasaApi(`/api/v1/storefront/cart/items/${encodeURIComponent(existing.id)}`, { headers: authHeaders(token), method: 'DELETE' });
        if (!result.response.ok) return NextResponse.json({ error: apiError(result.body, 'Unable to remove an item') }, { status: result.response.status });
      }
      return NextResponse.json({ ok: true });
    }
    const { userId, sessionKey } = await identity(); const ids = [...new Set(parsed.data.items.map(i => i.variantId)); const variants = await db.productVariant.findMany({ where: { id: { in: ids } }, include: { product: true } });
    if (variants.length !== ids.length || variants.some(v => !v.product.active)) return NextResponse.json({ error: 'One or more products are unavailable.' }, { status: 409 });
    for (const i of parsed.data.items) { const v = variants.find(x => x.id === i.variantId)!; if (v.stock - v.reserved < i.quantity) return NextResponse.json({ error: `${v.product.name} has only ${Math.max(0, v.stock - v.reserved)} available.` }, { status: 409 }); }
    let cart = await db.cart.findFirst({ where: userId ? { userId } : { sessionKey } });
    if (cart) cart = await db.cart.update({ where: { id: cart.id }, data: { couponCode: parsed.data.couponCode || null } }); else cart = await db.cart.create({ data: { ...(userId ? { userId } : { sessionKey }), couponCode: parsed.data.couponCode || null } });
    await db.cartItem.deleteMany({ where: { cartId: cart.id } }); if (parsed.data.items.length) await db.cartItem.createMany({ data: parsed.data.items.map(i => ({ cartId: cart.id, variantId: i.variantId, quantity: i.quantity })) });
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: apiError(error, 'Unable to save cart') }, { status: 502 }); }
}
