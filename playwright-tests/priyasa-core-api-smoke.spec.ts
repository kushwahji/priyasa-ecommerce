import { test, expect } from '@playwright/test';

const base = (process.env.PRIYASA_API_BASE_URL || 'https://api.priyasa.com').replace(/\/$/, '');

async function coreGet(request: any, path: string) {
  const response = await request.get(`${base}${path}`);
  expect(response.status(), `${path} must not return a server error`).toBeLessThan(500);
  const contentType = response.headers()['content-type'] || '';
  expect(contentType, `${path} must return JSON`).toContain('application/json');
  return response;
}

test.describe('PriyasaCore public API contract', () => {
  test('health endpoint is reachable', async ({ request }) => {
    const response = await coreGet(request, '/api/v1/health');
    expect(response.status()).toBe(200);
  });

  test('storefront catalog endpoints are reachable', async ({ request }) => {
    for (const path of [
      '/api/v1/storefront/products?sort=newest&per_page=1',
      '/api/v1/storefront/categories',
      '/api/v1/storefront/collections',
      '/api/v1/storefront/cms/home',
    ]) {
      await coreGet(request, path);
    }
  });
});

test('store homepage actually calls PriyasaCore catalog API', async ({ page }) => {
  const coreRequests: string[] = [];
  page.on('request', request => {
    if (request.url().includes('/api/v1/storefront/')) coreRequests.push(request.url());
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  expect(coreRequests.some(url => url.includes('/api/v1/storefront/products'))).toBeTruthy();
});
