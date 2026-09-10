import { test, expect } from '@playwright/test';

const accountRoutes = ['/account','/account/orders','/account/addresses','/account/edit','/account/notifications','/account/returns','/account/wallet','/account/payment-methods'];

test.describe('production storefront commerce flow', () => {
  test('product to cart to checkout entry preserves real cart state', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('priyasa_cart', '[]'));
    await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    const productLink = page.locator('a[href*="/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 10000 });
    const href = await productLink.getAttribute('href');
    expect(href).toMatch(/^\/product\/.+/);
    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText('Application error');

    const addButton = page.getByRole('button', { name: /^Add to Cart$/ }).first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    if (await addButton.isDisabled()) test.skip(true, 'Selected product has no currently available variant.');
    await addButton.click();
    await expect(page.locator('[role="status"]').filter({ hasText: /added to your cart/i })).toBeVisible({ timeout: 5000 });

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('priyasa_cart') || '[]'));
    expect(stored.length).toBeGreaterThan(0);
    expect(stored[0].variantId).toBeTruthy();
    expect(Number(stored[0].quantity)).toBe(1);

    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.cart-product').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /Proceed to checkout/i })).toBeVisible();

    const increase = page.getByRole('button', { name: /Increase quantity/i }).first();
    if (await increase.isVisible() && !(await increase.isDisabled())) {
      await increase.click();
      await expect(page.locator('.cart-product').first()).toContainText('2');
      const afterIncrease = await page.evaluate(() => JSON.parse(localStorage.getItem('priyasa_cart') || '[]'));
      expect(Number(afterIncrease[0]?.quantity)).toBe(2);
    }

    await page.getByRole('link', { name: /Proceed to checkout/i }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.locator('body')).toContainText(/Sign in to continue|Shipping address/i);
  });

  test('checkout keeps customer-facing validation and payment choices explicit', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('priyasa_cart', '[]'));
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).toContainText(/Sign in to continue|Shipping address/i);
    if (await page.locator('.payment-method-grid').count()) {
      await expect(page.locator('.payment-method-grid')).toContainText(/Online payment|Cash on Delivery|Priyasa Wallet/i);
    }
  });

  test('account destinations do not dead-end', async ({ page }) => {
    for (const route of accountRoutes) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${route} returned an HTTP error`).toBeLessThan(500);
      await expect(page.locator('body')).not.toContainText('Application error');
      if (route === '/account/payment-methods') await expect(page.locator('body')).toContainText(/Payment Methods|Sign in/i);
    }
  });

  test('global storefront controls remain keyboard and pointer usable', async ({ page }) => {
    await page.goto('/');
    const controls = page.locator('a:visible,button:visible');
    const count = Math.min(await controls.count(), 30);
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const box = await controls.nth(i).boundingBox();
      if (box) expect(box.height, `control ${i} is too short`).toBeGreaterThanOrEqual(24);
    }
  });
});
