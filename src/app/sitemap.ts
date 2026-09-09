import type { MetadataRoute } from 'next';
import { getStorefrontCategories, getStorefrontProducts } from '@/lib/storefront-data';

// Sitemap data is public and changes much less frequently than orders or inventory.
// Rebuild at most hourly instead of querying the catalog on every sitemap request.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://priyasa.com';
  const [categories, products] = await Promise.all([
    getStorefrontCategories(),
    getStorefrontProducts({ limit: 10000 }),
  ]);
  const staticRoutes = [
    '', '/shop', '/new-arrivals', '/offers', '/collections', '/about', '/contact',
    '/size-guide', '/faq', '/help', '/track-order', '/shipping-policy',
    '/return-refund-policy', '/cancellation-policy', '/privacy-policy', '/terms-and-conditions',
  ];
  const now = new Date();
  return [
    ...staticRoutes.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: (path === '' ? 'daily' : 'weekly') as 'daily' | 'weekly',
      priority: path === '' ? 1 : 0.6,
    })),
    ...categories.map((category) => ({
      url: `${base}/category/${category.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${base}/product/${product.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
  ];
}
