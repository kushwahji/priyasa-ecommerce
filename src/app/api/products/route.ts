import { NextResponse } from 'next/server';
import { getSearchProducts, getStorefrontProducts } from '@/lib/storefront-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category')?.trim() || undefined;
    const requestedLimit = Number(searchParams.get('limit') || 24);
    const limit = Number.isFinite(requestedLimit) ? Math.min(60, Math.max(1, Math.floor(requestedLimit))) : 24;

    const products = q
      ? await getSearchProducts(q, limit)
      : await getStorefrontProducts({ categorySlug: category, limit });

    return NextResponse.json(
      { data: products },
      { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } },
    );
  } catch {
    return NextResponse.json({ error: 'Unable to load products' }, { status: 503 });
  }
}
