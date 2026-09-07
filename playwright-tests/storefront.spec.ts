import { test, expect, devices } from '@playwright/test';

const publicRoutes = [
  '/',
  '/shop',
  '/about',
  '/contact',
  '/shipping-policy',
  '/return-refund-policy',
  '/privacy-policy',
  '/terms-and-conditions',
  '/cancellation-policy',
  '/faq',
  '/app',
  '/track-order',
  '/checkout',
];

test('public customer routes are reachable', async ({ page }) => {
  for (const route of publicRoutes) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), `${route} returned an HTTP error`).toBeLessThan(500);
    await expect(page.locator('body')).not.toContainText('Application error');
  }
});

test('storefront and checkout entry are reachable', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Priyasa/i);
  await page.goto('/shop');
  await expect(page.locator('body')).toContainText(/All styles|Shop/i);
  await page.goto('/checkout');
  await expect(page.locator('body')).toContainText(/Sign in to continue|Shipping address/i);
});

test('customer login is mobile OTP only', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('body')).toContainText(/Sign in with mobile|Continue with Mobile/i);
  await expect(page.locator('body')).not.toContainText('Google');
  await expect(page.locator('body')).not.toContainText('Facebook');
});

test('customer order and payment routes are present', async ({ page }) => {
  await page.goto('/account/orders');
  await expect(page.locator('body')).toContainText(/My Orders|Sign in/i);
  await page.goto('/track-order');
  await expect(page.locator('body')).toContainText(/Track Your Order/i);
});

test('admin redirects unauthenticated visitors', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/admin\/login/);
});

test.describe('mobile app-like navigation', () => {
  test.use({ viewport: devices['iPhone 13'].viewport, userAgent: devices['iPhone 13'].userAgent, isMobile: true });

  test('mobile home exposes bottom navigation and usable touch targets', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav').last()).toBeVisible();
    const links = page.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 20); i += 1) {
      const box = await links.nth(i).boundingBox();
      if (box) expect(box.height).toBeGreaterThanOrEqual(24);
    }
  });
});
