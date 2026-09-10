import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const defaults = {
  siteTitle: 'PRIYASA — Every You, Beautiful',
  headerDesktopLogo: '/images/priyasa-logo.svg',
  headerMobileLogo: '/images/priyasa-icon.svg',
  footerDesktopLogo: '/images/priyasa-logo.svg',
  footerMobileLogo: '/images/priyasa-icon.svg',
};

export async function GET() {
  try {
    const rows = await db.cmsSection.findMany({ where: { key: { startsWith: 'site.setting.' } } });
    const data = { ...defaults };
    for (const row of rows) {
      const key = row.key.replace('site.setting.', '') as keyof typeof data;
      if (key in data) data[key] = key === 'siteTitle' ? (row.title || data[key]) : (row.imageUrl || data[key]);
    }
    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ data: defaults }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
