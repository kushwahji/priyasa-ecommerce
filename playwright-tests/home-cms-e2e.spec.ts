import {test,expect} from '@playwright/test';

const apiBase=process.env.PRIYASA_API_BASE_URL||'https://api.priyasa.com';

test.describe('PRIYASA CMS homepage',()=>{
 test('CMS API is healthy and sections are ordered',async({request})=>{
  const r=await request.get(`${apiBase}/api/v1/storefront/home`);
  expect(r.ok()).toBeTruthy();
  const body=await r.json();
  expect(body.success).toBeTruthy();
  const sections=body?.data?.sections;
  expect(Array.isArray(sections)).toBeTruthy();
  for(let i=1;i<sections.length;i++)expect(Number(sections[i].sort_order??0)).toBeGreaterThanOrEqual(Number(sections[i-1].sort_order??0));
 });
 test('homepage renders API-managed sections without horizontal overflow',async({page})=>{
  const apiResponse=await page.request.get(`${apiBase}/api/v1/storefront/home`);
  expect(apiResponse.ok()).toBeTruthy();
  const body=await apiResponse.json();
  const sections=body?.data?.sections||[];
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  expect(await page.evaluate(()=>Math.abs(document.documentElement.scrollWidth-window.innerWidth))).toBeLessThanOrEqual(2);
  const hero=sections.find((s:any)=>['hero_slider','hero'].includes(String(s.type||'').toLowerCase()));
  if(hero)await expect(page.locator('[data-testid="home-hero"]')).toBeVisible();
  for(const section of sections){
   const title=String(section.title||'').trim();
   if(title)expect((await page.locator('body').innerText()).toLowerCase()).toContain(title.toLowerCase());
  }
 });
});
