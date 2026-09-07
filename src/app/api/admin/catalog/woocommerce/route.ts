import { NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { finalizeWooCommerceSync, importWooCommerceCatalog, importWooCommercePage, previewWooCommerceImport, syncWooCommerceCatalog } from '@/lib/woocommerce-import';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET() {
  try {
    await requireAdminPermission('products.read');
    return json({ data: await previewWooCommerceImport() });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unable to connect to WooCommerce' }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdminPermission('products.write');
    const body = await req.json().catch(() => ({}));
    const mode = body?.mode || 'import';

    if (mode === 'preview') return json({ data: await previewWooCommerceImport() });

    if (mode === 'import-page' || mode === 'sync-page') {
      const page = Math.max(1, Number(body?.page || 1));
      const perPage = Math.min(20, Math.max(1, Number(body?.perPage || 10)));
      const result = await importWooCommercePage(page, perPage);
      await db.auditLog.create({
        data: {
          userId: session.userId,
          action: mode === 'sync-page' ? 'SYNC_PAGE' : 'IMPORT_PAGE',
          entity: 'WooCommerceCatalog',
          metadata: { result },
        },
      });
      return json({ data: { mode, ...result } });
    }

    if (mode === 'sync-finalize') {
      const slugs = Array.isArray(body?.slugs) ? body.slugs.filter((value: unknown): value is string => typeof value === 'string') : [];
      const result = await finalizeWooCommerceSync(slugs);
      await db.auditLog.create({ data: { userId: session.userId, action: 'SYNC_FINALIZE', entity: 'WooCommerceCatalog', metadata: result } });
      return json({ data: { mode, ...result } });
    }

    const result = mode === 'sync' ? await syncWooCommerceCatalog() : await importWooCommerceCatalog();
    await db.auditLog.create({ data: { userId: session.userId, action: mode === 'sync' ? 'SYNC' : 'IMPORT', entity: 'WooCommerceCatalog', metadata: { mode, result } } });
    return json({ data: { mode, ...result } });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'WooCommerce catalog operation failed' }, 500);
  }
}
