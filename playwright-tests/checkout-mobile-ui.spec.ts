import { test, expect, devices } from '@playwright/test';

test('account drawer close control stays above header actions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Account' }).click();
  const panel = page.locator('.e2-panel[aria-label="Account"]');
  await expect(panel).toBeVisible();
  const close = panel.getByRole('button', { name: 'Close account' });
  await expect(close).toBeVisible();
  await close.click();
  await expect(panel).toBeHidden();
});

test.describe('mobile checkout presentation', () => {
  test.use({ viewport: devices['iPhone 13'].viewport, userAgent: devices['iPhone 13'].userAgent, isMobile: true });

  test('checkout keeps sections aligned without horizontal overflow', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    const gate = page.locator('.checkout-login-gate');
    if (await gate.count()) return;

    const checkout = page.locator('.checkout-page');
    await expect(checkout).toBeVisible();
    await expect(checkout.locator('.checkout-steps')).toBeVisible();
    await expect(checkout.locator('.checkout-card').first()).toBeVisible();
    await expect(checkout.locator('.checkout-summary')).toBeVisible();

    const viewport = await page.evaluate(() => document.documentElement.clientWidth);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewport + 2);

    const delivery = checkout.locator('.delivery-check').first();
    if (await delivery.count()) {
      const box = await delivery.boundingBox();
      expect(box).not.toBeNull();
      if (box) expect(box.width).toBeLessThanOrEqual(viewport - 20);
    }
  });

  test('checkout payment methods remain usable on mobile', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    if (await page.locator('.checkout-login-gate').count()) return;
    const methods = page.locator('.payment-method-select');
    if (await methods.count() === 0) return;
    await expect(methods.first()).toBeVisible();
    const box = await methods.first().boundingBox();
    expect(box).not.toBeNull();
    if (box) expect(box.width).toBeGreaterThan(250);
  });
});
