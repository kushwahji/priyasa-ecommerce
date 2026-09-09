import { test, expect } from '@playwright/test';

test.describe('admin ↔ storefront data boundary', () => {
  test('public catalog API exposes only active storefront products', async ({ request }) => {
    const response = await request.get('/api/products');
    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(Array.isArray(payload.data)).toBeTruthy();
    for (const product of payload.data) {
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('slug');
      expect(product).toHaveProperty('active', true);
      expect(Array.isArray(product.variants)).toBeTruthy();
    }
  });

  test('admin catalog API never becomes a public mutation surface', async ({ request }) => {
    const response = await request.post('/api/admin/products', {
      data: {
        name: 'E2E unauthorized product',
        slug: 'e2e-unauthorized-product',
        description: 'This request must never create a catalog record.',
        categoryId: 'invalid-e2e-category',
        mrp: 1999,
        salePrice: 999,
        active: true,
        images: [],
        variants: [{ sku: 'E2E-UNAUTH-001', size: 'M', color: 'Black', stock: 1 }],
      },
    });
    expect([401, 403, 409]).toContain(response.status());
    expect(response.status()).not.toBe(201);
  });

  test('checkout quote rejects a non-existent variant before order creation', async ({ request }) => {
    const response = await request.post('/api/checkout/quote', {
      data: { items: [{ variantId: 'invalid-e2e-variant', quantity: 1 }] },
    });
    expect(response.status()).toBe(409);
    const payload = await response.json();
    expect(payload.error).toMatch(/no longer available|available/i);
  });

  test('public product pages remain backed by catalog routes', async ({ page }) => {
    await page.goto('/shop');
    const link = page.locator('a[href*="/product/"]').first();
    await expect(link).toBeVisible({ timeout: 10000 });
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^\/product\/.+/);
    const response = await page.goto(href!);
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toContainText('Application error');
  });
});
