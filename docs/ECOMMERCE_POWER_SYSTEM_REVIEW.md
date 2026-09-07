# Priyasa Ecommerce Power-System Review

## Current foundation

The current system already has a strong transactional base: customers, OTP sessions, addresses, products/variants, categories, cart/wishlist, coupons, orders, payments, payment events/refunds, shipments/tracking events, returns, reviews, CMS pages/redirects, audit logs, order history/notes, idempotency keys, webhook events, devices, notifications, shipping providers/rates, warehouses and warehouse stock, and admin RBAC.

## Critical production gaps to close

### 1. Product/catalog domain
- First-class arbitrary product attributes and attribute values (not only size/color).
- Product tags, collections, brands, and merchandising rules.
- Product badges/labels such as New, Bestseller, Limited, Trending.
- Product-level publish/schedule windows and channel visibility.
- Variant barcode/GTIN, dimensions and weight.
- Variant-specific images and media ordering.
- Bulk import/export with validation and dry-run reporting.
- Search/filter indexing for category, price, size, color, attributes, availability and sort modes.

### 2. Pricing/promotions
- Coupon usage ledger rather than only a mutable `usedCount`.
- Per-customer usage limits and exclusion rules.
- Campaign/promotional price rules, BOGO and tiered discounts.
- Free-shipping rules controlled from admin.
- Gift cards/store credit.
- Price history/audit trail.

### 3. Inventory
- Reservation expiry and automated release for abandoned/failed payments.
- Per-warehouse allocation and stock transfer workflows.
- Purchase orders, suppliers and stock receiving.
- Low-stock/reorder rules.
- Stock reconciliation and adjustment approval.
- Inventory ledger with immutable references.

### 4. Orders and checkout
- Immutable order-address snapshot so historical orders never change when a saved address is edited.
- Explicit payment method/status model instead of provider strings.
- Order cancellation policy and item-level cancellation.
- Partial fulfilment and split shipments.
- COD verification/risk controls, configurable COD limits and pincode serviceability.
- Tax/HSN/GST calculation and invoice numbering.
- Order-level and item-level discounts/shipping allocation.
- Retry payment without creating duplicate orders.

### 5. Returns/refunds
- Return-item records rather than only an order-level return.
- Return reason catalogue and policy eligibility rules.
- Pickup/inspection outcomes.
- Partial refunds and refund reconciliation.
- Reverse-shipping tracking.

### 6. Customer/CRM
- Customer profile/preferences and consent history.
- Saved carts/abandoned-cart events.
- Customer segments and lifetime-value metrics.
- Review verification and moderation workflow.
- Referral/affiliate attribution and commission ledger.

### 7. Operations and integrations
- Queue/outbox pattern for email, WhatsApp, push and shipping notifications.
- Provider retry/dead-letter handling.
- Webhook signature verification and replay protection for every provider.
- Shiprocket + Shipprime adapter interface with failover/priority selection.
- Reconciliation jobs for payment and shipping states.
- Operational dashboard for stuck payments, shipments, webhooks and jobs.

### 8. Analytics/marketing
- First-party event model for view/search/add-to-cart/checkout/purchase/refund.
- Attribution fields for UTM, Meta click IDs and campaign/ad IDs.
- Consent-aware analytics.
- Server-side conversion events where supported.
- Product/campaign performance reporting.

### 9. Security/reliability
- Rate limiting on OTP, auth, checkout, coupons and admin mutations.
- CSRF/origin protections for cookie-authenticated mutations.
- Strict authorization checks on every customer/admin resource.
- Secret redaction in logs.
- Request correlation IDs and structured error logging.
- Scheduled cleanup for expired sessions, OTP challenges, idempotency keys and inventory reservations.
- Database backups/restore drills and migration discipline.

## Implemented in this review pass

- Mobile authentication is now a centered desktop dialog and a native-feeling bottom sheet on small screens, with safe-area handling and reduced-motion support.
- Checkout has premium icon-based Online Payment and Cash on Delivery selection.
- Checkout quote now exposes COD serviceability when configured shipping-rate data exists for a destination pincode.
- COD order creation is server-side and idempotent, with configurable `COD_ENABLED` and `COD_MAX_AMOUNT` controls.
- Coupon usage is incremented atomically during order creation so `maxUses` cannot be exceeded under concurrent checkout requests.
- Customer cancellation endpoint releases reserved inventory and records an immutable inventory movement/order-status event for eligible unpaid orders.
- Priyasa logo favicon is wired through Next metadata and the repository contains `src/app/icon.svg` using the supplied mark.

## Recommended implementation order

1. Inventory reservation expiry + outbox/reconciliation jobs.
2. Order-address snapshot + item-level returns/cancellations/refunds.
3. Normalized product attributes/tags/collections and advanced catalog filters.
4. Tax/GST/invoice engine.
5. Shipping provider abstraction + Shiprocket/Shipprime webhooks/reconciliation.
6. Customer CRM, abandoned cart and notification automation.
7. Analytics/attribution and Meta/WhatsApp conversion events.
8. Gift cards, store credit, referral and affiliate accounting.

The current database is suitable as a solid MVP/production foundation, but it should not be considered a fully mature Shopify-grade commerce ledger until the immutable order snapshots, reservation lifecycle, item-level returns/refunds, normalized catalog attributes and reconciliation/outbox layers are added.
