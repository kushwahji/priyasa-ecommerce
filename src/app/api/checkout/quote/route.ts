import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

const schema = z.object({
  items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
  coupon: z.string().trim().max(40).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
});

type CoreQuote = {
  subtotal?: unknown;
  discount_total?: unknown;
  shipping_total?: unknown;
  tax_total?: unknown;
  grand_total?: unknown;
  coupon?: unknown;
  online_payment_discount?: unknown;
  cod_available?: unknown;
  lines?: unknown;
};

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid cart data', details: parsed.error.flatten() }, { status: 400 });

  const token = (await cookies()).get('priyasa_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Please sign in to validate checkout.' }, { status: 401 });

  try {
    const { response, body } = await priyasaApi('/api/v1/storefront/checkout/validate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({ coupon_code: parsed.data.coupon || null }),
    });
    if (!response.ok) return NextResponse.json({ error: apiError(body, 'Unable to validate your bag') }, { status: response.status });

    const quote = ((body as { data?: CoreQuote })?.data || body) as CoreQuote;
    const total = numberOrZero(quote?.grand_total);
    const lines = Array.isArray(quote?.lines) ? quote.lines : [];

    return NextResponse.json({
      // These values are always taken from PriyasaCore; the browser cart is
      // only a request and is never used as the pricing authority.
      subtotal: numberOrZero(quote?.subtotal),
      discount: numberOrZero(quote?.discount_total),
      shipping: numberOrZero(quote?.shipping_total),
      tax: numberOrZero(quote?.tax_total),
      total,
      coupon: typeof quote?.coupon === 'string' ? quote.coupon : null,
      onlinePaymentDiscount: numberOrZero(quote?.online_payment_discount),
      onlinePaymentTotal: Math.max(0, total - numberOrZero(quote?.online_payment_discount)),
      ...(typeof quote?.cod_available === 'boolean' ? { codAvailable: quote.cod_available } : {}),
      items: lines.map((line: any) => ({
        variantId: String(line?.variant_id ?? line?.variant?.id ?? ''),
        unitPrice: numberOrZero(line?.unit_price ?? line?.price),
        available: numberOrZero(line?.available),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: apiError(error, 'Unable to calculate your order') }, { status: 502 });
  }
}
