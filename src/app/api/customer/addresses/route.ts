import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

const endpoint = '/api/v1/storefront/addresses';

async function request(method: string, body?: unknown) {
  const jar = await cookies();
  const token = jar.get('priyasa_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { response, body: result } = await priyasaApi(endpoint, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) return NextResponse.json({ error: apiError(result, 'Unable to update address.'), details: result }, { status: response.status });
  return NextResponse.json((result as any)?.data ?? result, { status: response.status });
}

export async function GET() { return request('GET'); }
export async function POST(req: Request) { return request('POST', await req.json().catch(() => null)); }
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { id: _id, ...payload } = body;
  return request('PATCH', { ...payload, id });
}
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const jar = await cookies();
  const token = jar.get('priyasa_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { response, body: result } = await priyasaApi(`${endpoint}/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) return NextResponse.json({ error: apiError(result, 'Unable to delete address.'), details: result }, { status: response.status });
  return NextResponse.json((result as any)?.data ?? result);
}
