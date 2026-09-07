import type { MetadataRoute } from 'next';
import { getStorefrontProducts } from '@/lib/storefront-data';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://staging.priyasa.in';
  const products = await getStorefrontProducts();

  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/shop`, lastModified: new Date() },
    { url: `${base}/new-arrivals`, lastModified: new Date() },
    { url: `${base}/offers`, lastModified: new Date() },
    { url: `${base}/about`, lastModified: new Date() },
    { url: `${base}/contact`, lastModified: new Date() },
    ...products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: new Date(),
    })),
  ];
}
