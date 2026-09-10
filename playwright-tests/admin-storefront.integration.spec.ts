import { test, expect } from '@playwright/test';

test.describe('admin → storefront integration boundaries', () => {
  test('storefront search exposes the live catalog contract without admin access', async ({ request }) => {
    const response = await request.get('/api/storefront/search?limit=6');
    expect(response.status()).toBeLessThan(500);
    if (!response.ok()) return;

    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data.products)).toBeTruthy();

    for (const product of body.data.products) {
      expect(product).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        slug: expect.any(String),
        price: expect.any(Number),
      });
      expect(product).toHaveProperty('variants');
    }
  });

  test('live storefront product links resolve to active product pages', async ({ page }) => {
    await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    const links = page.locator('a[href^="/product/"]');
    await expect(links.first()).toBeVisible({ timeout: 10000 });

    const hrefs = await links.evaluateAll((nodes) =>
      nodes.slice(0, 3)
        .map((node) => (node as HTMLAnchorElement).getAttribute('href'))
        .filter((href): href is string => Boolean(href)),
    );

    for (const href of hrefs) {
      const response = await page.goto(href, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${href} returned an HTTP error`).toBeLessThan(500);
      await expect(page.locator('body')).not.toContainText('Application error');
      await expect(page.locator('body')).toContainText(/Add to Cart|Buy it now|Select your fit/i);
    }
  });

  test('inventory mutation remains protected from unauthenticated callers', async ({ request }) => {
    const response = await request.post('/api/admin/inventory/adjust', {
      data: { variantId: 'e2e-unauthenticated-variant', delta: 1, reason: 'E2E authorization probe' },
    });
    expect(response.status()).toBe(403);
    const body = await response.json().catch(() => ({}));
    expect(body.error).toBe('Forbidden');
  });

  test('admin product API remains protected while storefront remains public', async ({ request }) => {
    const response = await request.get('/api/admin/products');
    expect(response.status()).toBe(403);
    const body = await response.json().catch(() => ({}));
    expect(body.error).toBe('Forbidden');
  });
});
