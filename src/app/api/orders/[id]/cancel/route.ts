import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  const token = jar.get('priyasa_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Please sign in to cancel this order.' }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { response, body: result } = await priyasaApi(`/api/v1/storefront/orders/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reason: typeof body?.reason === 'string' ? body.reason.trim().slice(0, 240) : 'Cancelled by customer' }),
  });
  if (!response.ok) return NextResponse.json({ error: apiError(result, 'Unable to cancel this order.'), details: result }, { status: response.status });
  return NextResponse.json((result as any)?.data ?? result);
}
