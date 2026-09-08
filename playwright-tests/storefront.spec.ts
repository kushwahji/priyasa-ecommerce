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
  '/login',
];

const accountRoutes = [
  '/account',
  '/account/orders',
  '/account/addresses',
  '/account/notifications',
  '/account/wishlist',
  '/account/wallet',
  '/account/reviews',
  '/account/settings',
];

const adminControlRoutes = [
  '/admin/orders',
  '/admin/products',
  '/admin/inventory',
  '/admin/customers',
  '/admin/marketing',
  '/admin/automations',
  '/admin/analytics',
  '/admin/returns-refunds',
  '/admin/cms',
  '/admin/settings',
  '/admin/reviews',
  '/admin/seo',
  '/admin/coupons-offers',
  '/admin/products/woocommerce',
  '/admin/products/import',
  '/admin/meta-ads',
  '/admin/whatsapp',
  '/admin/audit-log',
];

async function assertNoServerError(page: import('@playwright/test').Page, route: string) {
  const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
  expect(response?.status(), `${route} returned an HTTP error`).toBeLessThan(500);
  await expect(page.locator('body')).not.toContainText('Application error');
  await expect(page.locator('body')).not.toContainText('Internal Server Error');
}

test('public customer routes are reachable', async ({ page }) => {
  for (const route of publicRoutes) await assertNoServerError(page, route);
});

test('customer account routes remain reachable and protected', async ({ page }) => {
  for (const route of accountRoutes) {
    await assertNoServerError(page, route);
    await expect(page.locator('body')).toContainText(/Sign in|My Account|Orders|Wishlist|Addresses|Wallet|Notifications/i);
  }
});

test('storefront and checkout entry are reachable', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Priyasa/i);
  await expect(page.locator('body')).toContainText(/Shop by Category|Best Sellers|Priyasa/i);

  await page.goto('/shop');
  await expect(page.locator('body')).toContainText(/All styles|Shop/i);

  await page.goto('/checkout');
  await expect(page.locator('body')).toContainText(/Sign in to continue|Shipping address|Checkout/i);
});

test('customer login is mobile OTP only', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('body')).toContainText(/Sign in with mobile|Continue with Mobile|Welcome Back/i);
  const main = page.locator('main').first();
  await expect(main).not.toContainText('Google');
  await expect(main).not.toContainText('Facebook');
});

test('cart and order entry routes do not crash', async ({ page }) => {
  for (const route of ['/cart', '/account/orders', '/track-order', '/checkout/success']) {
    await assertNoServerError(page, route);
  }
  await page.goto('/track-order');
  await expect(page.locator('body')).toContainText(/Track Your Order|Track Order/i);
});

test('admin login presentation is functional and guarded', async ({ page }) => {
  await page.goto('/admin/login');
  await expect(page.locator('body')).toContainText(/Commerce OS|Welcome back|ADMIN ACCESS/i);
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();

  await page.goto('/admin');
  await expect(page).toHaveURL(/admin\/login/);
});

test('all admin control routes are guarded without server errors', async ({ page }) => {
  for (const route of adminControlRoutes) {
    await assertNoServerError(page, route);
    await expect(page).toHaveURL(/admin\/login/);
  }
});

test('admin login can complete against an environment with bootstrap credentials', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD for authenticated admin E2E.');

  await page.goto('/admin/login');
  await page.locator('input[type="email"]').fill(email!);
  await page.locator('input[type="password"]').fill(password!);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/admin(?:\/)?$/);
  await expect(page.locator('body')).toContainText(/Welcome back|Dashboard|Orders|Products/i);
});

test.describe('mobile app-like navigation', () => {
  test.use({
    viewport: devices['iPhone 13'].viewport,
    userAgent: devices['iPhone 13'].userAgent,
    isMobile: true,
  });

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

  test('mobile admin access remains protected', async ({ page }) => {
    await page.goto('/admin/reviews');
    await expect(page).toHaveURL(/admin\/login/);
  });
});
