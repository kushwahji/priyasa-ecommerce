# PRIYASA Ecommerce

Production-oriented Indian fashion storefront with a premium PRIYASA customer experience. The Store application is **API-first**: `api.priyasa.com` (PRIYASA Core) is the authoritative commerce system.

## Customer experience

The storefront provides responsive home, live catalogue/category pages, product detail, variants, wishlist, bag, delivery pincode, saved addresses, authenticated checkout, Razorpay payment, COD where available, order confirmation, tracking, My Orders, invoice, cancellation, returns and payment retry.

## Data architecture

The Store does **not** own a commerce database. Product, category, variant, inventory, review, offer/coupon, CMS, customer, cart, order, payment, shipment, return and invoice state are read or mutated through authenticated APIs on `api.priyasa.com`.

The browser may keep only temporary presentation state such as the local shopping bag. Server-side business state remains authoritative in PRIYASA Core, which prevents the Store and Admin applications from maintaining conflicting order or inventory records.

## Authentication

Customer login is phone-number + OTP. OTP verification is proxied server-side to `api.priyasa.com`; the returned Core access token is stored in a secure HTTP-only cookie and is used for subsequent customer API requests.

## Notifications

The notification permission UI is independent from login. When the customer grants permission, the browser obtains an FCM token and the Store device proxy registers it with the configured PRIYASA API. Firebase web configuration remains deployment-only.

## Checkout and payment

Checkout requires an authenticated customer. The Store sends the cart and delivery information to PRIYASA Core, which is the pricing, coupon, inventory and order authority. The Store never calculates the final payable amount as a source of truth. Razorpay order creation and signature verification are proxied to Core, and failed payments remain retryable from My Orders.

## Shipping and returns

Delivery availability, shipment state, cancellation, return requests, refunds and tracking are Core-owned workflows. The Store only provides the customer-facing experience and secure API proxies.

## Administration

Administration is intentionally separated into the PRIYASA Admin application. Legacy embedded Store admin URLs are disabled and return HTTP `410 Gone`; they must not be used for production administration.

## Routes

Storefront: `/`, `/shop`, `/new-arrivals`, `/category/[slug]`, `/product/[slug]`, `/offers`, `/cart`, `/checkout`, `/checkout/payment/[orderId]`, `/checkout/success`, `/account`, `/account/edit`, `/account/addresses`, `/account/orders`, `/account/orders/[id]`, `/account/orders/[id]/invoice`, `/wishlist`, `/track-order`, `/about`, `/contact`.

Customer APIs: `/api/customer/session`, `/api/customer/orders`, `/api/customer/orders/[id]`, `/api/customer/orders/[id]/cancel`, `/api/customer/orders/[id]/invoice`, `/api/customer/orders/[id]/return`, `/api/customer/addresses`, `/api/customer/profile`, `/api/customer/wishlist`.

Auth/device APIs: `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/auth/resend-otp`, `/api/auth/cancel-otp/[requestId]`, `/api/device/register`, `/api/device/update`, `/api/device/refresh`, `/api/device/logout`, `/api/device/delete`.

Payment APIs: `/api/payments/razorpay`, `/api/payments/razorpay/verify`, `/api/webhooks/razorpay`.

## Environment

Configure only storefront deployment settings and integration secrets required by the Store, including `PRIYASA_API_BASE_URL` and payment/Firebase configuration where applicable. Core database credentials such as `DATABASE_URL` do not belong in the Store deployment.

## Quality gates

CI runs TypeScript checks, unit tests, a production Next.js build and Playwright storefront E2E tests. The Store CI does not provision MySQL and does not run Prisma migrations because commerce persistence belongs to PRIYASA Core.
