import { test, expect } from '@playwright/test';

test.describe('storefront architecture boundaries', () => {
  test('embedded administration is disabled', async ({ request }) => {
    const response = await request.get('/api/admin/products');
    expect(response.status()).toBe(410);
    const body = await response.json();
    expect(body.message).toMatch(/moved to the PRIYASA Admin application/i);
  });

  test('customer storefront remains available independently of admin', async ({ page }) => {
    const response = await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toContainText('Application error');
  });
});
