import {test,expect} from '@playwright/test';

const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3000';
test.use({baseURL:base});

test.describe('Priyasa storefront production smoke',()=>{
 test('home exposes marketplace navigation and product discovery',async({page})=>{
  await page.goto('/');
  await expect(page).toHaveTitle(/PRIYASA|Priyasa/i);
  await expect(page.locator('a[href*="/product/"]').first()).toBeVisible({timeout:15000});
  await expect(page.locator('a[href="/shop"],a[href*="/shop"]').first()).toBeVisible();
 });

 test('product details route loads without broken gallery',async({page})=>{
  await page.goto('/');
  const product=page.locator('a[href*="/product/"]').first();
  await expect(product).toBeVisible({timeout:15000});
  const href=await product.getAttribute('href');
  expect(href).toMatch(/^\/product\//);
  await page.goto(href!);
  await expect(page.locator('.pdp-page')).toBeVisible({timeout:15000});
  await expect(page.locator('.pdp-info h1')).toBeVisible();
  await expect(page.locator('.pdp-main-image img')).toBeVisible();
  await expect(page.locator('.gallery-counter')).toHaveText(/1 \/ [1-9]\d*/);
 });

 test('login modal supports phone and OTP entry states',async({page})=>{
  await page.goto('/');
  const login=page.getByRole('button',{name:/login with mobile/i});
  await expect(login).toBeVisible({timeout:15000});
  await login.click();
  await expect(page.getByRole('dialog',{name:/Priyasa login/i})).toBeVisible();
  const mobile=page.getByPlaceholder(/mobile number/i);
  await mobile.fill('9876543210');
  await expect(page.getByRole('button',{name:/send otp/i})).toBeEnabled();
 });

 test('cart and checkout entry points remain reachable',async({page})=>{
  await page.goto('/cart');
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.locator('body')).toContainText(/cart|bag/i);
 });
});
