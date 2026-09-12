import { NextResponse } from 'next/server';
import { getSearchProducts, getStorefrontCategories, getStorefrontProducts } from '@/lib/storefront-data';

type StoreProduct = Awaited<ReturnType<typeof getStorefrontProducts>>[number];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    const raw = Number(url.searchParams.get('limit') || 12);
    const limit = Math.min(24, Math.max(4, Number.isFinite(raw) ? raw : 12));
    const seedIds = [...new Set((url.searchParams.get('seedIds') || '').split(',').map((x) => x.trim()).filter(Boolean))];
    const excludeIds = new Set((url.searchParams.get('excludeIds') || '').split(',').map((x) => x.trim()).filter(Boolean));

    if (seedIds.length) {
      const all = await getStorefrontProducts({ limit: 200 });
      const seedSet = new Set(seedIds);
      const seedProducts = all.filter((product: StoreProduct) => seedSet.has(product.id));
      const seedCategories = new Set(seedProducts.map((product: StoreProduct) => product.categorySlug));
      const seedFabrics = new Set(
        seedProducts.map((product: StoreProduct) => (product.fabric || '').toLowerCase()).filter(Boolean),
      );
      const seedSizes = new Set(seedProducts.flatMap((product: StoreProduct) => product.sizes.map((size) => size.toLowerCase())));
      const seedColors = new Set(seedProducts.flatMap((product: StoreProduct) => product.colors.map((color) => color.toLowerCase())));
      const seedPrice = seedProducts.length
        ? seedProducts.reduce((sum: number, product: StoreProduct) => sum + product.price, 0) / seedProducts.length
        : 0;

      const ranked = all
        .filter((product: StoreProduct) => !seedSet.has(product.id) && !excludeIds.has(product.id))
        .map((product: StoreProduct) => {
          let score = 0;
          if (seedCategories.has(product.categorySlug)) score += 28;
          if (product.fabric && seedFabrics.has(product.fabric.toLowerCase())) score += 16;
          score += product.colors.reduce((n: number, color: string) => n + (seedColors.has(color.toLowerCase()) ? 5 : 0), 0);
          score += product.sizes.reduce((n: number, size: string) => n + (seedSizes.has(size.toLowerCase()) ? 3 : 0), 0);
          if (typeof product.rating === 'number') score += Math.min(10, product.rating * 2);
          if (product.reviewCount) score += Math.min(8, Math.log10(product.reviewCount + 1) * 4);
          if (seedPrice) score += Math.max(0, 10 - (Math.abs(product.price - seedPrice) / Math.max(100, seedPrice)) * 10);
          return { product, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ product }: { product: StoreProduct }) => product);

      return NextResponse.json({
        data: {
          query: q,
          recommendations: ranked,
          reason: 'similar-and-personalized',
        },
      });
    }

    const [products, categories] = await Promise.all([getSearchProducts(q, limit), getStorefrontCategories()]);
    const categorySuggestions = q
      ? categories
          .filter((category) => category.name.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 5)
          .map((category) => ({ name: category.name, slug: category.slug }))
      : [];

    return NextResponse.json({ data: { query: q, products, categories: categorySuggestions } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to search' }, { status: 500 });
  }
}
