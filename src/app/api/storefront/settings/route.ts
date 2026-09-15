import { NextResponse } from 'next/server';
import { getStorefrontSettings } from '@/lib/storefront-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getStorefrontSettings();
  return NextResponse.json({ data: settings }, {
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
