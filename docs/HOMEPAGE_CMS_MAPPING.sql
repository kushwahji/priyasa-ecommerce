-- PRIYASA homepage CMS mapping
-- PostgreSQL / Prisma CmsSection
-- Run only after backing up existing homepage sections. Replace image URLs with
-- creatives uploaded through Admin > Homepage Studio.

INSERT INTO "CmsSection" ("id","key","type","title","subtitle","imageUrl","mobileImageUrl","ctaLabel","ctaHref","sortOrder","startsAt","endsAt","active") VALUES
(gen_random_uuid()::text,'home.hero.01','hero-slide','Celebrate Tradition in Style','FESTIVAL COLLECTION','','','Shop Now','/collections',10,NULL,NULL,true),
(gen_random_uuid()::text,'home.hero.02','hero-slide','New Season, New You','LATEST COLLECTION','','','Shop New In','/new-arrivals',11,NULL,NULL,true),
(gen_random_uuid()::text,'home.hero.03','hero-slide','Everyday Style, Beautifully Done','PRIYASA EDIT','','','Explore Styles','/shop',12,NULL,NULL,true),
(gen_random_uuid()::text,'home.casual','casual-grid','Casual Vibes','CASUAL EDIT','','','Shop Casually','/shop',20,NULL,NULL,true),
(gen_random_uuid()::text,'home.casual.tops','casual-item','Tops & Tees','CASUAL','','','Shop Tops','/category/tops',21,NULL,NULL,true),
(gen_random_uuid()::text,'home.casual.dresses','casual-item','Dresses','CASUAL','','','Shop Dresses','/category/dresses',22,NULL,NULL,true),
(gen_random_uuid()::text,'home.casual.coords','casual-item','Co-ord Sets','CASUAL','','','Shop Co-ords','/shop?search=co-ord',23,NULL,NULL,true),
(gen_random_uuid()::text,'home.casual.bottoms','casual-item','Palazzos & Bottoms','CASUAL','','','Shop Bottoms','/category/bottoms',24,NULL,NULL,true),
(gen_random_uuid()::text,'home.new-launch','products-latest','New Launch','NEW IN',NULL,NULL,'View All','/new-arrivals',30,NULL,NULL,true),
(gen_random_uuid()::text,'home.delivery','delivery-banner','Shop with confidence','FREE SHIPPING • EASY RETURNS • SECURE PAYMENTS',NULL,NULL,NULL,NULL,40,NULL,NULL,true),
(gen_random_uuid()::text,'home.festival','festival-grid','Festival Collection','FESTIVAL EDIT','','','Shop Collection','/collections',50,NULL,NULL,true),
(gen_random_uuid()::text,'home.all-styles','products-all','All Styles','CURATED FOR YOU',NULL,NULL,'View All','/shop',60,NULL,NULL,true),
(gen_random_uuid()::text,'home.centre','center-editorial','Style for Every You','THE PRIYASA WAY','','','Explore Priyasa','/shop',70,NULL,NULL,true)
ON CONFLICT ("key") DO UPDATE SET
  "type"=EXCLUDED."type","title"=EXCLUDED."title","subtitle"=EXCLUDED."subtitle",
  "ctaLabel"=EXCLUDED."ctaLabel","ctaHref"=EXCLUDED."ctaHref","sortOrder"=EXCLUDED."sortOrder",
  "active"=EXCLUDED."active";

-- Sale/campaign example: set a section's live window without changing code.
-- UPDATE "CmsSection"
-- SET "startsAt"='2026-09-10 00:00:00+05:30', "endsAt"='2026-09-20 23:59:59+05:30', "active"=true
-- WHERE "key"='home.festival';

-- Recommended final storefront order:
-- 10-12 Hero slider (slides)
-- 20-24 Casual Vibes + four image boxes
-- 30 New Launch
-- 40 Delivery / benefits
-- 50 Festival Collection
-- 60 All Styles (30 products + Load More)
-- 70 Centre editorial
