import { test, expect, devices } from '@playwright/test';

const regressionRoutes = [
  '/login',
  '/account',
  '/account/orders',
  '/account/addresses',
  '/account/wallet',
  '/account/returns',
  '/wishlist',
  '/offers',
  '/checkout/success?order=invalid',
];

test('protected customer journeys fail safely without application errors', async ({ page }) => {
  for (const route of regressionRoutes) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), `${route} returned a server error`).toBeLessThan(500);
    await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
  }
});

test('unauthenticated account access is redirected to customer login', async ({ page }) => {
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login/);
});

test('invalid checkout confirmation never exposes another customer order', async ({ page }) => {
  const response = await page.goto('/checkout/success?order=__invalid_order_for_qa__', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(500);
  await expect(page.locator('body')).not.toContainText(/ORDER CONFIRMED|Paid securely|Cash on Delivery/i);
});

test.describe('mobile post-purchase entry points', () => {
  test.use({ viewport: devices['iPhone 13'].viewport, userAgent: devices['iPhone 13'].userAgent, isMobile: true });

  test('mobile order history remains accessible as a guarded route', async ({ page }) => {
    const response = await page.goto('/account/orders', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
  });
});
