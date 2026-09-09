import {test,expect} from '@playwright/test';

test.describe('admin product editor',()=>{
  test('unauthenticated users are protected',async({page})=>{
    await page.goto('/admin/products/invalid/edit');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
