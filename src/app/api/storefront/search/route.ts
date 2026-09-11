import { NextResponse } from 'next/server';
import { getSearchProducts, getStorefrontCategories } from '@/lib/storefront-data';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    const raw = Number(url.searchParams.get('limit') || 12);
    const limit = Math.min(24, Math.max(4, Number.isFinite(raw) ? raw : 12));
    const [products, categories] = await Promise.all([getSearchProducts(q, limit), getStorefrontCategories()]);
    const query = q.toLowerCase();
    const categorySuggestions = q
      ? categories.filter((category) => category.name.toLowerCase().includes(query)).slice(0, 5).map((category) => ({ name: category.name, slug: category.slug }))
      : [];
    return NextResponse.json({ data: { query: q, products, categories: categorySuggestions } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to search' }, { status: 500 });
  }
}
