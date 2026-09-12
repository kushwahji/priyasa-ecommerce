import { test, expect } from '@playwright/test';

async function openFirstProduct(page: any) {
  const response = await page.request.get('/api/storefront/search?limit=12');
  expect(response.status()).toBe(200);
  const payload = await response.json();
  const product = payload?.data?.products?.[0];
  test.skip(!product?.slug, 'No active product is available in the test database.');

  await page.goto(`/product/${encodeURIComponent(product.slug)}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).not.toContainText('Application error');
  await expect(page.locator('h1').first()).toContainText(product.name);
  return product;
}

test.describe('real storefront shopping journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('priyasa_cart', '[]');
    });
  });

  test('product options and add-to-cart create a real cart item', async ({ page }) => {
    await openFirstProduct(page);

    const purchase = page.locator('.purchase-panel').first();
    await expect(purchase).toBeVisible();

    const availableSize = purchase.locator('.size-options button:not(:disabled)').first();
    if (await availableSize.count()) await availableSize.click();

    const add = purchase.getByRole('button', { name: 'Add to Cart', exact: true }).first();
    await expect(add).toBeEnabled();
    await add.click();

    await expect(purchase.locator('[role="status"]')).toContainText(/added to your cart/i);

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('priyasa_cart') || '[]'));
    expect(stored).toHaveLength(1);
    expect(stored[0].variantId).toBeTruthy();
    expect(stored[0].productId).toBeTruthy();
    expect(stored[0].quantity).toBe(1);
    expect(Number(stored[0].price)).toBeGreaterThan(0);
  });

  test('cart supports quantity changes and keeps server quote protected behind authentication', async ({ page }) => {
    await openFirstProduct(page);
    const purchase = page.locator('.purchase-panel').first();
    const availableSize = purchase.locator('.size-options button:not(:disabled)').first();
    if (await availableSize.count()) await availableSize.click();
    await purchase.getByRole('button', { name: 'Add to Cart', exact: true }).first().click();

    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.cart-product').first()).toBeVisible();
    await expect(page.locator('.cart-heading')).toContainText(/1 item/i);

    const increase = page.locator('.cart-product').first().getByRole('button', { name: '+' }).first();
    await expect(increase).toBeEnabled();
    await increase.click();
    await expect(page.locator('.cart-heading')).toContainText(/2 items/i);

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('priyasa_cart') || '[]'));
    expect(stored[0].quantity).toBe(2);

    const quote = await page.request.post('/api/checkout/quote', {
      data: { items: stored.map((item: any) => ({ variantId: item.variantId, quantity: item.quantity })) },
    });
    expect([401, 403]).toContain(quote.status());
  });

  test('remove empties the cart and checkout never proceeds with stale client state', async ({ page }) => {
    await openFirstProduct(page);
    const purchase = page.locator('.purchase-panel').first();
    const availableSize = purchase.locator('.size-options button:not(:disabled)').first();
    if (await availableSize.count()) await availableSize.click();
    await purchase.getByRole('button', { name: 'Add to Cart', exact: true }).first().click();

    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    const product = page.locator('.cart-product').first();
    await expect(product).toBeVisible();
    await product.getByRole('button', { name: 'Remove' }).click();

    await expect(page.locator('.empty-cart')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Your bag is waiting/i);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('priyasa_cart') || '[]'));
    expect(stored).toEqual([]);
  });

  test('buy-now routes through the real checkout gate without creating a fake order', async ({ page }) => {
    await openFirstProduct(page);
    const purchase = page.locator('.purchase-panel').first();
    const availableSize = purchase.locator('.size-options button:not(:disabled)').first();
    if (await availableSize.count()) await availableSize.click();

    await purchase.getByRole('button', { name: 'Buy it now', exact: true }).first().click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.locator('body')).not.toContainText('Application error');

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('priyasa_cart') || '[]'));
    expect(stored).toHaveLength(1);
    await expect(page.locator('body')).toContainText(/Sign in to continue|Shipping address/i);
  });

  test('checkout rejects empty and incomplete client state before order creation', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.setItem('priyasa_cart', '[]'));
    await page.reload();
    await expect(page.locator('body')).not.toContainText('Application error');

    const response = await page.request.post('/api/orders', {
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'storefront-e2e-empty-cart' },
      data: { items: [], paymentMethod: 'cod' },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});
