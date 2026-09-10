import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

export async function POST(req: Request) {
  const jar = await cookies();
  const token = jar.get('priyasa_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const orderId = body?.orderId;
  if (!orderId || !body?.razorpay_order_id || !body?.razorpay_payment_id || !body?.razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
  }
  const { response, body: result } = await priyasaApi(`/api/v1/storefront/orders/${encodeURIComponent(String(orderId))}/payment/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      razorpay_order_id: body.razorpay_order_id,
      razorpay_payment_id: body.razorpay_payment_id,
      razorpay_signature: body.razorpay_signature,
    }),
  });
  if (!response.ok) return NextResponse.json({ error: apiError(result, 'Payment verification failed.'), details: result }, { status: response.status });
  const data = (result as any)?.data ?? result;
  return NextResponse.json({ ok: true, ...((typeof data === 'object' && data) ? data : {}) });
}
