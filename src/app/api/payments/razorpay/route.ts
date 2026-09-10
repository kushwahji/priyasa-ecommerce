import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

export async function POST(req: Request) {
  const token = (await cookies()).get('priyasa_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const input = await req.json().catch(() => null) as Record<string, unknown> | null;
  const orderId = typeof input?.orderId === 'string' ? input.orderId : '';
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  const idempotencyKey = req.headers.get('idempotency-key') || crypto.randomUUID();
  const { response, body: result } = await priyasaApi(
    `/api/v1/storefront/orders/${encodeURIComponent(orderId)}/payment`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ provider: 'razorpay' }),
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: apiError(result, 'Unable to start payment.'), details: result },
      { status: response.status },
    );
  }

  const data = (result as any)?.data ?? result;
  const keyId = data?.key_id ?? data?.keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const razorpayOrderId = data?.razorpay_order_id ?? data?.provider_order_id ?? data?.order_id;
  const amount = Number(data?.amount ?? 0);
  const currency = String(data?.currency || 'INR');
  const orderNumber = data?.order_number ?? data?.orderNumber;

  if (!keyId || !razorpayOrderId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Payment gateway returned an incomplete payment order.' }, { status: 502 });
  }

  return NextResponse.json({ keyId, razorpayOrderId, amount, currency, orderNumber });
}
