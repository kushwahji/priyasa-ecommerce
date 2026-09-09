import { unstable_cache } from 'next/cache';
import {
  getActiveCms,
  getHomeCms,
  getStorefrontCategories,
  getStorefrontProduct,
  getStorefrontProducts,
} from '@/lib/storefront-data';

/** Short-lived public catalog cache. Never use these wrappers for cart, checkout, account, order or inventory mutations. */
export const getCachedStorefrontCategories = unstable_cache(
  async () => getStorefrontCategories(),
  ['storefront-categories-v2'],
  { revalidate: 300, tags: ['storefront-categories'] },
);

export const getCachedStorefrontProducts = (options: { categorySlug?: string; limit?: number } = {}) =>
  unstable_cache(
    async () => getStorefrontProducts(options),
    ['storefront-products-v2', options.categorySlug || 'all', String(options.limit ?? 'default')],
    { revalidate: 120, tags: ['storefront-products', options.categorySlug ? `storefront-category:${options.categorySlug}` : 'storefront-products-all'] },
  )();

export const getCachedStorefrontProduct = (slug: string) =>
  unstable_cache(
    async () => getStorefrontProduct(slug),
    ['storefront-product-v2', slug],
    { revalidate: 120, tags: [`storefront-product:${slug}`, 'storefront-products'] },
  )();

export const getCachedActiveCms = (key: string) =>
  unstable_cache(
    async () => getActiveCms(key),
    ['storefront-cms-v2', key],
    { revalidate: 300, tags: [`storefront-cms:${key}`, 'storefront-cms'] },
  )();

export const getCachedHomeCms = unstable_cache(
  async () => getHomeCms(),
  ['storefront-home-cms-v2'],
  { revalidate: 120, tags: ['storefront-cms', 'storefront-home-cms'] },
);
