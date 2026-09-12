import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Promotional content is owned by Priyasa Core/Admin. Store has no local commerce DB.
// Keep this compatibility endpoint fail-closed until a public storefront promo endpoint is exposed by Core.
export async function GET() {
  return NextResponse.json({ active: false }, { headers: { 'Cache-Control': 'no-store' } });
}
