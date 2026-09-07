import { NextResponse } from 'next/server';
import { shiprocket } from '@/lib/shipping/shiprocket';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pincode = (url.searchParams.get('pincode') || '').replace(/\D/g, '');
  const weightGrams = Math.max(100, Number(url.searchParams.get('weightGrams') || 500));
  const cod = url.searchParams.get('cod') === '1';
  const pickupPincode = (process.env.SHIPROCKET_PICKUP_PINCODE || '').replace(/\D/g, '');

  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ serviceable: false, message: 'Enter a valid 6-digit delivery pincode.' }, { status: 400 });
  }
  if (!/^\d{6}$/.test(pickupPincode)) {
    return NextResponse.json({ serviceable: false, message: 'Shipping pickup pincode is not configured.' }, { status: 503 });
  }

  try {
    const result = await shiprocket.checkPincode({ pickupPincode, deliveryPincode: pincode, weightGrams, cod });
    return NextResponse.json({
      serviceable: result.serviceable,
      pincode,
      etaDays: result.etaDays,
      etaText: result.etaDays ? `Delivery in ${result.etaDays} days` : undefined,
      shippingCharge: result.amount,
      courier: result.courier,
      couriers: result.couriers,
      codAvailable: result.codAvailable,
      message: result.serviceable ? 'Delivery is available at this pincode.' : 'Sorry, delivery is not available at this pincode.'
    }, { headers: { 'Cache-Control': 'private, max-age=60' } });
  } catch (error) {
    console.error('[PRIYASA SHIPPING] serviceability failed', error instanceof Error ? error.message : error);
    return NextResponse.json({ serviceable: false, message: 'Unable to check delivery right now. Please try again.' }, { status: 502 });
  }
}
