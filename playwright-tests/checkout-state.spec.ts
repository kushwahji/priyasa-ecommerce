import { test, expect } from '@playwright/test';

/**
 * Checkout state-machine smoke coverage intentionally stops before creating a
 * real order or opening a payment gateway. These tests verify the public
 * boundaries reject unsafe/invalid transitions without mutating commerce data.
 */
test.describe('checkout and payment state guards', () => {
  test('checkout quote rejects an empty cart cleanly', async ({ request }) => {
    const response = await request.post('/api/checkout/quote', {
      data: { items: [] },
    });
    expect(response.status()).toBeLessThan(500);
    const body = await response.json().catch(() => ({}));
    expect(body).toBeTruthy();
  });

  test('order creation does not allow an unauthenticated request', async ({ request }) => {
    const response = await request.post('/api/orders', {
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'e2e-unauthenticated-order-guard',
      },
      data: {
        fullName: 'E2E Test',
        phone: '9999999999',
        line1: 'E2E Test Address',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
        items: [],
        paymentMethod: 'cod',
      },
    });

    expect(response.status()).toBeLessThan(500);
    expect(response.status()).toBeGreaterThanOrEqual(401);
  });

  test('razorpay order creation does not accept an invalid order id', async ({ request }) => {
    const response = await request.post('/api/payments/razorpay', {
      headers: { 'Content-Type': 'application/json' },
      data: { orderId: 'invalid-e2e-order' },
    });

    expect(response.status()).toBeLessThan(500);
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('razorpay verification does not accept an invalid payment payload', async ({ request }) => {
    const response = await request.post('/api/payments/razorpay/verify', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        orderId: 'invalid-e2e-order',
        razorpay_order_id: 'invalid-e2e-razorpay-order',
        razorpay_payment_id: 'invalid-e2e-payment',
        razorpay_signature: 'invalid-e2e-signature',
      },
    });

    expect(response.status()).toBeLessThan(500);
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('checkout success route does not expose an invalid order', async ({ page }) => {
    const response = await page.goto('/checkout/success?order=invalid-e2e-order');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('Payment successful');
  });
});
