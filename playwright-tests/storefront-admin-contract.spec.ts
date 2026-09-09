import { test, expect } from '@playwright/test';

/**
 * Contract coverage for the shared commerce data layer.
 * These tests intentionally do not mutate catalog/order data.
 */
test('storefront product links resolve to the same live product data', async ({ page, request }) => {
  await page.goto('/shop', { waitUntil: 'domcontentloaded' });

  const link = page.locator('a[href*="/product/"]').first();
  await expect(link).toBeVisible({ timeout: 10000 });
  const href = await link.getAttribute('href');
  expect(href).toMatch(/^\/product\/.+/);

  await page.goto(href!, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).not.toContainText('Application error');

  const productName = (await page.locator('h1').first().innerText()).trim();
  expect(productName.length).toBeGreaterThan(0);

  const response = await request.get(`/api/storefront/search?q=${encodeURIComponent(productName)}&limit=24`);
  expect(response.status()).toBe(200);
  const payload = await response.json();
  const products = payload?.data?.products ?? [];
  const slug = href!.replace(/^\/product\//, '').split('?')[0];
  expect(products.some((product: { slug?: string; name?: string }) => product.slug === slug || product.name === productName)).toBeTruthy();
});

test('storefront search exposes active catalog and category suggestions', async ({ request }) => {
  const response = await request.get('/api/storefront/search?q=zzzz-e2e-no-match&limit=12');
  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload).toHaveProperty('data');
  expect(payload.data).toHaveProperty('products');
  expect(payload.data).toHaveProperty('categories');
  expect(Array.isArray(payload.data.products)).toBeTruthy();
  expect(Array.isArray(payload.data.categories)).toBeTruthy();
});

test('admin catalog mutation endpoint remains protected from public visitors', async ({ request }) => {
  const response = await request.patch('/api/admin/products/bulk', {
    data: { productIds: ['e2e-nonexistent-product'], action: 'ACTIVATE' },
  });
  expect([401, 403]).toContain(response.status());
});
