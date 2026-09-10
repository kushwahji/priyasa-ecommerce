import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

export async function POST(req: Request) {
  const token = (await cookies()).get('priyasa_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const orderId = typeof body?.orderId === 'string' ? body.orderId : '';
  const paymentId = typeof body?.razorpay_payment_id === 'string' ? body.razorpay_payment_id : '';
  const razorpayOrderId = typeof body?.razorpay_order_id === 'string' ? body.razorpay_order_id : '';
  const signature = typeof body?.razorpay_signature === 'string' ? body.razorpay_signature : '';

  if (!orderId || !paymentId || !razorpayOrderId || !signature) {
    return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
  }

  const idempotencyKey = req.headers.get('idempotency-key') || crypto.randomUUID();
  const { response, body: result } = await priyasaApi(
    `/api/v1/storefront/orders/${encodeURIComponent(orderId)}/payment/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        provider_payment_id: paymentId,
        payload: {
          razorpay_order_id: razorpayOrderId,
          razorpay_signature: signature,
        },
      }),
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: apiError(result, 'Payment verification failed.'), details: result },
      { status: response.status },
    );
  }

  const data = (result as any)?.data ?? result;
  return NextResponse.json({ ok: true, ...((typeof data === 'object' && data) ? data : {}) });
}
