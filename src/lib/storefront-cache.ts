import { unstable_cache } from 'next/cache';
import { getActiveCms, getStorefrontCategories, getStorefrontProduct, getStorefrontProducts } from '@/lib/storefront-data';

/** Short-lived public catalog cache. Never use these wrappers for cart, checkout, account, order or inventory mutations. */
export const getCachedStorefrontCategories = unstable_cache(
  async () => getStorefrontCategories(),
  ['storefront-categories-v1'],
  { revalidate: 300, tags: ['storefront-categories'] },
);

export const getCachedStorefrontProducts = unstable_cache(
  async (limit = 48) => getStorefrontProducts({ limit }),
  ['storefront-products-v1'],
  { revalidate: 120, tags: ['storefront-products'] },
);

export const getCachedStorefrontProduct = (slug: string) =>
  unstable_cache(
    async () => getStorefrontProduct(slug),
    ['storefront-product-v1', slug],
    { revalidate: 120, tags: [`storefront-product:${slug}`, 'storefront-products'] },
  )();

export const getCachedActiveCms = (key: string) =>
  unstable_cache(
    async () => getActiveCms(key),
    ['storefront-cms-v1', key],
    { revalidate: 300, tags: [`storefront-cms:${key}`, 'storefront-cms'] },
  )();
