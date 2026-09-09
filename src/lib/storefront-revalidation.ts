import { revalidateTag } from 'next/cache';

/**
 * Invalidate only public storefront data after a successful admin mutation.
 * Private commerce flows must not use these helpers.
 */
export function revalidateStorefrontProducts(options: { productSlugs?: string[]; categorySlugs?: string[] } = {}) {
  const tags = new Set<string>(['storefront-products', 'storefront-products-all', 'storefront-categories']);
  for (const slug of options.productSlugs ?? []) if (slug) tags.add(`storefront-product:${slug}`);
  for (const slug of options.categorySlugs ?? []) if (slug) tags.add(`storefront-category:${slug}`);
  for (const tag of tags) revalidateTag(tag, 'max');
}

export function revalidateStorefrontCategories(slugs: string[] = []) {
  const tags = new Set<string>(['storefront-categories', 'storefront-products', 'storefront-products-all']);
  for (const slug of slugs) if (slug) tags.add(`storefront-category:${slug}`);
  for (const tag of tags) revalidateTag(tag, 'max');
}

export function revalidateStorefrontCms(key?: string) {
  const tags = new Set<string>(['storefront-cms', 'storefront-home-cms']);
  if (key) tags.add(`storefront-cms:${key}`);
  for (const tag of tags) revalidateTag(tag, 'max');
}
