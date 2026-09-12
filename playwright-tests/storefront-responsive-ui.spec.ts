import { test, expect, devices } from '@playwright/test';

const routes = ['/', '/shop', '/cart', '/checkout', '/login'];

for (const viewport of [
  { name: 'mobile', ...devices['iPhone 13'] },
  { name: 'tablet', ...devices['iPad Mini'] },
  { name: 'desktop', ...devices['Desktop Chrome'] },
]) {
  test.describe(`storefront ${viewport.name}`, () => {
    test.use({ viewport: viewport.viewport, userAgent: viewport.userAgent, isMobile: viewport.isMobile, hasTouch: viewport.hasTouch });

    test('core pages render without horizontal overflow', async ({ page }) => {
      for (const route of routes) {
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
        expect(response?.status() ?? 200).toBeLessThan(500);
        await expect(page.locator('body')).toBeVisible();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${route} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(2);
        await expect(page.locator('body')).not.toContainText('Application error');
      }
    });

    test('header exposes usable brand and actions', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const header = page.locator('.site-header');
      await expect(header).toBeVisible();
      await expect(header.locator('.brand-logo-link img').first()).toBeVisible();
      await expect(header.locator('button[aria-label="Search"]')).toBeVisible();
      await expect(header.locator('button[aria-label^="Shopping bag"]').first()).toBeVisible();

      const mobileNav = page.locator('.mobile-bottom-nav');
      if (viewport.name === 'mobile') {
        await expect(mobileNav).toBeVisible();
        await expect(mobileNav.getByRole('link', { name: 'Home' })).toBeVisible();
        await expect(mobileNav.getByRole('link', { name: 'Shop' })).toBeVisible();
        await expect(mobileNav.getByRole('link', { name: 'Wishlist' })).toBeVisible();
        await expect(mobileNav.getByRole('link', { name: 'Orders' })).toBeVisible();
        await expect(mobileNav.getByRole('link', { name: 'Account' })).toBeVisible();
      } else {
        await expect(header.locator('button[aria-label="My Account"]')).toBeVisible();
      }
    });

    test('mobile home matches the production discovery hierarchy', async ({ page }) => {
      test.skip(viewport.name !== 'mobile', 'Mobile-specific home assertions.');
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.mobile-home-search')).toBeVisible();
      await expect(page.locator('.home-managed-hero')).toBeVisible();
      await expect(page.locator('.home-managed-trust')).toBeVisible();
      const catalog = await page.request.get('/api/storefront/search?limit=12');
      if (catalog.ok()) {
        const payload = await catalog.json().catch(() => ({}));
        const products = payload?.data?.products || [];
        if (products.length) await expect(page.locator('.home-product-rail').first()).toBeVisible();
      }
    });

    test('search drawer opens and closes cleanly', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Search' }).click();
      await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
      await expect(page.getByPlaceholder('Search products, styles & categories')).toBeVisible();
      await page.getByRole('button', { name: 'Close search' }).click();
      await expect(page.getByRole('dialog', { name: 'Search' })).toHaveCount(0);
    });

    test('account quick panel opens and navigates cleanly', async ({ page }) => {
      test.skip(viewport.name === 'mobile', 'Mobile uses the five-item Account bottom navigation.');
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'My Account' }).click();
      const dialog = page.getByRole('dialog', { name: 'My Account' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('Hello, beautiful!')).toBeVisible();
      await expect(dialog.getByRole('link', { name: 'My orders' })).toHaveAttribute('href', '/account/orders');
      await dialog.getByRole('link', { name: 'My orders' }).click();
      await expect(page).toHaveURL(/\/account\/orders$/);
    });
  });
}

test('login OTP validation is actionable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog', { name: 'Priyasa login' });
  await expect(dialog).toBeVisible();
  await page.getByPlaceholder('Enter your mobile number').fill('123');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await expect(page.getByRole('alert')).toContainText('valid 10-digit mobile number');
  await expect(page.locator('.otp-modal')).toBeVisible();
});
