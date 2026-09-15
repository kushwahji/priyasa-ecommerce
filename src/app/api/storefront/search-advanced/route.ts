import { NextResponse } from 'next/server';
import { mapProduct, searchStorefront } from '@/lib/storefront-data';

const ALLOWED = ['q','category','brand','size','color','min_price','max_price','in_stock','sale_only','sort','page'] as const;

export async function GET(req: Request) {
  try {
    const source = new URL(req.url).searchParams;
    const params: Record<string,string> = {};
    for (const key of ALLOWED) {
      const value = source.get(key)?.trim();
      if (value) params[key] = value;
    }
    const requested = Number(source.get('limit') || source.get('per_page') || 24);
    params.per_page = String(Math.min(100, Math.max(4, Number.isFinite(requested) ? requested : 24)));
    const result = await searchStorefront(params);
    return NextResponse.json({
      data: {
        query: params.q || '',
        products: result.items.map(mapProduct),
        facets: result.facets,
        categories: result.facets?.categories || [],
        meta: result.meta,
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to search' }, { status: 502 });
  }
}
