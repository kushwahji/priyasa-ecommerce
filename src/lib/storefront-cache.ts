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
  ['storefront-categories-v3'],
  { revalidate: 300, tags: ['storefront-categories'] },
);

export const getCachedStorefrontProducts = (options: { categorySlug?: string; limit?: number; sort?: string; search?: string } = {}) =>
  unstable_cache(
    async () => getStorefrontProducts(options),
    ['storefront-products-v3', options.categorySlug || 'all', String(options.limit ?? 'default'), options.sort || 'default', options.search || ''],
    { revalidate: 120, tags: ['storefront-products', options.categorySlug ? `storefront-category:${options.categorySlug}` : 'storefront-products-all'] },
  )();

export const getCachedStorefrontProduct = (slug: string) =>
  unstable_cache(
    async () => getStorefrontProduct(slug),
    ['storefront-product-v3', slug],
    { revalidate: 120, tags: [`storefront-product:${slug}`, 'storefront-products'] },
  )();

export const getCachedActiveCms = (key: string) =>
  unstable_cache(
    async () => getActiveCms(key),
    ['storefront-cms-v3', key],
    { revalidate: 300, tags: [`storefront-cms:${key}`, 'storefront-cms'] },
  )();

export const getCachedHomeCms = unstable_cache(
  async () => getHomeCms(),
  ['storefront-home-cms-v3'],
  { revalidate: 60, tags: ['storefront-cms', 'storefront-home-cms'] },
);
