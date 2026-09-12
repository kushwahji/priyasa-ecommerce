import type { Product } from '@/lib/catalog';

type ApiResponse = { success?: boolean; data?: any; message?: string };
export type StorefrontCategory = { id: string; name: string; slug: string; imageUrl: string; description?: string; products: any[]; _count?: { products?: number } };
export type HomeCmsSection = { id: string; type?: string; title?: string; subtitle?: string; imageUrl?: string; mobileImageUrl?: string; ctaHref?: string; ctaLabel?: string; sortOrder?: number; [key: string]: any };
const BASE_URL = (process.env.PRIYASA_API_BASE_URL || 'https://api.priyasa.com').replace(/\/$/, '');
async function coreFetch(path: string, init: RequestInit = {}): Promise<ApiResponse> {
  const attempts = 3;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${BASE_URL}${path}`, { ...init, headers: { Accept: 'application/json', ...(init.headers || {}) }, cache: 'no-store', signal: init.signal || controller.signal });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const error = new Error(body?.message || `PriyasaCore request failed (${response.status})`);
        if (![429, 502, 503, 504].includes(response.status) || attempt === attempts) throw error;
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, attempt * 350));
        continue;
      }
      return body || {};
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 350));
    } finally { clearTimeout(timeout); }
  }
  throw lastError instanceof Error ? lastError : new Error('PriyasaCore request failed');
}
function listFrom(response: ApiResponse): any[] { const value = response.data; if (Array.isArray(value)) return value; if (Array.isArray(value?.data)) return value.data; return []; }
function mediaUrls(product: any): string[] { const media = product?.media; if (Array.isArray(media)) return media.map((item) => typeof item === 'string' ? item : item?.url || item?.image_url).filter(Boolean); if (media && typeof media === 'object') return Object.values(media).flatMap((item: any) => typeof item === 'string' ? [item] : [item?.url, item?.image_url]).filter(Boolean) as string[]; return []; }
function available(variant: any): number { const inventory = variant?.inventory; if (inventory) return Math.max(0, Number(inventory.quantity || 0) - Number(inventory.reserved_quantity || 0)); return Math.max(0, Number(variant?.stock || 0) - Number(variant?.reserved || 0)); }
function mapProduct(product: any): Product { const variants = Array.isArray(product?.variants) ? product.variants.filter((v: any) => v?.is_active !== false) : []; const inStock = variants.find((v: any) => available(v) > 0) || variants[0]; const urls = [...mediaUrls(product), ...variants.map((v: any) => v?.image_url).filter(Boolean)].filter((value, index, all) => all.indexOf(value) === index); const price = Number(inStock?.price ?? product?.price ?? 0); const mrp = Number(inStock?.mrp ?? product?.mrp ?? price); const category = product?.category; return { id: String(product.id), name: String(product.name || ''), slug: String(product.slug || product.id), category: String(category?.name || 'Priyasa'), categorySlug: category?.slug ? String(category.slug) : undefined, price, mrp, image: urls[0] || '/images/product-placeholder.svg', images: urls.length ? urls : ['/images/product-placeholder.svg'], colors: [...new Set(variants.map((v: any) => v?.color).filter(Boolean))] as string[], sizes: [...new Set(variants.map((v: any) => v?.size).filter(Boolean))] as string[], description: String(product?.short_description || product?.description || ''), variantId: inStock?.id ? String(inStock.id) : '', badge: mrp > price && price > 0 ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : undefined }; }
export async function getStorefrontProducts(options: { categorySlug?: string; limit?: number; search?: string } = {}): Promise<Product[]> { const params = new URLSearchParams(); if (options.categorySlug) params.set('category', options.categorySlug); if (options.search) params.set('search', options.search); params.set('per_page', String(Math.min(Math.max(options.limit || 24, 1), 100))); try { return listFrom(await coreFetch(`/api/v1/storefront/products?${params.toString()}`)).map(mapProduct); } catch (error) { console.warn(`[Priyasa storefront] products unavailable; rendering fallback: ${error instanceof Error ? error.message : String(error)}`); return []; } }
export async function getLatestLaunches(limit = 8) { return getStorefrontProducts({ limit }); }
export async function getSearchProducts(query: string, limit = 24) { return getStorefrontProducts({ search: query, limit }); }
export async function getBestSellers(limit = 8) { return getStorefrontProducts({ limit }); }
export async function getSaleProducts(limit = 8) { return (await getStorefrontProducts({ limit: Math.min(100, limit * 3) })).filter((p) => p.price > 0 && p.mrp > p.price).slice(0, limit); }
export async function getProductsForHomeSection(type: string, limit = 8): Promise<Product[]> { const t = type.toLowerCase().trim(); if (t === 'products-sale' || t === 'sale') return getSaleProducts(limit); if (t === 'products-latest' || t === 'latest' || t === 'latest-collection') return getLatestLaunches(limit); if (t === 'products-best' || t === 'best-sellers' || t === 'trending') return getBestSellers(limit); if (t.startsWith('products-category:')) return getStorefrontProducts({ categorySlug: t.slice('products-category:'.length).trim(), limit }); return []; }
export async function getStorefrontProduct(slug: string) {
  try {
    let product: any = null;
    try { product = (await coreFetch(`/api/v1/storefront/products/${encodeURIComponent(slug)}`)).data || null; } catch (detailError) { console.warn(`[Priyasa storefront] direct product lookup failed for ${slug}; trying catalog fallback: ${detailError instanceof Error ? detailError.message : String(detailError)}`); }
    if (!product) { const catalog = await coreFetch(`/api/v1/storefront/products?search=${encodeURIComponent(slug)}&per_page=100`); product = listFrom(catalog).find((item: any) => String(item?.slug || '') === String(slug) || String(item?.id || '') === String(slug)) || null; }
    if (!product) return null;
    const mapped = mapProduct(product); const variants = Array.isArray(product.variants) ? product.variants.filter((v: any) => v?.is_active !== false) : []; let rating = 0, reviewCount = 0;
    try { const reviews = listFrom(await coreFetch(`/api/v1/storefront/products/${encodeURIComponent(slug)}/reviews`)); reviewCount = reviews.length; rating = reviewCount ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount : 0; } catch {}
    return { ...mapped, variants: variants.map((variant: any) => ({ id: String(variant.id), color: variant.color, size: variant.size, price: Number(variant.price ?? product.price ?? 0), mrp: Number(variant.mrp ?? product.mrp ?? 0), stock: available(variant), sku: variant.sku })), rating, reviewCount, fabric: product?.attributes?.fabric, care: product?.attributes?.care };
  } catch (error) { console.warn(`[Priyasa storefront] product ${slug} unavailable: ${error instanceof Error ? error.message : String(error)}`); return null; }
}
export async function getStorefrontCategories(): Promise<StorefrontCategory[]> { try { return listFrom(await coreFetch('/api/v1/storefront/categories')).map((category: any) => ({ id: String(category.id), name: String(category.name || ''), slug: String(category.slug || category.id), imageUrl: category.image_url || category.imageUrl || category.media?.url || '', description: category.description ? String(category.description) : undefined, products: [], _count: category._count })); } catch (error) { console.warn(`[Priyasa storefront] categories unavailable; rendering fallback: ${error instanceof Error ? error.message : String(error)}`); return []; } }
export async function getActiveCms(key: string) { return (await coreFetch(`/api/v1/storefront/cms/${encodeURIComponent(key)}`).catch(() => ({ data: null }))).data || null; }
export async function getHomeCms(): Promise<HomeCmsSection[]> { const data = await getActiveCms('home'); const sections = Array.isArray(data) ? data : Array.isArray(data?.sections) ? data.sections : []; if (sections.length) return sections; return [{ id: 'default-home-hero', type: 'hero', title: 'Every You, Beautiful.', subtitle: 'PRIYASA NEW SEASON', imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1800&q=90', mobileImageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=90', ctaHref: '/new-arrivals', ctaLabel: 'Shop New Arrivals', sortOrder: 0 }]; }
export const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;
