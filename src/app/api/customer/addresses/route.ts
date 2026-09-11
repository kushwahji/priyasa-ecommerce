import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

const endpoint = '/api/v1/storefront/addresses';
async function authToken() { return (await cookies()).get('priyasa_access_token')?.value; }
async function proxy(path: string, method: string, token: string, body?: unknown) {
  const { response, body: result } = await priyasaApi(path, { method, headers: { Authorization: `Bearer ${token}` }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  if (!response.ok) return NextResponse.json({ error: apiError(result, 'Unable to update address.'), details: result }, { status: response.status });
  return NextResponse.json((result as any)?.data ?? result, { status: response.status });
}
export async function GET() { const token = await authToken(); if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); return proxy(endpoint, 'GET', token); }
export async function POST(req: Request) {
  const token = await authToken(); if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (body?.action === 'default' && body?.id) return proxy(`${endpoint}/${encodeURIComponent(String(body.id))}/default`, 'POST', token);
  return proxy(endpoint, 'POST', token, body);
}
export async function PATCH(req: Request) {
  const token = await authToken(); if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const body = await req.json().catch(() => ({})); const id = typeof body?.id === 'string' ? body.id : '';
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { id: _id, ...payload } = body; return proxy(`${endpoint}/${encodeURIComponent(id)}`, 'PATCH', token, payload);
}
export async function DELETE(req: Request) {
  const token = await authToken(); if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id'); if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  return proxy(`${endpoint}/${encodeURIComponent(id)}`, 'DELETE', token);
}
