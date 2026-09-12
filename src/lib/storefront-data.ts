import type { Product } from '@/lib/catalog';

type ApiResponse = { success?: boolean; data?: any; message?: string };
export type StorefrontCategory = { id: string; name: string; slug: string; imageUrl: string; description?: string; products: any[]; _count?: { products?: number } };
export type HomeCmsSection = { id: string; key?: string; type?: string; title?: string; subtitle?: string; imageUrl?: string; mobileImageUrl?: string; ctaHref?: string; ctaLabel?: string; sortOrder?: number; sort_order?: number; isActive?: boolean; is_active?: boolean; content?: Record<string, any>; [key: string]: any };

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

function listFrom(response: ApiResponse): any[] { const value = response.data; if (Array.isArray(value)) return value; if (Array.isArray(value?.data)) return value.data; if (Array.isArray(value?.items)) return value.items; return []; }
function stringValue(value: unknown): string { return value == null ? '' : String(value).trim(); }
function attributeValue(source: any, names: string[]): string {
  const wanted = new Set(names.map((name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')));
  const read = (key: unknown, value: unknown) => wanted.has(stringValue(key).toLowerCase().replace(/[^a-z0-9]/g, '')) ? stringValue(value) : '';
  if (!source || typeof source !== 'object') return '';
  for (const name of names) { const direct = source[name] ?? source[name.toLowerCase()] ?? source[name[0].toUpperCase() + name.slice(1)]; if (stringValue(direct)) return stringValue(direct); }
  const attributes = source.attributes ?? source.attribute_values ?? source.attributeValues ?? source.options ?? source.option_values ?? source.optionValues;
  if (Array.isArray(attributes)) { for (const item of attributes) { const result = read(item?.name ?? item?.key ?? item?.code ?? item?.attribute ?? item?.option, item?.value ?? item?.label ?? item?.text ?? item?.option_value ?? item?.optionValue); if (result) return result; } }
  else if (attributes && typeof attributes === 'object') { for (const [key, value] of Object.entries(attributes)) { const result = read(key, value); if (result) return result; } }
  return '';
}
function mediaUrls(product: any): string[] {
  const urls: string[] = [];
  const add = (value: any) => { if (typeof value === 'string' && value.trim()) urls.push(value.trim()); else if (value && typeof value === 'object') add(value.url ?? value.image_url ?? value.imageUrl ?? value.src ?? value.path); };
  for (const collection of [product?.media, product?.images, product?.gallery, product?.gallery_images, product?.galleryImages, product?.product_images, product?.productImages]) { if (Array.isArray(collection)) collection.forEach(add); else if (collection && typeof collection === 'object') Object.values(collection).forEach(add); }
  [product?.image_url, product?.imageUrl, product?.featured_image, product?.featuredImage, product?.thumbnail, product?.primary_image, product?.primaryImage].forEach(add);
  return [...new Set(urls)];
}
function variantMediaUrls(variant: any): string[] { const urls: string[] = []; const add = (value: any) => { if (typeof value === 'string' && value.trim()) urls.push(value.trim()); else if (value && typeof value === 'object') add(value.url ?? value.image_url ?? value.imageUrl ?? value.src ?? value.path); }; [variant?.image_url, variant?.imageUrl, variant?.image, variant?.media, variant?.images, variant?.gallery].forEach((value) => Array.isArray(value) ? value.forEach(add) : add(value)); return [...new Set(urls)]; }
function available(variant: any): number { const inventory = variant?.inventory ?? variant?.stock_record ?? variant?.stockRecord; if (inventory) { const availableValue = inventory.available_quantity ?? inventory.availableQuantity ?? inventory.available; if (availableValue != null) return Math.max(0, Number(availableValue) || 0); return Math.max(0, Number(inventory.quantity ?? inventory.stock ?? 0) - Number(inventory.reserved_quantity ?? inventory.reservedQuantity ?? inventory.reserved ?? 0)); } return Math.max(0, Number(variant?.stock ?? variant?.quantity ?? 0) - Number(variant?.reserved ?? variant?.reserved_quantity ?? 0)); }
function rawVariantsOf(product: any): any[] { return Array.isArray(product?.variants) ? product.variants : Array.isArray(product?.variants?.data) ? product.variants.data : Array.isArray(product?.variants?.items) ? product.variants.items : []; }
function normalizeVariant(variant: any, product: any) { return { id: String(variant?.id ?? variant?.variant_id ?? ''), color: attributeValue(variant, ['color', 'colour', 'shade', 'tone']) || undefined, size: attributeValue(variant, ['size', 'sizes']) || undefined, price: Number(variant?.price ?? variant?.selling_price ?? variant?.sale_price ?? product?.price ?? 0), mrp: Number(variant?.mrp ?? variant?.compare_at_price ?? variant?.compareAtPrice ?? product?.mrp ?? 0), stock: available(variant), sku: variant?.sku ? String(variant.sku) : undefined, imageUrls: variantMediaUrls(variant) }; }
function mapProduct(product: any): Product {
  const variants = rawVariantsOf(product).filter((v: any) => v?.is_active !== false && v?.isActive !== false).map((v: any) => normalizeVariant(v, product)).filter((v: any) => v.id);
  const inStock = variants.find((v: any) => v.stock > 0) || variants[0];
  const attributes = product?.attributes && typeof product.attributes === 'object' ? product.attributes : product?.attribute_values ?? {};
  const urls = [...mediaUrls(product), ...variants.flatMap((v: any) => v.imageUrls || [])].filter((value, index, all) => all.indexOf(value) === index);
  const price = Number(inStock?.price ?? product?.price ?? product?.selling_price ?? product?.sale_price ?? 0);
  const mrp = Number(inStock?.mrp ?? product?.mrp ?? product?.compare_at_price ?? price);
  const category = product?.category;
  const colors = [...new Set(variants.map((v: any) => v.color).filter(Boolean))] as string[];
  const sizes = [...new Set(variants.map((v: any) => v.size).filter(Boolean))] as string[];
  return { id: String(product.id), name: String(product.name || product.title || ''), slug: String(product.slug || product.product_slug || product.handle || product.id), category: String(category?.name || product?.category_name || 'Priyasa'), categorySlug: category?.slug ? String(category.slug) : product?.category_slug ? String(product.category_slug) : undefined, price, mrp, image: urls[0] || '/images/product-placeholder.svg', images: urls.length ? urls : ['/images/product-placeholder.svg'], colors: colors.length ? colors : [attributeValue({ attributes }, ['color', 'colour'])].filter(Boolean), sizes: sizes.length ? sizes : [attributeValue({ attributes }, ['size', 'sizes'])].filter(Boolean), description: String(product?.short_description || product?.description || ''), variantId: inStock?.id ? String(inStock.id) : String(product?.variant_id ?? ''), badge: mrp > price && price > 0 ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : undefined };
}
export async function getStorefrontProducts(options: { categorySlug?: string; limit?: number; search?: string; sort?: string } = {}): Promise<Product[]> { const params = new URLSearchParams(); if (options.categorySlug) params.set('category', options.categorySlug); if (options.search) params.set('search', options.search); if (options.sort) params.set('sort', options.sort); params.set('per_page', String(Math.min(Math.max(options.limit || 24, 1), 100))); try { return listFrom(await coreFetch(`/api/v1/storefront/products?${params.toString()}`)).map(mapProduct); } catch (error) { console.warn(`[Priyasa storefront] products unavailable; rendering fallback: ${error instanceof Error ? error.message : String(error)}`); return []; } }
export async function getLatestLaunches(limit = 8, sort?: string) { return getStorefrontProducts({ limit, sort: sort || 'newest' }); }
export async function getSearchProducts(query: string, limit = 24) { return getStorefrontProducts({ search: query, limit }); }
export async function getBestSellers(limit = 8, sort?: string) { return getStorefrontProducts({ limit, sort: sort || 'popular' }); }
export async function getSaleProducts(limit = 8, sort?: string) { return (await getStorefrontProducts({ limit: Math.min(100, limit * 3), sort: sort || 'sale' })).filter((p) => p.price > 0 && p.mrp > p.price).slice(0, limit); }
export async function getProductsForHomeSection(type: string, limit = 8, options: { sort?: string } = {}): Promise<Product[]> { const t = type.toLowerCase().trim(); if (t === 'products-sale' || t === 'sale') return getSaleProducts(limit, options.sort); if (t === 'products-latest' || t === 'latest' || t === 'latest-collection' || t === 'new_arrivals' || t === 'new-arrivals') return getLatestLaunches(limit, options.sort); if (t === 'products-best' || t === 'best-sellers' || t === 'trending') return getBestSellers(limit, options.sort); if (t.startsWith('products-category:')) return getStorefrontProducts({ categorySlug: t.slice('products-category:'.length).trim(), limit, sort: options.sort }); return []; }
export async function getStorefrontProduct(slug: string) {
  try {
    const requested = decodeURIComponent(slug); const candidates = [...new Set([requested, requested.trim(), requested.replace(/^product[-_]/i, '')])].filter(Boolean); let product: any = null;
    for (const candidate of candidates) { try { const response = await coreFetch(`/api/v1/storefront/products/${encodeURIComponent(candidate)}`); const payload = response?.data; product = payload?.product ?? payload?.data ?? payload ?? null; if (product && !Array.isArray(product)) break; } catch {} }
    if (!product) { for (const queryKey of ['slug', 'search']) { try { const catalog = await coreFetch(`/api/v1/storefront/products?${queryKey}=${encodeURIComponent(requested)}&per_page=100`); const items = listFrom(catalog); product = items.find((item: any) => [item?.slug, item?.product_slug, item?.handle, item?.id].filter(Boolean).some((value: any) => String(value) === requested)) || null; if (product) break; } catch {} } }
    if (!product) return null;
    const mapped = mapProduct(product); const variants = rawVariantsOf(product).filter((v: any) => v?.is_active !== false && v?.isActive !== false).map((v: any) => normalizeVariant(v, product)).filter((v: any) => v.id);
    let rating = 0, reviewCount = 0; try { const reviews = listFrom(await coreFetch(`/api/v1/storefront/products/${encodeURIComponent(String(product.id))}/reviews`)); reviewCount = reviews.length; rating = reviewCount ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount : 0; } catch {}
    const rawAttributes = product?.attributes ?? product?.attribute_values ?? product?.attributeValues ?? {}; const attribute = (names: string[]) => attributeValue({ attributes: rawAttributes }, names);
    return { ...mapped, variants: variants.map(({ imageUrls, ...variant }: any) => ({ ...variant, imageUrls })), rating, reviewCount, fabric: attribute(['fabric', 'material']) || product?.fabric, care: attribute(['care', 'care_instructions', 'careInstructions']) || product?.care, attributes: rawAttributes };
  } catch (error) { console.warn(`[Priyasa storefront] product ${slug} unavailable: ${error instanceof Error ? error.message : String(error)}`); return null; }
}
export async function getStorefrontCategories(): Promise<StorefrontCategory[]> { try { return listFrom(await coreFetch('/api/v1/storefront/categories')).map((category: any) => ({ id: String(category.id), name: String(category.name || ''), slug: String(category.slug || category.id), imageUrl: category.image_url || category.imageUrl || category.media?.url || '', description: category.description ? String(category.description) : undefined, products: [], _count: category._count })); } catch (error) { console.warn(`[Priyasa storefront] categories unavailable; rendering fallback: ${error instanceof Error ? error.message : String(error)}`); return []; } }
export async function getActiveCms(key: string) { return (await coreFetch(`/api/v1/storefront/cms/${encodeURIComponent(key)}`).catch(() => ({ data: null }))).data || null; }
export async function getHomeCms(): Promise<HomeCmsSection[]> { const response = await coreFetch('/api/v1/storefront/home'); const data = response?.data; const sections = Array.isArray(data?.sections) ? data.sections : Array.isArray(data) ? data : []; return sections.filter((section: any) => section && section.id != null && section.is_active !== false).sort((a:any,b:any)=>Number(a.sort_order??a.sortOrder??0)-Number(b.sort_order??b.sortOrder??0)); }
export const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;