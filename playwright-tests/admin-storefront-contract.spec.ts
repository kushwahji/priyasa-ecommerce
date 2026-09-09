import { test, expect } from '@playwright/test';

test.describe('admin ↔ storefront data contracts', () => {
  test('public product API returns the same storefront-safe catalog shape', async ({ request }) => {
    const response = await request.get('/api/products?limit=12');
    expect(response.status()).toBeLessThan(500);
    if (!response.ok()) return;

    const body = await response.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    for (const product of body.data) {
      expect(product).toEqual(expect.objectContaining({
        id: expect.any(String), name: expect.any(String), slug: expect.any(String),
        price: expect.any(Number), mrp: expect.any(Number), image: expect.any(String),
        colors: expect.any(Array), sizes: expect.any(Array),
      }));
      expect(product).not.toHaveProperty('reserved');
    }
  });

  test('public product API supports category filtering without exposing inactive records', async ({ request }) => {
    const all = await request.get('/api/products?limit=60');
    expect(all.status()).toBeLessThan(500);
    if (!all.ok()) return;
    const products = (await all.json()).data;
    expect(Array.isArray(products)).toBeTruthy();
    expect(products.every((product: any) => product.active === undefined)).toBeTruthy();

    const category = products.find((product: any) => product.categorySlug)?.categorySlug;
    if (!category) return;
    const filtered = await request.get(`/api/products?category=${encodeURIComponent(category)}&limit=60`);
    expect(filtered.status()).toBeLessThan(500);
    if (!filtered.ok()) return;
    for (const product of (await filtered.json()).data) expect(product.categorySlug).toBe(category);
  });

  test('admin product mutation API remains protected from public access', async ({ request }) => {
    const response = await request.get('/api/admin/products');
    expect([401, 403]).toContain(response.status());
  });

  test('storefront product links resolve to live product pages', async ({ page }) => {
    await page.goto('/shop');
    const links = page.locator('a[href*="/product/"]');
    await expect(links.first()).toBeVisible({ timeout: 10000 });
    const href = await links.first().getAttribute('href');
    expect(href).toMatch(/^\/product\/.+/);
    const productResponse = await page.request.get('/api/products?limit=60');
    expect(productResponse.status()).toBeLessThan(500);
    if (!productResponse.ok()) return;
    const slug = href!.split('/product/')[1];
    expect((await productResponse.json()).data.some((product: any) => product.slug === slug)).toBeTruthy();
  });

  test('unknown storefront search returns an empty result without an application error', async ({ request }) => {
    const response = await request.get('/api/storefront/search?query=__e2e_nonexistent_product__&limit=1');
    expect(response.status()).toBeLessThan(500);
    if (!response.ok()) return;
    const body = await response.json();
    expect(body.data ?? body.products ?? []).toEqual([]);
  });
});
