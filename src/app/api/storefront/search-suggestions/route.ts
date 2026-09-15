import { NextResponse } from 'next/server';
import { priyasaApi } from '@/lib/priyasa-api';

export async function GET(req: Request) {
  try {
    const source = new URL(req.url).searchParams;
    const q = (source.get('q') || '').trim().replace(/\s+/g, ' ').slice(0, 120);
    if (q.length < 2) return NextResponse.json({ data: { products: [], brands: [], categories: [] } }, { headers: { 'Cache-Control': 'private, no-store' } });
    const { response, body } = await priyasaApi(`/api/v1/storefront/search/suggestions?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error((body as any)?.message || `PriyasaCore request failed (${response.status})`);
    const data = (body as any)?.data || {};
    return NextResponse.json({ data: {
      products: Array.isArray(data.products) ? data.products.slice(0, 8) : [],
      brands: Array.isArray(data.brands) ? data.brands.slice(0, 6) : [],
      categories: Array.isArray(data.categories) ? data.categories.slice(0, 6) : [],
    } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load suggestions' }, { status: 502 });
  }
}
