import { test, expect } from '@playwright/test';

test.describe('PDP commerce flow', () => {
  test('opens a real product and exposes purchase controls', async ({ page }) => {
    await page.goto('/');
    const productLink = page.locator('a[href^="/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 15000 });
    const href = await productLink.getAttribute('href');
    expect(href).toMatch(/^\/product\//);

    await page.goto(href!);
    await expect(page.locator('.pdp-page')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.pdp-info h1')).toBeVisible();
    await expect(page.locator('.pdp-main-image img')).toBeVisible();
    await expect(page.getByRole('button', { name: /add to bag/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /buy now/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /order on whatsapp/i }).first()).toBeVisible();
  });

  test('PDP purchase controls keep the selected item in the local cart', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('priyasa_cart', '[]'));
    await page.goto('/');
    const productLink = page.locator('a[href^="/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 15000 });
    await page.goto((await productLink.getAttribute('href'))!);

    const add = page.getByRole('button', { name: /add to bag/i }).first();
    await expect(add).toBeVisible({ timeout: 15000 });
    if (await add.isEnabled()) {
      await add.click();
      await expect(page.getByRole('status')).toContainText(/added to your bag/i);
      const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('priyasa_cart') || '[]'));
      expect(cart.length).toBeGreaterThan(0);
      expect(cart[0].productId).toBeTruthy();
      expect(cart[0].variantId).toBeTruthy();
      expect(cart[0].quantity).toBeGreaterThan(0);
    }
  });

  test('PDP details tabs expose delivery, reviews and similar sections', async ({ page }) => {
    await page.goto('/');
    const productLink = page.locator('a[href^="/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 15000 });
    await page.goto((await productLink.getAttribute('href'))!);

    await expect(page.locator('.pdp-section-tabs')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#details')).toBeVisible();
    await expect(page.getByText('Delivery & Services', { exact: true })).toBeVisible();
    await expect(page.getByText('Offers & Bank Deals', { exact: true })).toBeVisible();
    await expect(page.getByText('Product Details', { exact: true })).toBeVisible();
    await expect(page.locator('#reviews')).toBeVisible();
  });
});
