import { test, expect, devices } from '@playwright/test';

async function getFirstProduct(page:any){
  const response=await page.request.get('/api/storefront/search?limit=12');
  if(!response.ok()) return null;
  const payload=await response.json().catch(()=>({}));
  return payload?.data?.products?.[0]||null;
}

test.describe('production storefront route QA',()=>{
  test('home has the reference hierarchy and no console/runtime error',async({page})=>{
    const errors:string[]=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/',{waitUntil:'domcontentloaded'});
    await expect(page.locator('.site-header')).toBeVisible();
    await expect(page.locator('.mobile-home-search')).toBeVisible();
    await expect(page.locator('.home-managed-hero')).toBeVisible();
    await expect(page.locator('.home-managed-trust')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Application error');
    expect(errors).toEqual([]);
  });

  for(const route of ['/shop','/cart','/checkout','/login','/account','/account/orders','/account/addresses','/account/returns','/wishlist']){
    test(`${route} renders as a production route`,async({page})=>{
      const response=await page.goto(route,{waitUntil:'domcontentloaded'});
      expect(response?.status()??200).toBeLessThan(500);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('body')).not.toContainText('Application error');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
      expect(overflow,`${route} horizontal overflow`).toBeLessThanOrEqual(2);
    });
  }

  test('login modal validates bad input without calling OTP API',async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await page.goto('/login',{waitUntil:'domcontentloaded'});
    const dialog=page.getByRole('dialog',{name:'Priyasa login'});
    await expect(dialog).toBeVisible();
    const otpCalls:number[]=[];
    page.on('request',request=>{if(request.url().includes('/api/auth/send-otp'))otpCalls.push(1)});
    await page.getByPlaceholder('Enter your mobile number').fill('123');
    await page.getByRole('button',{name:'Send OTP'}).click();
    await expect(page.getByRole('alert')).toContainText('valid 10-digit mobile number');
    expect(otpCalls).toHaveLength(0);
  });

  test('logout endpoint clears the storefront session safely',async({page})=>{
    const response=await page.request.post('/api/auth/logout');
    expect(response.status()).toBe(200);
    const payload=await response.json();
    expect(payload.ok).toBe(true);
  });

  test('product -> details -> cart -> checkout gate is wired to real catalog data',async({page})=>{
    await page.addInitScript(()=>localStorage.setItem('priyasa_cart','[]'));
    const product=await getFirstProduct(page);
    test.skip(!product?.slug,'No active catalog product is available in the test environment.');
    await page.goto(`/product/${encodeURIComponent(product.slug)}`,{waitUntil:'domcontentloaded'});
    await expect(page.locator('h1').first()).toContainText(product.name);
    await expect(page.locator('.product-gallery, .pdp-layout').first()).toBeVisible();
    const purchase=page.locator('.purchase-panel').first();
    const size=purchase.locator('.size-options button:not(:disabled)').first();
    if(await size.count()) await size.click();
    const add=purchase.getByRole('button',{name:'Add to Cart',exact:true}).first();
    await expect(add).toBeEnabled();
    await add.click();
    await page.goto('/cart',{waitUntil:'domcontentloaded'});
    await expect(page.locator('.cart-product').first()).toBeVisible();
    await page.goto('/checkout',{waitUntil:'domcontentloaded'});
    await expect(page.locator('body')).toContainText(/Sign in to continue|Complete your order|Shipping address/i);
  });

  test('checkout payment route never creates an order from an invalid request',async({page})=>{
    const response=await page.request.post('/api/orders',{headers:{'Content-Type':'application/json','Idempotency-Key':'production-flow-invalid-order'},data:{items:[],paymentMethod:'razorpay'}});
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('production mobile shell',()=>{
  test.use({viewport:devices['iPhone 13'].viewport,userAgent:devices['iPhone 13'].userAgent,isMobile:true,hasTouch:true});
  test('five-item bottom navigation and discovery search are aligned',async({page})=>{
    await page.goto('/',{waitUntil:'domcontentloaded'});
    const nav=page.locator('.mobile-bottom-nav');
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link',{name:'Home'})).toBeVisible();
    await expect(nav.getByRole('link',{name:'Shop'})).toBeVisible();
    await expect(nav.getByRole('link',{name:'Wishlist'})).toBeVisible();
    await expect(nav.getByRole('link',{name:'Orders'})).toBeVisible();
    await expect(nav.getByRole('link',{name:'Account'})).toBeVisible();
    await expect(page.locator('.mobile-home-search')).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
