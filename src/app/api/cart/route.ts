import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

const item = z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) });
const body = z.object({ items: z.array(item).max(100), couponCode: z.string().trim().max(40).optional() });
type CartItem = { id: string; variantId: string; productId: string; name: string; price: number; quantity: number; image: string };
type Cart = { id: string; couponCode: string | null; items: CartItem[] };
async function upstreamToken() { return (await cookies()).get('priyasa_access_token')?.value || ''; }
function authHeaders(token: string): HeadersInit { return token ? { Authorization: `Bearer ${token}` } : {}; }
function mapUpstreamCart(data: any): Cart | null {
  const cart = data?.data || data || null; if (!cart) return null;
  return { id: String(cart.id), couponCode: cart.coupon_code || cart.couponCode || null, items: Array.isArray(cart.items) ? cart.items.map((i: any): CartItem => ({ id: String(i.id), variantId: String(i.variant_id ?? i.variantId ?? i.variant?.id ?? ''), productId: String(i.variant?.product_id ?? i.variant?.product?.id ?? i.product_id ?? i.productId ?? ''), name: i.variant?.product?.name || i.product?.name || i.name || 'Product', price: Number(i.unit_price ?? i.variant?.price ?? i.variant?.product?.price ?? i.price ?? 0), quantity: Number(i.quantity || 0), image: i.variant?.image_url || i.variant?.imageUrl || i.variant?.image || i.variant?.product?.media?.[0]?.url || i.variant?.product?.images?.[0]?.url || '' })).filter((i: CartItem) => i.variantId && i.quantity > 0) : [] };
}
export async function GET() {
  const token = await upstreamToken(); if (!token) return NextResponse.json({ data: null });
  try { const { response, body: result } = await priyasaApi('/api/v1/storefront/cart', { headers: authHeaders(token) }); if (!response.ok) return NextResponse.json({ error: apiError(result, 'Unable to load cart') }, { status: response.status }); return NextResponse.json({ data: mapUpstreamCart(result) }); }
  catch (error) { return NextResponse.json({ error: apiError(error, 'Unable to load cart') }, { status: 502 }); }
}
export async function PUT(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: 'Invalid cart', details: parsed.error.flatten() }, { status: 400 });
  const token = await upstreamToken(); if (!token) return NextResponse.json({ ok: true, data: null });
  try {
    const currentResponse = await priyasaApi('/api/v1/storefront/cart', { headers: authHeaders(token) });
    if (!currentResponse.response.ok) return NextResponse.json({ error: apiError(currentResponse.body, 'Unable to load cart') }, { status: currentResponse.response.status });
    const current = mapUpstreamCart(currentResponse.body) || { id: '', couponCode: null, items: [] }; const target = parsed.data.items; const currentByVariant = new Map(current.items.map((i: CartItem) => [String(i.variantId), i])); const targetByVariant = new Map(target.map((i) => [String(i.variantId), i]));
    for (const next of target) {
      const existing = currentByVariant.get(String(next.variantId));
      const result = existing
        ? await priyasaApi(`/api/v1/storefront/cart/items/${encodeURIComponent(existing.id)}`, { headers: authHeaders(token), method: 'PATCH', body: JSON.stringify({ quantity: next.quantity }) })
        : await priyasaApi('/api/v1/storefront/cart/items', { headers: authHeaders(token), method: 'POST', body: JSON.stringify({ variant_id: /^\d+$/.test(next.variantId) ? Number(next.variantId) : next.variantId, quantity: next.quantity }) });
      if (!result.response.ok) return NextResponse.json({ error: apiError(result.body, 'Unable to update your bag') }, { status: result.response.status });
    }
    for (const existing of current.items) if (!targetByVariant.has(String(existing.variantId))) { const result = await priyasaApi(`/api/v1/storefront/cart/items/${encodeURIComponent(existing.id)}`, { headers: authHeaders(token), method: 'DELETE' }); if (!result.response.ok) return NextResponse.json({ error: apiError(result.body, 'Unable to remove an item') }, { status: result.response.status }); }
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: apiError(error, 'Unable to save cart') }, { status: 502 }); }
}
