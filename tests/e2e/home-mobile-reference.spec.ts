import { test, expect } from '@playwright/test';

test.describe('mobile home experience', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test('renders the production home shell and core sections', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('[data-testid="home-hero"]')).toBeVisible();
    await expect(page.locator('[data-testid="home-trust-strip"]')).toBeVisible();

    const catalogSection = page.locator('[data-testid="home-casual-products"]');
    const bestSellerSection = page.locator('[data-testid="home-best-sellers"]');

    // Product rails are data-dependent in CI; when the Core API has catalog data,
    // verify the real cards and links rather than accepting a placeholder shell.
    if (await catalogSection.count()) {
      await expect(catalogSection.locator('.product-card').first()).toBeVisible();
      await expect(catalogSection.locator('a[href^="/product/"]').first()).toBeVisible();
    }

    if (await bestSellerSection.count()) {
      await expect(bestSellerSection.locator('.product-card').first()).toBeVisible();
    }

    await expect(page.locator('.mobile-bottom-nav, .mobile-bottom-navigation').first()).toBeVisible();
  });
});
