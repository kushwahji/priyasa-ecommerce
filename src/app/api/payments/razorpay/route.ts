import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

export async function POST(req: Request) {
  const jar = await cookies();
  const token = jar.get('priyasa_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { orderId } = await req.json().catch(() => ({}));
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });
  const { response, body: result } = await priyasaApi(`/api/v1/storefront/orders/${encodeURIComponent(String(orderId))}/payment`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ provider: 'razorpay' }),
  });
  if (!response.ok) return NextResponse.json({ error: apiError(result, 'Unable to start payment.'), details: result }, { status: response.status });
  const data = (result as any)?.data ?? result;
  return NextResponse.json({
    keyId: data?.key_id ?? data?.keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    razorpayOrderId: data?.razorpay_order_id ?? data?.provider_order_id ?? data?.order_id,
    amount: data?.amount,
    currency: data?.currency || 'INR',
    orderNumber: data?.order_number ?? data?.orderNumber,
  });
}
