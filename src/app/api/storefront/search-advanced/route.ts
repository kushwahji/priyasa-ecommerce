import { NextResponse } from 'next/server';
import { getStorefrontCategories, getStorefrontProducts } from '@/lib/storefront-data';

const parseNumber = (value: string | null) => {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const q = (u.searchParams.get('q') || '').trim();
    const limit = Math.min(100, Math.max(4, Number(u.searchParams.get('limit') || 24)));
    const page = Math.max(1, Number(u.searchParams.get('page') || 1));
    const category = (u.searchParams.get('category') || '').trim();
    const brand = (u.searchParams.get('brand') || '').trim();
    const size = (u.searchParams.get('size') || '').trim();
    const color = (u.searchParams.get('color') || '').trim();
    const minPrice = parseNumber(u.searchParams.get('min'));
    const maxPrice = parseNumber(u.searchParams.get('max'));
    const inStock = u.searchParams.get('in_stock') === '1' || u.searchParams.get('availability') === 'in_stock';
    const rawSort = u.searchParams.get('sort') || 'relevance';
    const sort = rawSort === 'price_asc' ? 'price' : rawSort === 'price_desc' ? 'price_desc' : rawSort === 'name' ? 'name' : rawSort === 'newest' ? 'newest' : undefined;

    const [products, categories] = await Promise.all([
      getStorefrontProducts({
        categorySlug: category || undefined,
        brand: brand || undefined,
        search: q || undefined,
        size: size || undefined,
        color: color || undefined,
        minPrice,
        maxPrice,
        inStock,
        sort,
        page,
        limit,
      }),
      getStorefrontCategories(),
    ]);

    return NextResponse.json({
      data: {
        query: q,
        page,
        limit,
        products,
        categories: categories.map(c => ({ name: c.name, slug: c.slug, productCount: c._count?.products || 0 })),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to search' }, { status: 500 });
  }
}