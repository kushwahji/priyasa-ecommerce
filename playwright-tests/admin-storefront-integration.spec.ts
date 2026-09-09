import { test, expect, devices } from '@playwright/test';

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

  test('storefront search payload is backed by live catalog records', async ({ request }) => {
    const response = await request.get('/api/storefront/search?limit=12');
    expect(response.status()).toBeLessThan(500);
    if (!response.ok()) return;
    const payload = await response.json();
    const products = payload?.data?.products ?? [];
    expect(Array.isArray(products)).toBeTruthy();
    for (const product of products.slice(0, 5)) {
      expect(product.id).toBeTruthy();
      expect(product.slug).toBeTruthy();
      expect(product.name).toBeTruthy();
      expect(Number(product.price)).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(product.colors)).toBeTruthy();
      expect(Array.isArray(product.sizes)).toBeTruthy();
    }
  });

  test('catalog and storefront-search surfaces agree on the same live product identity', async ({ request }) => {
    const [catalogResponse, searchResponse] = await Promise.all([
      request.get('/api/products?limit=12'),
      request.get('/api/storefront/search?limit=12'),
    ]);
    expect(catalogResponse.status()).toBe(200);
    expect(searchResponse.status()).toBe(200);

    const catalog = await catalogResponse.json();
    const search = await searchResponse.json();
    const catalogProducts = catalog?.data ?? [];
    const searchProducts = search?.data?.products ?? [];
    expect(Array.isArray(catalogProducts)).toBeTruthy();
    expect(Array.isArray(searchProducts)).toBeTruthy();

    const catalogById = new Map(catalogProducts.map((product: any) => [product.id, product]));
    for (const product of searchProducts) {
      const source = catalogById.get(product.id);
      if (!source) continue;
      expect(product.slug).toBe(source.slug);
      expect(product.name).toBe(source.name);
      expect(Number(product.price)).toBe(Number(source.salePrice ?? source.price));
    }
  });

  test('public catalog payload keeps pricing and variant inventory coherent', async ({ request }) => {
    const response = await request.get('/api/products');
    expect(response.status()).toBe(200);
    const payload = await response.json();
    for (const product of payload.data) {
      expect(Number(product.salePrice ?? product.price)).toBeGreaterThanOrEqual(0);
      expect(Number(product.mrp ?? product.salePrice ?? product.price)).toBeGreaterThanOrEqual(Number(product.salePrice ?? product.price));
      for (const variant of product.variants) {
        expect(variant).toHaveProperty('id');
        expect(Number(variant.stock)).toBeGreaterThanOrEqual(0);
        expect(Number(variant.reserved ?? 0)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('admin catalog API never becomes a public mutation surface', async ({ request }) => {
    const response = await request.post('/api/admin/products', { data: { name: 'E2E unauthorized product', slug: 'e2e-unauthorized-product', description: 'Must never create a catalog record.', categoryId: 'invalid-e2e-category', mrp: 1999, salePrice: 999, active: true, images: [], variants: [{ sku: 'E2E-UNAUTH-001', size: 'M', color: 'Black', stock: 1 }] } });
    expect([401, 403, 409]).toContain(response.status());
    expect(response.status()).not.toBe(201);
  });

  test('checkout quote rejects a non-existent variant before order creation', async ({ request }) => {
    const response = await request.post('/api/checkout/quote', { data: { items: [{ variantId: 'invalid-e2e-variant', quantity: 1 }] } });
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
    await expect(page.getByRole('button', { name: /Add to Cart/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('public product page does not expose admin management UI', async ({ page }) => {
    await page.goto('/shop');
    const link = page.locator('a[href*="/product/"]').first();
    await expect(link).toBeVisible({ timeout: 10000 });
    await link.click();
    await expect(page.locator('body')).not.toContainText(/Product command center|Catalog workspace|Commerce Control/i);
  });

  test('admin catalog is protected while storefront remains public', async ({ page }) => {
    const storefront = await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    expect(storefront?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toContainText('Application error');
    await page.goto('/admin/products', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/admin\/login/);
  });
});

test.describe('responsive catalog surfaces', () => {
  test.use({ viewport: devices['iPhone 13'].viewport, userAgent: devices['iPhone 13'].userAgent, isMobile: true });

  test('mobile storefront catalog has no document overflow', async ({ page }) => {
    await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 2);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('mobile admin catalog redirects cleanly', async ({ page }) => {
    await page.goto('/admin/products', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/admin\/login/);
    await expect(page.locator('body')).not.toContainText('Application error');
  });
});
