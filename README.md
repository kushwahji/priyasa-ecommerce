# PRIYASA Ecommerce

Production-oriented Indian fashion commerce platform matching the supplied Priyasa storefront direction.

## Implemented in `main`

- Next.js App Router + TypeScript foundation
- Priyasa responsive fashion storefront with announcement bar, navigation, hero, categories, offers and best sellers
- Shop and category listing routes
- Product detail with size/color selection UI and cart action
- Browser-persistent cart with discount/shipping calculation
- Checkout address flow with server-side order creation
- PostgreSQL + Prisma transactional commerce schema
- Inventory reservation during order creation
- Coupon model and `WELCOME10` seed
- Customer account, wishlist and order tracking entry points
- Protected admin dashboard with ADMIN/STAFF RBAC
- Admin product, order, inventory, CMS and marketing control centers
- Server-side Razorpay order creation
- Independent Razorpay payment signature verification
- Razorpay webhook signature verification and payment/order state transitions
- SEO metadata, sitemap and robots policy
- Vitest unit tests and GitHub Actions CI
- Secrets excluded from source control with `.env.example`

## Routes

Storefront: `/`, `/shop`, `/new-arrivals`, `/category/[slug]`, `/product/[slug]`, `/offers`, `/cart`, `/checkout`, `/account`, `/wishlist`, `/track-order`, `/about`, `/contact`.

Admin: `/admin`, `/admin/login`, `/admin/products`, `/admin/orders`, `/admin/inventory`, `/admin/cms`, `/admin/marketing`.

API: `/api/health`, `/api/products`, `/api/orders`, `/api/admin/products`, `/api/auth/admin`, `/api/payments/razorpay`, `/api/payments/razorpay/verify`, `/api/webhooks/razorpay`.

## Local setup

1. Install Node.js 20+ and PostgreSQL.
2. Copy `.env.example` to `.env` and configure `DATABASE_URL` and a strong `SESSION_SECRET`.
3. Install dependencies: `npm install`.
4. Create schema: `npm run db:push`.
5. Seed catalog and optional admin account: `ADMIN_PHONE=... ADMIN_PASSWORD=... npm run db:seed`.
6. Start: `npm run dev`.

Never put provider credentials in Git. Configure Razorpay secrets and webhook secret in deployment settings before enabling live payments.

## Commerce state model

Orders progress through server-controlled states such as `PAYMENT_PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`. The client cannot mark an order paid. Razorpay verification/webhooks are authoritative for payment confirmation.

## Architecture

The Prisma schema covers users, sessions, addresses, categories, products, variants, inventory movements, carts, wishlists, coupons, orders, payments, refunds, shipments, returns, reviews, CMS sections, pages, redirects and audit logs. Provider integrations remain behind server routes so credentials and financial state are never trusted from the browser.

## Next production phase

The foundation is intentionally provider-ready. Before launch, connect the real OTP provider, shipping/carrier provider, object storage/CDN, Meta WhatsApp/Ads credentials, AI provider, transactional email, Redis/queue worker, observability, backups and deployment environment. These integrations require real business credentials and cannot safely be fabricated in source code.
