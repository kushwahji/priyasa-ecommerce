# PRIYASA Ecommerce

Production-oriented Indian fashion commerce platform with a premium Priyasa customer experience and a database-driven storefront.

## Customer experience

The storefront is designed as a complete fashion-commerce journey: responsive home, live catalogue/category pages, product detail, variants, wishlist, bag, delivery pincode, saved addresses, authenticated checkout, Razorpay payment, order confirmation, order tracking, My Orders and payment retry.

## Data architecture

Customer-facing product, category, variant, inventory, review, offer/coupon, CMS and customer/order data are read from Prisma/MySQL at runtime. The UI does not contain a hardcoded product catalogue. CMS sections control homepage/shop/offer creative content; coupons control live offers and the offer popup.

The seed script only provides initial database content for a new environment. Production content should be managed through the admin/CMS layer.

## Authentication

Customer login is phone-number + WhatsApp OTP only. OTP verification is proxied server-side to `api.priyasa.com`, and the provider access token is stored in a secure HTTP-only cookie. Successful verification also synchronizes the customer phone into the local commerce `User` record so orders, addresses and wishlist data are owned by the authenticated customer.

## Notifications

The notification permission UI is independent from login. When the customer grants permission, the browser obtains an FCM token and the server-side device proxy registers it with the configured Priyasa API. Firebase web configuration remains deployment-only.

## Checkout and payment

Checkout requires an authenticated customer, validates real database variant IDs and live inventory, reserves inventory transactionally, applies the database coupon rules, creates an order in `PAYMENT_PENDING`, and creates a Razorpay payment order. Razorpay signature verification is server-side. Successful verification finalizes inventory and moves the order to `CONFIRMED`. Customers can retry an incomplete payment from My Orders.

## Shipping

The product and checkout experience includes a live delivery-pincode check backed by the configured Shiprocket provider and the merchant pickup pincode.

## Routes

Storefront: `/`, `/shop`, `/new-arrivals`, `/category/[slug]`, `/product/[slug]`, `/offers`, `/cart`, `/checkout`, `/checkout/payment/[orderId]`, `/checkout/success`, `/account`, `/account/edit`, `/account/addresses`, `/account/orders`, `/account/orders/[id]`, `/wishlist`, `/track-order`, `/about`, `/contact`.

Customer APIs: `/api/customer/session`, `/api/customer/orders`, `/api/customer/orders/[id]`, `/api/customer/addresses`, `/api/customer/profile`, `/api/customer/wishlist`, `/api/storefront/promo`.

Auth/device APIs: `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/auth/resend-otp`, `/api/auth/cancel-otp/[requestId]`, `/api/device/register`, `/api/device/update`, `/api/device/refresh`, `/api/device/logout`, `/api/device/delete`.

Payment APIs: `/api/payments/razorpay`, `/api/payments/razorpay/verify`, `/api/webhooks/razorpay`.

Admin: `/admin`, `/admin/login`, `/admin/products`, `/admin/orders`, `/admin/inventory`, `/admin/cms`, `/admin/marketing`.

## MySQL deployment

Hostinger production uses the generated `prisma/schema.mysql.prisma` schema. The deployment build prepares the MySQL schema before Prisma generation and Next.js build. CI validates the MySQL schema and runs TypeScript/tests/build checks.

## Environment

Configure deployment secrets/environment variables for `DATABASE_URL`, `SESSION_SECRET`, Razorpay, Shiprocket, the Priyasa API token/base URL and Firebase web settings. Never commit credentials to Git.

## Quality gates

The repository includes TypeScript checks, unit tests, Playwright storefront checks and MySQL Prisma validation. A CI failure must be fixed before treating a commit as production-ready.
