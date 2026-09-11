import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

const item = z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) });
const body = z.object({ items: z.array(item).max(100), couponCode: z.string().trim().max(40).optional() });

async function token() { return (await cookies()).get('priyasa_access_token')?.value || ''; }
function headers(value: string): HeadersInit { return value ? { Authorization: `Bearer ${value}` } : {}; }

type CartItem = { id: string; variantId: string; productId: string; name: string; price: number; quantity: number; image: string };
type Cart = { id: string; couponCode: string | null; items: CartItem[] };

function mapCart(data: any): Cart | null {
  const cart = data?.data || data || null;
  if (!cart) return null;
  return {
    id: String(cart.id), couponCode: cart.coupon_code || cart.couponCode || null,
    items: Array.isArray(cart.items) ? cart.items.map((i: any): CartItem => ({
      id: String(i.id), variantId: String(i.variant_id ?? i.variantId ?? i.variant?.id),
      productId: String(i.variant?.product_id ?? i.variant?.product?.id ?? i.product_id ?? ''),
      name: i.variant?.product?.name || i.product?.name || 'Product',
      price: Number(i.unit_price ?? i.variant?.price ?? i.variant?.product?.price ?? 0),
      quantity: Number(i.quantity || 0), image: i.variant?.image_url || i.variant?.product?.media?.[0]?.url || '',
    })) : [],
  };
}

export async function GET() {
  const accessToken = await token();
  if (!accessToken) return NextResponse.json({ data: null, authenticated: false });
  try {
    const result = await priyasaApi('/api/v1/storefront/cart', { headers: headers(accessToken) });
    if (!result.response.ok) return NextResponse.json({ error: apiError(result.body, 'Unable to load cart') }, { status: result.response.status });
    return NextResponse.json({ data: mapCart(result.body), authenticated: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return NextResponse.json({ error: apiError(error, 'Unable to load cart') }, { status: 502 }); }
}

export async function PUT(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid cart', details: parsed.error.flatten() }, { status: 400 });
  const accessToken = await token();
  if (!accessToken) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  try {
    const currentResponse = await priyasaApi('/api/v1/storefront/cart', { headers: headers(accessToken) });
    if (!currentResponse.response.ok) return NextResponse.json({ error: apiError(currentResponse.body, 'Unable to load cart') }, { status: currentResponse.response.status });
    const current = mapCart(currentResponse.body) || { id: '', couponCode: null, items: [] };
    const target = parsed.data.items;
    const currentByVariant = new Map<string, CartItem>(current.items.map((entry: CartItem) => [String(entry.variantId), entry]));
    const targetByVariant = new Map<string, (typeof target)[number]>(target.map((entry) => [String(entry.variantId), entry]));
    for (const next of target) {
      const existing = currentByVariant.get(String(next.variantId));
      const result = existing
        ? await priyasaApi(`/api/v1/storefront/cart/items/${encodeURIComponent(existing.id)}`, { headers: headers(accessToken), method: 'PATCH', body: JSON.stringify({ quantity: next.quantity }) })
        : await priyasaApi('/api/v1/storefront/cart/items', { headers: headers(accessToken), method: 'POST', body: JSON.stringify({ variant_id: Number(next.variantId), quantity: next.quantity }) });
      if (!result.response.ok) return NextResponse.json({ error: apiError(result.body, 'Unable to update your bag') }, { status: result.response.status });
    }
    for (const existing of current.items) if (!targetByVariant.has(String(existing.variantId))) {
      const result = await priyasaApi(`/api/v1/storefront/cart/items/${encodeURIComponent(existing.id)}`, { headers: headers(accessToken), method: 'DELETE' });
      if (!result.response.ok) return NextResponse.json({ error: apiError(result.body, 'Unable to remove an item') }, { status: result.response.status });
    }
    const refreshed = await priyasaApi('/api/v1/storefront/cart', { headers: headers(accessToken) });
    if (!refreshed.response.ok) return NextResponse.json({ error: apiError(refreshed.body, 'Cart updated but could not be reloaded') }, { status: refreshed.response.status });
    return NextResponse.json({ ok: true, data: mapCart(refreshed.body) });
  } catch (error) { return NextResponse.json({ error: apiError(error, 'Unable to save cart') }, { status: 502 }); }
}
