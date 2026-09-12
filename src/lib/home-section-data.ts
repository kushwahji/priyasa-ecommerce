import { getStorefrontProducts } from '@/lib/storefront-data';

const BASE_URL = (process.env.PRIYASA_API_BASE_URL || 'https://api.priyasa.com').replace(/\/$/, '');
export type HomeReview = { id: string; rating: number; customer?: string; text: string; product?: string; productImage?: string };

async function readReviews(productId: string): Promise<any[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/storefront/products/${encodeURIComponent(productId)}/reviews`, { headers: { Accept: 'application/json', 'User-Agent': 'Priyasa-Web/2.0' }, cache: 'no-store' });
    const body = await response.json().catch(() => null);
    const value = body?.data;
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.items)) return value.items;
    return [];
  } catch { return []; }
}

export async function getHomeReviewItems(limit = 10): Promise<HomeReview[]> {
  const products = await getStorefrontProducts({ limit: Math.min(12, Math.max(4, limit)), sort: 'popular' });
  const groups = await Promise.all(products.slice(0, 8).map(async (product) => ({ product, reviews: await readReviews(product.id) })));
  const output: HomeReview[] = [];
  for (const { product, reviews } of groups) {
    for (const review of reviews) {
      const text = String(review?.comment ?? review?.review ?? review?.body ?? review?.text ?? '').trim();
      const rating = Number(review?.rating ?? review?.stars ?? 0);
      if (!text || rating <= 0) continue;
      output.push({ id: String(review?.id ?? `${product.id}-${output.length}`), rating: Math.min(5, rating), customer: String(review?.customer?.name ?? review?.user?.name ?? review?.customer_name ?? review?.customerName ?? review?.user_name ?? 'Priyasa customer'), text, product: product.name, productImage: product.image });
      if (output.length >= limit) return output;
    }
  }
  return output;
}
