import {test,expect} from '@playwright/test';

test('storefront and checkout entry are reachable',async({page})=>{await page.goto('/');await expect(page).toHaveTitle(/Priyasa/i);await page.goto('/shop');await expect(page.locator('body')).toContainText(/All styles|Shop/i);await page.goto('/checkout');await expect(page.locator('body')).toContainText(/Sign in to continue|Shipping address/i);});
test('customer login is mobile OTP only',async({page})=>{await page.goto('/login');await expect(page.locator('body')).toContainText(/Sign in with mobile|Continue with Mobile/i);await expect(page.locator('body')).not.toContainText('Google');await expect(page.locator('body')).not.toContainText('Facebook');});
test('customer order and payment routes are present',async({page})=>{await page.goto('/account/orders');await expect(page.locator('body')).toContainText(/My Orders|Sign in/i);await page.goto('/track-order');await expect(page.locator('body')).toContainText(/Track Your Order/i);});
test('admin redirects unauthenticated visitors',async({page})=>{await page.goto('/admin');await expect(page).toHaveURL(/admin\/login/);});
