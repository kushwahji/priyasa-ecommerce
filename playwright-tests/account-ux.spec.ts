import { test, expect } from '@playwright/test';

test('account page keeps authenticated and guest layouts usable', async ({ page }) => {
  const session = await page.request.get('/api/customer/session');
  const authenticated = session.ok() && Boolean((await session.json().catch(() => ({})))?.authenticated);
  await page.goto('/account');
  await expect(page.locator('body')).not.toContainText('Application error');
  if (authenticated) {
    await expect(page.locator('.nykaa-account-v1 .account-layout')).toBeVisible();
    await expect(page.getByRole('link', { name: /Orders/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Wallet/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Addresses/ }).first()).toBeVisible();
  } else {
    await expect(page.locator('.nykaa-account-hero')).toBeVisible();
    await expect(page.getByRole('link', { name: /Login \/ Sign up/ })).toBeVisible();
  }
});

test('mobile account navigation does not overflow horizontally', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/account');
  await expect(page.locator('body')).not.toContainText('Application error');
  const viewport = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.width + 1);
});
