import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

const PUBLIC = new Set(['home', 'cms', 'settings', 'categories', 'collections', 'products', 'shipping/serviceability']);
const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export async function ALL(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const method = req.method.toUpperCase();
  if (!METHODS.has(method)) return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  const { path } = await params;
  const segments = Array.isArray(path) ? path : [];
  if (!segments.length) return NextResponse.json({ error: 'Storefront endpoint required' }, { status: 400 });
  const endpoint = segments.join('/');
  const root = segments[0];
  if (!PUBLIC.has(root)) {
    const token = (await cookies()).get('priyasa_access_token')?.value;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const headers = new Headers();
  const incomingToken = (await cookies()).get('priyasa_access_token')?.value;
  if (incomingToken) headers.set('Authorization', `Bearer ${incomingToken}`);
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  const idempotency = req.headers.get('idempotency-key');
  if (idempotency) headers.set('Idempotency-Key', idempotency);

  const body = method === 'GET' || method === 'DELETE' ? undefined : await req.text();
  try {
    const { response, body: result } = await priyasaApi(`/api/v1/storefront/${endpoint}${req.nextUrl.search}`, { method, headers, body });
    return NextResponse.json(result ?? {}, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: apiError(error, 'Storefront API unavailable') }, { status: 502 });
  }
}

export { ALL as GET, ALL as POST, ALL as PUT, ALL as PATCH, ALL as DELETE };
