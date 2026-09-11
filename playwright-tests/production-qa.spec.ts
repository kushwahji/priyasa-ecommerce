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

async function assertHealthyPage(page: Parameters<typeof test>[0] extends never ? never : any) {
  const response = await page.waitForLoadState('domcontentloaded').catch(() => null);
  void response;
}

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

test.describe('mobile storefront presentation', () => {
  test.use({ viewport: devices['iPhone 13'].viewport, userAgent: devices['iPhone 13'].userAgent, isMobile: true });

  test('home page has no horizontal overflow and keeps primary navigation usable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 2);
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  });

  test('mobile product discovery remains tappable and visually bounded', async ({ page }) => {
    await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
    const product = page.locator('a[href*="/product/"]').first();
    await expect(product).toBeVisible({ timeout: 10000 });
    const box = await product.boundingBox();
    expect(box).not.toBeNull();
    if (box) expect(box.width).toBeGreaterThan(120);
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 2);
  });

  test('mobile order history remains accessible as a guarded route', async ({ page }) => {
    const response = await page.goto('/account/orders', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
  });
});
