import { test, expect, type Page } from '@playwright/test';

const mobile = { width: 390, height: 844 };

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  expect(metrics.scrollWidth, `document overflow: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.bodyScrollWidth, `body overflow: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.viewport + 1);
}

test.describe('storefront responsive smoke', () => {
  test.use({ viewport: mobile, isMobile: true, hasTouch: true });

  for (const path of ['/', '/shop', '/cart', '/checkout', '/account']) {
    test(`${path} fits a 390px device`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expectNoHorizontalOverflow(page);
      await expect(page.locator('body')).toBeVisible();
    });
  }

  test('product detail stays usable on a phone when a live product exists', async ({ page }) => {
    await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    const productLink = page.locator('a[href*="/product/"]').first();
    if (await productLink.count()) {
      await productLink.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('.pdp-page')).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expect(page.locator('.pdp-mobile-purchase')).toBeVisible();
    }
  });
});
