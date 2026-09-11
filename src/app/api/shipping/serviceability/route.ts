import { NextResponse } from 'next/server';
import { z } from 'zod';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

const schema = z.object({
  pincode: z.string().regex(/^\d{6}$/),
  payment_method: z.enum(['cod', 'razorpay']).default('razorpay'),
});

function normalize(body: any, pincode: string, paymentMethod: string) {
  const data = body?.data ?? body ?? {};
  const options = Array.isArray(data.options) ? data.options : [];
  const first = options[0];
  return {
    serviceable: Boolean(data.serviceable),
    pincode,
    paymentMethod,
    codAvailable: paymentMethod === 'cod' && Boolean(data.serviceable),
    etaDays: first?.estimated_days ?? null,
    shippingCharge: first?.freight_charge ?? null,
    courier: first?.courier_name ?? null,
    couriers: options,
    message: data.serviceable
      ? 'Delivery is available at this pincode.'
      : 'Sorry, delivery is not available at this pincode.',
  };
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ serviceable: false, error: 'Enter a valid 6-digit delivery pincode.' }, { status: 400 });
  try {
    const { response, body } = await priyasaApi('/api/v1/storefront/shipping/serviceability', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
    if (!response.ok) return NextResponse.json({ serviceable: false, error: apiError(body, 'Unable to check delivery right now.') }, { status: response.status });
    return NextResponse.json(normalize(body, parsed.data.pincode, parsed.data.payment_method), {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } catch (error) {
    return NextResponse.json({ serviceable: false, error: apiError(error, 'Delivery service is temporarily unavailable.') }, { status: 502 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pincode = (url.searchParams.get('pincode') || '').replace(/\D/g, '');
  const payment_method = url.searchParams.get('cod') === '1' ? 'cod' : 'razorpay';
  return POST(new Request(req.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pincode, payment_method }),
  }));
}
