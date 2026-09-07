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
- WhatsApp OTP login via the existing `api.priyasa.com` authentication service
- Secure HTTP-only cookie storage for the provider access token after OTP verification
- FCM web push permission popup, token acquisition and device registration/update/refresh/logout/delete proxy routes
- Firebase messaging service worker for background notifications
- GitHub Actions CI
- Secrets excluded from source control with `.env.example`

## Auth and device APIs

The storefront uses server-side proxy routes so browser code never needs to call the external authentication service directly:

- `POST /api/auth/send-otp` → `POST https://api.priyasa.com/api/v1/auth/send-otp`
- `POST /api/auth/verify-otp` → `POST https://api.priyasa.com/api/v1/auth/verify-otp`
- `POST /api/auth/resend-otp` → `POST https://api.priyasa.com/api/v1/auth/resend-otp`
- `DELETE /api/auth/cancel-otp/[requestId]` → external OTP cancellation endpoint
- `POST /api/device/register` → external device registration endpoint
- `POST /api/device/update` → external device/user linking endpoint
- `POST /api/device/refresh` → external FCM token refresh endpoint
- `POST /api/device/logout` → external device logout endpoint
- `DELETE /api/device/delete` → external device removal endpoint

The login modal asks for browser notification permission before sending OTP. If Firebase web configuration is present, it obtains the FCM registration token and registers the device. If Firebase is not configured yet, WhatsApp OTP login still works and the UI explains that push registration needs Firebase settings.

## Routes

Storefront: `/`, `/shop`, `/new-arrivals`, `/category/[slug]`, `/product/[slug]`, `/offers`, `/cart`, `/checkout`, `/account`, `/wishlist`, `/track-order`, `/about`, `/contact`.

Admin: `/admin`, `/admin/login`, `/admin/products`, `/admin/orders`, `/admin/inventory`, `/admin/cms`, `/admin/marketing`.

API: `/api/health`, `/api/products`, `/api/orders`, `/api/admin/products`, `/api/auth/admin`, `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/auth/resend-otp`, `/api/auth/cancel-otp/[requestId]`, `/api/device/register`, `/api/device/update`, `/api/device/refresh`, `/api/device/logout`, `/api/device/delete`, `/api/payments/razorpay`, `/api/payments/razorpay/verify`, `/api/webhooks/razorpay`.

## Firebase web configuration

Set these deployment environment variables to enable real FCM token registration:

`NEXT_PUBLIC_FIREBASE_API_KEY`
`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
`NEXT_PUBLIC_FIREBASE_PROJECT_ID`
`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
`NEXT_PUBLIC_FIREBASE_APP_ID`
`NEXT_PUBLIC_FIREBASE_VAPID_KEY`

The app does not commit Firebase credentials or provider secrets.

## Local setup

1. Install Node.js 20+ and PostgreSQL.
2. Copy `.env.example` to `.env` and configure `DATABASE_URL` and a strong `SESSION_SECRET`.
3. Install dependencies: `npm install`.
4. Create schema: `npm run db:push`.
5. Seed catalog and optional admin account: `ADMIN_PHONE=... ADMIN_PASSWORD=... npm run db:seed`.
6. Start: `npm run dev`.

Never put provider credentials in Git. Configure Razorpay, Firebase and external Priyasa API settings in deployment secrets/environment configuration.

## Commerce state model

Orders progress through server-controlled states such as `PAYMENT_PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`. The client cannot mark an order paid. Razorpay verification/webhooks are authoritative for payment confirmation.

## Architecture

The Prisma schema covers users, sessions, addresses, categories, products, variants, inventory movements, carts, wishlists, coupons, orders, payments, refunds, shipments, returns, reviews, CMS sections, pages, redirects and audit logs. Provider integrations remain behind server routes so credentials and financial state are never trusted from the browser.
