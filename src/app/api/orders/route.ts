import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

const PAYMENT_METHODS = new Set(['razorpay', 'cod']);

async function getAuthenticatedAddress(token: string, requestedId: unknown) {
  if (requestedId) return String(requestedId);

  // Checkout may arrive here without an address id when the customer has
  // entered an address but has not selected a saved-address card. Never
  // invent an address: use an existing default/first address only.
  const { response, body } = await priyasaApi('/api/v1/storefront/addresses', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;

  const data = (body as any)?.data ?? body;
  const addresses = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  const preferred = addresses.find((address: any) => Boolean(address?.is_default)) ?? addresses[0];
  return preferred?.id ? String(preferred.id) : null;
}

export async function POST(req: Request) {
  const token = (await cookies()).get('priyasa_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Please sign in with your mobile number before checkout.' }, { status: 401 });

  const input = await req.json().catch(() => null);
  if (!input || typeof input !== 'object') return NextResponse.json({ error: 'Invalid checkout data.' }, { status: 400 });
  const body = input as Record<string, unknown>;

  const shippingAddressId = await getAuthenticatedAddress(token, body.addressId || body.shipping_address_id);
  const couponCode = body.coupon || body.coupon_code || undefined;
  const paymentMethod = String(body.paymentMethod || body.payment_method || 'razorpay').toLowerCase();

  if (!shippingAddressId) return NextResponse.json({ error: 'Please save a delivery address before placing your order.' }, { status: 400 });
  if (!PAYMENT_METHODS.has(paymentMethod)) {
    return NextResponse.json({ error: 'Unsupported payment method. Please choose online payment or Cash on Delivery.' }, { status: 422 });
  }

  const idempotencyKey = req.headers.get('idempotency-key') || crypto.randomUUID();
  const { response, body: result } = await priyasaApi('/api/v1/storefront/checkout/create-order', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({
      shipping_address_id: shippingAddressId,
      coupon_code: couponCode,
      payment_method: paymentMethod,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: apiError(result, 'Unable to create order.'), details: result }, { status: response.status });
  }

  const data = (result as any)?.data ?? result;
  return NextResponse.json({
    ...(typeof data === 'object' && data ? data : {}),
    orderId: data?.order_id ?? data?.orderId ?? data?.id,
    orderNumber: data?.order_number ?? data?.orderNumber,
    total: data?.grand_total ?? data?.total,
    status: data?.status,
    paymentMethod,
  }, { status: 201 });
}
