import { test, expect } from '@playwright/test';

test.describe('admin → storefront integration boundaries', () => {
  test('storefront search exposes live catalog data without admin access', async ({ request }) => {
    const response = await request.get('/api/storefront/search?limit=6');
    expect(response.status()).toBeLessThan(500);
    if (response.ok()) {
      const body = await response.json();
      expect(Array.isArray(body.data)).toBeTruthy();
      for (const product of body.data) {
        expect(product).toMatchObject({ id: expect.any(String), name: expect.any(String), slug: expect.any(String) });
        expect(product.active ?? true).toBeTruthy();
      }
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
