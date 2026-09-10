import { test, expect } from '@playwright/test';

const fakeCart = [{
  variantId: 'e2e-variant',
  productId: 'e2e-product',
  name: 'Priyasa E2E Test Kurta · Default · M',
  price: 1499,
  quantity: 1,
  image: '/images/placeholder.svg',
}];

test.describe('progressive checkout UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((cart) => {
      localStorage.setItem('priyasa_cart', JSON.stringify(cart));
    }, fakeCart);
    await page.route('**/api/customer/session', async (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authenticated: true, user: { id: 'e2e-user', name: 'E2E Customer', phone: '9999999999' } }),
    }));
    await page.route('**/api/customer/addresses', async (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [{ id: 'e2e-address', fullName: 'E2E Customer', phone: '9999999999', line1: 'E2E Test Address', city: 'Noida', state: 'Uttar Pradesh', pincode: '201304', isDefault: true }] }),
    }));
    await page.route('**/api/account/wallet', async (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ wallet: { balance: 10 } }),
    }));
    await page.route('**/api/checkout/quote', async (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ subtotal: 1499, discount: 0, shipping: 0, total: 1499, items: [{ variantId: 'e2e-variant', unitPrice: 1499 }] }),
    }));
  });

  test('shows one active section at a time: summary then payment then confirmation', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.locator('.checkout-v3-summary')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Where should we deliver?' })).toBeVisible();

    await page.getByRole('button', { name: 'Continue to payment' }).click();
    await expect(page.getByRole('heading', { name: 'How would you like to pay?' })).toBeVisible();
    await expect(page.locator('.checkout-v3-summary')).toBeHidden();
    await expect(page.getByRole('button', { name: /Online payment/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cash on Delivery/ })).toBeVisible();

    await page.getByRole('button', { name: 'Review order' }).click();
    await expect(page.getByRole('heading', { name: 'Review & place order' })).toBeVisible();
    await expect(page.locator('.checkout-v3-summary')).toBeHidden();
    await expect(page.getByRole('button', { name: /Place order/ })).toBeVisible();
  });

  test('payment selection and back navigation remain usable', async ({ page }) => {
    await page.goto('/checkout');
    await page.getByRole('button', { name: 'Continue to payment' }).click();
    await page.getByRole('button', { name: /Cash on Delivery/ }).click();
    await expect(page.getByRole('button', { name: /Cash on Delivery/ })).toHaveClass(/active/);
    await page.getByRole('button', { name: '← Address' }).click();
    await expect(page.getByRole('heading', { name: 'Where should we deliver?' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How would you like to pay?' })).toHaveCount(0);
  });
});

test.describe('smart cart drawer UX', () => {
  test('opens from the real cart event and supports quantity/remove controls', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((cart) => {
      localStorage.setItem('priyasa_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('priyasa-cart-updated'));
    }, fakeCart);

    const drawer = page.locator('.smart-cart-panel');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('Shopping bag');
    await expect(drawer.locator('.smart-cart-qty strong')).toHaveText('1');

    await drawer.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(drawer.locator('.smart-cart-qty strong')).toHaveText('2');
    await expect(drawer).toContainText('₹2,998');

    await drawer.getByRole('button', { name: /Remove Priyasa E2E Test Kurta/ }).click();
    await expect(drawer).toBeHidden();
    await expect(page.evaluate(() => localStorage.getItem('priyasa_cart'))).resolves.toBe('[]');
  });
});
