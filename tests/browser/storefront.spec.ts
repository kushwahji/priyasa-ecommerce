import {test,expect} from '@playwright/test';
test('storefront and checkout are reachable',async({page})=>{await page.goto('/');await expect(page).toHaveTitle(/Priyasa/i);await page.goto('/shop');await expect(page.locator('body')).toContainText(/Shop|Products/i);await page.goto('/checkout');await expect(page.locator('body')).toContainText('Shipping Address');});
test('admin redirects unauthenticated visitors',async({page})=>{await page.goto('/admin');await expect(page).toHaveURL(/admin\/login/);});
