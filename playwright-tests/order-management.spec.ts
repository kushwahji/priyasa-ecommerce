import { test, expect } from '@playwright/test';

const order = {
  id: 'order-e2e-1',
  orderNumber: 'PRI-E2E-1001',
  status: 'CONFIRMED',
  paymentStatus: 'PAID',
  total: 1499,
  currency: 'INR',
  createdAt: '2026-09-01T10:00:00.000Z',
  items: [],
};

test.describe('customer order management', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/customer/session', async route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: true, user: { id: 'customer-e2e-1', name: 'Test Customer', phone: '9999999999' } }) })
    );
    await page.route('**/api/customer/orders/order-e2e-1', async route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: order }) })
    );
  });

  test('shows cancel, invoice and tracking actions for a confirmed order', async ({ page }) => {
    await page.goto('/account/orders/order-e2e-1');
    await expect(page.getByRole('button', { name: /cancel order/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /view invoice/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /track order/i })).toBeVisible();
  });

  test('cancels a confirmed order with an idempotency key and refreshes', async ({ page }) => {
    let cancelCalls = 0;
    await page.route('**/api/customer/orders/order-e2e-1/cancel', async route => {
      cancelCalls++;
      expect(route.request().method()).toBe('POST');
      expect(route.request().headers()['idempotency-key']).toBeTruthy();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: order.id, status: 'CANCELLED' } }) });
    });

    await page.goto('/account/orders/order-e2e-1');
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: /cancel order/i }).click();
    await expect.poll(() => cancelCalls).toBe(1);
  });

  test('opens the dedicated invoice page through the customer route', async ({ page }) => {
    await page.route('**/api/customer/orders/order-e2e-1/invoice', async route => {
      expect(route.request().method()).toBe('GET');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { invoiceNumber: 'INV-1001', orderNumber: order.orderNumber, total: order.total, currency: 'INR', orderId: order.id } }),
      });
    });

    await page.goto('/account/orders/order-e2e-1');
    await page.getByRole('link', { name: /view invoice/i }).click();
    await expect(page).toHaveURL(/\/account\/orders\/order-e2e-1\/invoice$/);
    await expect(page.getByRole('heading', { name: /tax invoice/i })).toBeVisible();
    await expect(page.getByText('INV-1001')).toBeVisible();
  });
});
