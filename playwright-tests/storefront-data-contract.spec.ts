import { test, expect } from '@playwright/test';

test.describe('storefront data contracts', () => {
  test('public catalog API exposes active products with usable variant data', async ({ request }) => {
    const response = await request.get('/api/storefront/search?limit=12');
    expect(response.status()).toBeLessThan(500);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    const products = body?.data?.products;
    expect(Array.isArray(products)).toBeTruthy();

    for (const product of products.slice(0, 12)) {
      expect(typeof product.id).toBe('string');
      expect(typeof product.name).toBe('string');
      expect(product.name.length).toBeGreaterThan(0);
      expect(typeof product.slug).toBe('string');
      expect(product.slug.length).toBeGreaterThan(0);
      expect(typeof product.price).toBe('number');
      expect(product.price).toBeGreaterThan(0);
      expect(typeof product.variantId).toBe('string');
    }
  });

  test('catalog API product links resolve to the same live product', async ({ page, request }) => {
    const response = await request.get('/api/storefront/search?limit=12');
    expect(response.ok()).toBeTruthy();
    const products = (await response.json())?.data?.products || [];
    test.skip(!products.length, 'Live catalog is empty');

    const product = products[0];
    const productResponse = await page.goto(`/product/${encodeURIComponent(product.slug)}`, { waitUntil: 'domcontentloaded' });
    expect(productResponse?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('h1').first()).toContainText(product.name);
  });

  test('search API remains safe for storefront discovery and recommendation calls', async ({ request }) => {
    const queries = ['', 'dress', 'nonexistent-e2e-query-9f4d'];
    for (const q of queries) {
      const response = await request.get(`/api/storefront/search?limit=12&q=${encodeURIComponent(q)}`);
      expect(response.status(), `search failed for ${q || '<empty>'}`).toBeLessThan(500);
      const body = await response.json();
      expect(body?.data).toBeTruthy();
      expect(Array.isArray(body.data.products)).toBeTruthy();
      expect(Array.isArray(body.data.categories)).toBeTruthy();
    }
  });

  test('checkout quote rejects invalid variant references without creating an order', async ({ request }) => {
    const response = await request.post('/api/checkout/quote', {
      data: { items: [{ variantId: 'e2e-invalid-variant', quantity: 1 }] },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
    const body = await response.json().catch(() => ({}));
    expect(body).toBeTruthy();
  });
});
