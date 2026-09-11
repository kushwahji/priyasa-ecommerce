import { NextResponse } from 'next/server';

const defaults = {
  siteTitle: 'PRIYASA — Every You, Beautiful',
  headerDesktopLogo: '/images/priyasa-logo.svg',
  headerMobileLogo: '/images/priyasa-icon.svg',
  footerDesktopLogo: '/images/priyasa-logo.svg',
  footerMobileLogo: '/images/priyasa-icon.svg',
};

/** Public presentation defaults. Commerce/CMS state belongs to PriyasaCore. */
export async function GET() {
  return NextResponse.json({ data: defaults }, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
  });
}
