import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

const schema = z.object({ reason: z.string().trim().min(5).max(255) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get('priyasa_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Order id required' }, { status: 400 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Please provide a return reason.' }, { status: 400 });

  const idempotencyKey = req.headers.get('idempotency-key') || crypto.randomUUID();
  const { response, body } = await priyasaApi(`/api/v1/storefront/orders/${encodeURIComponent(id)}/returns`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ reason: parsed.data.reason }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: apiError(body, 'Unable to request return.'), details: body }, { status: response.status });
  }

  return NextResponse.json((body as any)?.data ?? body, { status: 201 });
}
