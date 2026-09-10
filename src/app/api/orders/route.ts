import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

export async function POST(req: Request) {
  const jar = await cookies();
  const token = jar.get('priyasa_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Please sign in with your mobile number before checkout.' }, { status: 401 });
  const input = await req.json().catch(() => null);
  if (!input || typeof input !== 'object') return NextResponse.json({ error: 'Invalid checkout data.' }, { status: 400 });
  const body = input as Record<string, unknown>;
  const payload = {
    shipping_address_id: body.addressId || body.shipping_address_id,
    coupon_code: body.coupon || body.coupon_code || undefined,
    payment_method: body.paymentMethod || body.payment_method || 'razorpay',
  };
  if (!payload.shipping_address_id) return NextResponse.json({ error: 'Please select a delivery address.' }, { status: 400 });
  const idempotencyKey = req.headers.get('idempotency-key') || crypto.randomUUID();
  const { response, body: result } = await priyasaApi('/api/v1/storefront/checkout/create-order', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(payload),
  });
  if (!response.ok) return NextResponse.json({ error: apiError(result, 'Unable to create order.'), details: result }, { status: response.status });
  const data = (result as any)?.data ?? result;
  return NextResponse.json({
    ...(typeof data === 'object' && data ? data : {}),
    orderId: data?.order_id ?? data?.orderId ?? data?.id,
    orderNumber: data?.order_number ?? data?.orderNumber,
    total: data?.grand_total ?? data?.total,
    status: data?.status,
    paymentMethod: payload.payment_method,
  }, { status: 201 });
}
