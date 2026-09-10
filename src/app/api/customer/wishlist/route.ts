import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

const endpoint = '/api/v1/storefront/wishlist';

async function token() { return (await cookies()).get('priyasa_access_token')?.value; }

export async function GET() {
  const auth = await token();
  if (!auth) return NextResponse.json({ data: [], authenticated: false });
  const { response, body } = await priyasaApi(endpoint, { method: 'GET', headers: { Authorization: `Bearer ${auth}` } });
  if (!response.ok) return NextResponse.json({ error: apiError(body, 'Unable to load wishlist.'), details: body }, { status: response.status });
  return NextResponse.json((body as any)?.data ?? body);
}

export async function POST(req: Request) {
  const auth = await token();
  if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const input = await req.json().catch(() => ({}));
  if (!input?.variantId && !input?.productId) return NextResponse.json({ error: 'variantId or productId required' }, { status: 400 });
  const { response, body } = await priyasaApi(endpoint, {
    method: 'POST', headers: { Authorization: `Bearer ${auth}` }, body: JSON.stringify(input),
  });
  if (!response.ok) return NextResponse.json({ error: apiError(body, 'Unable to update wishlist.'), details: body }, { status: response.status });
  return NextResponse.json((body as any)?.data ?? body, { status: response.status });
}

export async function DELETE(req: Request) {
  const auth = await token();
  if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const url = new URL(req.url);
  const variantId = url.searchParams.get('variantId');
  const productId = url.searchParams.get('productId');
  if (!variantId && !productId) return NextResponse.json({ error: 'variantId or productId required' }, { status: 400 });
  const query = new URLSearchParams(variantId ? { variantId } : { productId: productId! });
  const { response, body } = await priyasaApi(`${endpoint}?${query.toString()}`, { method: 'DELETE', headers: { Authorization: `Bearer ${auth}` } });
  if (!response.ok) return NextResponse.json({ error: apiError(body, 'Unable to remove wishlist item.'), details: body }, { status: response.status });
  return NextResponse.json((body as any)?.data ?? body);
}
