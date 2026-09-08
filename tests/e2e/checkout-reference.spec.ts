import { test, expect } from '@playwright/test';

test('checkout reference shell is rendered', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page.locator('.checkout-page')).toBeVisible();
  await expect(page.locator('body')).toContainText(/checkout|shopping/i);
});
