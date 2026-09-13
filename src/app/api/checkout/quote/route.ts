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
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ coupon_code: parsed.data.coupon || null }),
    });
    if (!response.ok) return NextResponse.json({ error: apiError(body, 'Unable to validate your bag') }, { status: response.status });
    const quote: any = (body as any)?.data || body;
    const subtotal = Number(quote?.subtotal ?? quote?.sub_total ?? 0);
    const discount = Number(quote?.discount_total ?? quote?.discount ?? 0);
    const shipping = Number(quote?.shipping_total ?? quote?.shipping ?? 0);
    const tax = Number(quote?.tax_total ?? quote?.tax ?? 0);
    const total = Number(quote?.grand_total ?? quote?.grandTotal ?? quote?.total ?? Math.max(0, subtotal - discount + shipping + tax));
    return NextResponse.json({
      subtotal, discount, shipping, tax, total,
      coupon: quote?.coupon ?? quote?.coupon_code ?? null,
      onlinePaymentDiscount: 0, onlinePaymentTotal: total,
      codAvailable: quote?.cod_available !== false,
      items: Array.isArray(quote?.lines) ? quote.lines.map((line: any) => ({ variantId: String(line?.variant_id ?? line?.variantId ?? line?.variant?.id ?? ''), unitPrice: Number(line?.unit_price ?? line?.unitPrice ?? line?.price ?? 0), available: Number(line?.available ?? line?.available_quantity ?? 0) })) : [],
    });
  } catch (error) {
    return NextResponse.json({ error: apiError(error, 'Unable to calculate your order') }, { status: 502 });
  }
}
