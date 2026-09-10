import type { Product } from '@/lib/catalog';

type ApiResponse = { success?: boolean; data?: any; message?: string };
const BASE_URL = (process.env.PRIYASA_API_BASE_URL || 'https://api.priyasa.com').replace(/\/$/, '');

async function coreFetch(path: string, init: RequestInit = {}): Promise<ApiResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${BASE_URL}${path}`, { ...init, headers: { Accept: 'application/json', ...(init.headers || {}) }, cache: 'no-store', signal: init.signal || controller.signal });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.message || `PriyasaCore request failed (${response.status})`);
    return body || {};
  } finally { clearTimeout(timeout); }
}

function listFrom(response: ApiResponse): any[] {
  const value = response.data;
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function mediaUrls(product: any): string[] {
  const media = product?.media;
  if (Array.isArray(media)) return media.map((item) => typeof item === 'string' ? item : item?.url || item?.image_url).filter(Boolean);
  if (media && typeof media === 'object') return Object.values(media).flatMap((item: any) => typeof item === 'string' ? [item] : [item?.url, item?.image_url]).filter(Boolean) as string[];
  return [];
}

function available(variant: any): number {
  const inventory = variant?.inventory;
  if (inventory) return Math.max(0, Number(inventory.quantity || 0) - Number(inventory.reserved_quantity || 0));
  return Math.max(0, Number(variant?.stock || 0) - Number(variant?.reserved || 0));
}

function mapProduct(product: any): Product {
  const variants = Array.isArray(product?.variants) ? product.variants.filter((v: any) => v?.is_active !== false) : [];
  const inStock = variants.find((v: any) => available(v) > 0) || variants[0];
  const urls = [...mediaUrls(product), ...variants.map((v: any) => v?.image_url).filter(Boolean)].filter((value, index, all) => all.indexOf(value) === index);
  const price = Number(inStock?.price ?? product?.price ?? 0);
  const mrp = Number(inStock?.mrp ?? product?.mrp ?? price);
  const category = product?.category;
  return { id: String(product.id), name: String(product.name || ''), slug: String(product.slug || product.id), category: String(category?.name || 'Priyasa'), categorySlug: category?.slug ? String(category.slug) : undefined, price, mrp, image: urls[0] || '/images/product-placeholder.svg', images: urls.length ? urls : ['/images/product-placeholder.svg'], colors: [...new Set(variants.map((v: any) => v?.color).filter(Boolean))] as string[], sizes: [...new Set(variants.map((v: any) => v?.size).filter(Boolean))] as string[], description: String(product?.short_description || product?.description || ''), variantId: inStock?.id ? String(inStock.id) : '', badge: mrp > price && price > 0 ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : undefined };
}

export async function getStorefrontProducts(options: { categorySlug?: string; limit?: number; search?: string } = {}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (options.categorySlug) params.set('category', options.categorySlug);
  if (options.search) params.set('search', options.search);
  params.set('per_page', String(Math.min(Math.max(options.limit || 24, 1), 100)));
  return listFrom(await coreFetch(`/api/v1/storefront/products?${params.toString()}`)).map(mapProduct);
}
export async function getLatestLaunches(limit = 8) { return getStorefrontProducts({ limit }); }
export async function getSearchProducts(query: string, limit = 24) { return getStorefrontProducts({ search: query, limit }); }
/** PriyasaCore currently exposes catalog/search but not a dedicated best-seller endpoint. */
export async function getBestSellers(limit = 8) { return getStorefrontProducts({ limit }); }
export async function getSaleProducts(limit = 8) { return (await getStorefrontProducts({ limit: Math.min(100, limit * 3) })).filter((p) => p.price > 0 && p.mrp > p.price).slice(0, limit); }
export async function getProductsForHomeSection(type: string, limit = 8): Promise<Product[]> { const t = type.toLowerCase().trim(); if (t === 'products-sale' || t === 'sale') return getSaleProducts(limit); if (t === 'products-latest' || t === 'latest' || t === 'latest-collection') return getLatestLaunches(limit); if (t === 'products-best' || t === 'best-sellers' || t === 'trending') return getBestSellers(limit); if (t.startsWith('products-category:')) return getStorefrontProducts({ categorySlug: t.slice('products-category:'.length).trim(), limit }); return []; }

export async function getStorefrontProduct(slug: string) {
  const response = await coreFetch(`/api/v1/storefront/products/${encodeURIComponent(slug)}`);
  const product = response.data; if (!product) return null;
  const mapped = mapProduct(product);
  const variants = Array.isArray(product.variants) ? product.variants.filter((v: any) => v?.is_active !== false) : [];
  let rating = 0, reviewCount = 0;
  try { const reviews = listFrom(await coreFetch(`/api/v1/storefront/products/${encodeURIComponent(slug)}/reviews`)); reviewCount = reviews.length; rating = reviewCount ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount : 0; } catch { /* supplementary */ }
  return { ...mapped, variants: variants.map((variant: any) => ({ id: String(variant.id), color: variant.color, size: variant.size, price: Number(variant.price ?? product.price ?? 0), mrp: Number(variant.mrp ?? product.mrp ?? 0), stock: available(variant), sku: variant.sku })), rating, reviewCount, fabric: product?.attributes?.fabric, care: product?.attributes?.care };
}

export async function getStorefrontCategories() {
  return listFrom(await coreFetch('/api/v1/storefront/categories')).map((category: any) => ({ id: String(category.id), name: String(category.name || ''), slug: String(category.slug || category.id), imageUrl: category.image_url || category.imageUrl || category.media?.url || '', products: [] }));
}
export async function getActiveCms(key: string) { return (await coreFetch(`/api/v1/storefront/cms/${encodeURIComponent(key)}`).catch(() => ({ data: null }))).data || null; }
export async function getHomeCms() { return []; }
export const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;
