import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get('priyasa_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Order id required' }, { status: 400 });
  const { response, body } = await priyasaApi(`/api/v1/storefront/orders/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return NextResponse.json({ error: apiError(body, 'Unable to load order.'), details: body }, { status: response.status });
  return NextResponse.json(body);
}
