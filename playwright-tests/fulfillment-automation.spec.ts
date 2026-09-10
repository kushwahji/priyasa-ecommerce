import { test, expect } from '@playwright/test';

const protectedMutationRoutes = [
  ['/api/admin/orders/invalid-e2e-order/status', { status: 'PROCESSING' }],
  ['/api/admin/orders/invalid-e2e-order/shipment', { provider: 'shiprocket' }],
  ['/api/admin/orders/invalid-e2e-order/shipment-action', { action: 'REQUEST_PICKUP' }],
];

test.describe('fulfillment automation boundaries', () => {
  test('admin fulfillment mutations never accept an unauthenticated request', async ({ request }) => {
    for (const [path, data] of protectedMutationRoutes) {
      const response = await request.post(path, { data });
      expect(response.status(), `${path} must not create a fulfillment mutation anonymously`).not.toBe(201);
      expect(response.status()).toBeLessThan(500);
    }
  });

  test('invalid shipment creation cannot create a shipment', async ({ request }) => {
    const response = await request.post('/api/admin/orders/invalid-e2e-order/shipment', {
      data: { provider: 'shiprocket' },
    });
    expect(response.status()).not.toBe(201);
  });

  test('public tracking surface remains reachable without exposing admin controls', async ({ page }) => {
    const response = await page.goto('/track-order', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).toContainText(/Track Your Order/i);
    await expect(page.locator('body')).not.toContainText(/Create Shipment|Request Pickup|AWB Assigned/i);
  });

  test('shipment provider webhook route rejects malformed anonymous callbacks', async ({ request }) => {
    const response = await request.post('/api/webhooks/shiprocket', {
      data: { event: 'invalid-e2e-event' },
    });
    expect(response.status()).not.toBe(201);
    expect(response.status()).not.toBe(200);
  });
});
