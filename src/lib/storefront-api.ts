import { priyasaApi, apiError } from '@/lib/priyasa-api';

export type ApiResult<T> = { data: T; status: number; ok: boolean };

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const { response, body } = await priyasaApi(`/api/v1/storefront${path.startsWith('/') ? path : `/${path}`}`, init);
  const data = ((body as any)?.data ?? body) as T;
  if (!response.ok) throw new Error(apiError(body, `PriyasaCore request failed (${response.status})`));
  return { data, status: response.status, ok: true };
}

const json = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });
const putJson = (body: unknown): RequestInit => ({ method: 'PUT', body: JSON.stringify(body) });
const patchJson = (body: unknown): RequestInit => ({ method: 'PATCH', body: JSON.stringify(body) });

export const storefrontApi = {
  home: () => request<any>('/home'),
  cms: (key: string) => request<any>(`/cms/${encodeURIComponent(key)}`),
  settings: () => request<any>('/settings'),
  categories: () => request<any[]>('/categories'),
  collections: (withProducts = false) => request<any[]>(`/collections${withProducts ? '?with_products=1' : ''}`),
  collection: (slug: string, query = '') => request<any>(`/collections/${encodeURIComponent(slug)}${query ? `?${query}` : ''}`),
  products: (query = '') => request<any>(`/products${query ? `?${query}` : ''}`),
  product: (idOrSlug: string) => request<any>(`/products/${encodeURIComponent(idOrSlug)}`),
  reviews: (product: string, query = '') => request<any>(`/products/${encodeURIComponent(product)}/reviews${query ? `?${query}` : ''}`),
  shippingServiceability: (pincode: string) => request<any>(`/shipping/serviceability?pincode=${encodeURIComponent(pincode)}`),
  me: () => request<any>('/me'),
  updateMe: (body: unknown) => request<any>('/me', patchJson(body)),
  addresses: () => request<any[]>('/addresses'),
  addAddress: (body: unknown) => request<any>('/addresses', json(body)),
  updateAddress: (id: string | number, body: unknown) => request<any>(`/addresses/${encodeURIComponent(String(id))}`, putJson(body)),
  deleteAddress: (id: string | number) => request<any>(`/addresses/${encodeURIComponent(String(id))}`, { method: 'DELETE' }),
  cart: () => request<any>('/cart'),
  addCartItem: (variantId: string | number, quantity: number) => request<any>('/cart/items', json({ variant_id: variantId, quantity })),
  updateCartItem: (itemId: string | number, quantity: number) => request<any>(`/cart/items/${encodeURIComponent(String(itemId))}`, patchJson({ quantity })),
  removeCartItem: (itemId: string | number) => request<any>(`/cart/items/${encodeURIComponent(String(itemId))}`, { method: 'DELETE' }),
  validateCheckout: (couponCode?: string) => request<any>('/checkout/validate', json({ coupon_code: couponCode || null })),
  createOrder: (body: unknown, idempotencyKey?: string) => request<any>('/checkout/create-order', { ...json(body), headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined }),
  orders: (query = '') => request<any>(`/orders${query ? `?${query}` : ''}`),
  order: (id: string | number) => request<any>(`/orders/${encodeURIComponent(String(id))}`),
  tracking: (id: string | number) => request<any>(`/orders/${encodeURIComponent(String(id))}/tracking`),
  cancelOrder: (id: string | number, reason?: string, idempotencyKey?: string) => request<any>(`/orders/${encodeURIComponent(String(id))}/cancel`, { ...json({ reason }), headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined }),
  createPayment: (id: string | number, body: unknown, idempotencyKey?: string) => request<any>(`/orders/${encodeURIComponent(String(id))}/payment`, { ...json(body), headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined }),
  capturePayment: (id: string | number, body: unknown, idempotencyKey?: string) => request<any>(`/orders/${encodeURIComponent(String(id))}/payment/capture`, { ...json(body), headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined }),
  paymentStatus: (id: string | number) => request<any>(`/orders/${encodeURIComponent(String(id))}/payment`),
  wishlist: () => request<any>('/wishlist'),
  toggleWishlist: (variantId: string | number) => request<any>(`/wishlist/${encodeURIComponent(String(variantId))}/toggle`, json({})),
  createReview: (product: string | number, body: unknown) => request<any>(`/products/${encodeURIComponent(String(product))}/reviews`, json(body)),
  returns: () => request<any>('/returns'),
  returnDetail: (id: string | number) => request<any>(`/returns/${encodeURIComponent(String(id))}`),
  createReturn: (orderId: string | number, body: unknown) => request<any>(`/orders/${encodeURIComponent(String(orderId))}/returns`, json(body)),
};

export function productQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== '') q.set(key, String(value));
  return q.toString();
}
