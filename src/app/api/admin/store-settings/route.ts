import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const keys = ['siteTitle', 'headerDesktopLogo', 'headerMobileLogo', 'footerDesktopLogo', 'footerMobileLogo'] as const;
const schema = z.object({
  siteTitle: z.string().trim().min(2).max(120),
  headerDesktopLogo: z.string().trim().max(1000).optional().default(''),
  headerMobileLogo: z.string().trim().max(1000).optional().default(''),
  footerDesktopLogo: z.string().trim().max(1000).optional().default(''),
  footerMobileLogo: z.string().trim().max(1000).optional().default(''),
});

const defaults = {
  siteTitle: 'PRIYASA — Every You, Beautiful',
  headerDesktopLogo: '/images/priyasa-logo.svg',
  headerMobileLogo: '/images/priyasa-icon.svg',
  footerDesktopLogo: '/images/priyasa-logo.svg',
  footerMobileLogo: '/images/priyasa-icon.svg',
};

async function readSettings() {
  const rows = await db.cmsSection.findMany({ where: { key: { startsWith: 'site.setting.' } } });
  const result = { ...defaults };
  for (const row of rows) {
    const key = row.key.replace('site.setting.', '') as keyof typeof result;
    if (key in result) result[key] = key === 'siteTitle' ? (row.title || result[key]) : (row.imageUrl || result[key]);
  }
  return result;
}

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ data: await readSettings() });
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid storefront settings', details: parsed.error.flatten() }, { status: 400 });
    const value = parsed.data;
    await db.$transaction(keys.map((key) => db.cmsSection.upsert({
      where: { key: `site.setting.${key}` },
      update: key === 'siteTitle'
        ? { title: value[key], type: 'site-setting', active: true }
        : { imageUrl: value[key] || null, type: 'site-setting', active: true },
      create: key === 'siteTitle'
        ? { key: `site.setting.${key}`, type: 'site-setting', title: value[key], active: true }
        : { key: `site.setting.${key}`, type: 'site-setting', imageUrl: value[key] || null, active: true },
    })));
    return NextResponse.json({ data: await readSettings() });
  } catch {
    return NextResponse.json({ error: 'Unable to save storefront settings' }, { status: 500 });
  }
}
