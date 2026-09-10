import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

const schema = z.object({
  items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
  coupon: z.string().trim().max(40).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid cart data', details: parsed.error.flatten() }, { status: 400 });

  const token = (await cookies()).get('priyasa_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Please sign in to validate checkout.' }, { status: 401 });

  try {
    const { response, body } = await priyasaApi('/api/v1/storefront/checkout/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ coupon_code: parsed.data.coupon || null }),
    });
    if (!response.ok) return NextResponse.json({ error: apiError(body, 'Unable to validate your bag') }, { status: response.status });

    const quote: any = (body as any)?.data || body;
    const total = Number(quote?.grand_total || 0);
    return NextResponse.json({
      subtotal: Number(quote?.subtotal || 0),
      discount: Number(quote?.discount_total || 0),
      shipping: Number(quote?.shipping_total || 0),
      tax: Number(quote?.tax_total || 0),
      total,
      coupon: quote?.coupon || null,
      onlinePaymentDiscount: 0,
      onlinePaymentTotal: total,
      codAvailable: true,
      items: Array.isArray(quote?.lines) ? quote.lines.map((line: any) => ({
        variantId: String(line?.variant_id ?? line?.variant?.id ?? ''),
        unitPrice: Number(line?.unit_price ?? line?.price ?? 0),
        available: Number(line?.available ?? 0),
      })) : [],
    });
  } catch (error) {
    return NextResponse.json({ error: apiError(error, 'Unable to calculate your order') }, { status: 502 });
  }
}
