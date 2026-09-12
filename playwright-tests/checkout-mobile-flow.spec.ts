import { test, expect } from '@playwright/test';

test.describe('Mobile checkout commerce flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.route('**/api/customer/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          user: { id: 101, name: 'Priyasa Customer', phone: '9876543210' },
        }),
      });
    });

    await page.route('**/api/customer/addresses', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{
            id: 'addr-1', fullName: 'Priyasa Customer', phone: '9876543210',
            line1: '12 Fashion Street', city: 'Delhi', state: 'Delhi', pincode: '110001', isDefault: true,
          }],
        }),
      });
    });

    await page.route('**/api/cart', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {
          id: 'cart-1', couponCode: null,
          items: [{ variantId: 'v-101', productId: 'p-101', name: 'Classic Kurta', price: 799, quantity: 2, image: '/images/product-placeholder.svg' }],
        } }),
      });
    });

    await page.route('**/api/checkout/quote', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ subtotal: 1598, discount: 199, shipping: 0, total: 1399, coupon: null, lines: [] }),
      });
    });
  });

  test('renders Myntra-style mobile address step and advances to payment', async ({ page }) => {
    await page.goto('/checkout');

    await expect(page.locator('.priyasa-checkout-v3')).toBeVisible();
    await expect(page.getByText('Where should we deliver?', { exact: true })).toBeVisible();
    await expect(page.getByText('Priyasa Customer · Default', { exact: true })).toBeVisible();
    await expect(page.getByText('Complete your order', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue to payment/i })).toBeEnabled();

    await page.getByRole('button', { name: /continue to payment/i }).click();
    await expect(page.getByText('How would you like to pay?', { exact: true })).toBeVisible();
    await expect(page.getByText('Online payment', { exact: true })).toBeVisible();
    await expect(page.getByText('Cash on Delivery', { exact: true })).toBeVisible();
  });

  test('keeps saved address selected and allows switching payment method', async ({ page }) => {
    await page.goto('/checkout');
    const address = page.locator('.checkout-v3-address').first();
    await expect(address).toHaveClass(/active/);

    await page.getByRole('button', { name: /continue to payment/i }).click();
    const cod = page.locator('.checkout-v3-payment').filter({ hasText: 'Cash on Delivery' });
    await cod.click();
    await expect(cod).toHaveClass(/active/);
  });
});
