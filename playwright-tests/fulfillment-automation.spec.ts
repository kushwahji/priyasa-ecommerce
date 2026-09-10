import { test, expect } from '@playwright/test';

const protectedMutations: Array<{ path: string; method: 'POST' | 'PATCH'; data: Record<string, unknown> }> = [
  { path: '/api/admin/orders/invalid-e2e-order/status', method: 'PATCH', data: { status: 'PROCESSING' } },
  { path: '/api/admin/orders/invalid-e2e-order/shipment', method: 'POST', data: { provider: 'shiprocket' } },
  { path: '/api/admin/orders/invalid-e2e-order/shipment-action', method: 'POST', data: { action: 'pickup' } },
];

test.describe('fulfillment automation boundaries', () => {
  test('admin fulfillment mutations never accept an unauthenticated request', async ({ request }) => {
    for (const mutation of protectedMutations) {
      const response = mutation.method === 'PATCH'
        ? await request.patch(mutation.path, { data: mutation.data })
        : await request.post(mutation.path, { data: mutation.data });
      expect(response.status(), `${mutation.method} ${mutation.path} must not mutate fulfillment anonymously`).toBe(403);
    }
  });

  test('invalid shipment creation cannot create a shipment', async ({ request }) => {
    const response = await request.post('/api/admin/orders/invalid-e2e-order/shipment', { data: { provider: 'shiprocket' } });
    expect(response.status()).toBe(403);
  });

  test('public tracking surface remains reachable without exposing admin controls', async ({ page }) => {
    const response = await page.goto('/track-order', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).toContainText(/Track Your Order/i);
    await expect(page.locator('body')).not.toContainText(/Create Shipment|Request Pickup|AWB Assigned/i);
  });

  test('shipment provider webhook rejects malformed payloads', async ({ request }) => {
    const response = await request.post('/api/webhooks/shiprocket', { data: { event: 'invalid-e2e-event' } });
    expect(response.status()).not.toBe(201);
    expect(response.status()).not.toBe(200);
  });
});
