import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const data = {
  siteTitle: 'PRIYASA — Every You, Beautiful',
  headerDesktopLogo: '/images/priyasa-logo.svg',
  headerMobileLogo: '/images/priyasa-icon.svg',
  footerDesktopLogo: '/images/priyasa-logo.svg',
  footerMobileLogo: '/images/priyasa-icon.svg',
};

export async function GET() {
  return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } });
}
