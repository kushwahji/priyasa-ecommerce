# Priyasa Ecommerce

Production-ready fashion ecommerce platform for Priyasa.

## Vision

Priyasa is being built as a mobile-first Indian fashion commerce platform with a high-quality storefront, secure checkout, customer accounts, administration, WhatsApp commerce, Meta marketing automation, AI-assisted shopping, SEO, analytics, and production-grade reliability.

## Planned Stack

- Next.js App Router + TypeScript
- Tailwind CSS + accessible component system
- Server-side rendering and SEO-first product/category pages
- Relational database with migrations and transactional commerce operations
- Razorpay for payments
- Meta WhatsApp Business Platform for conversational commerce
- Meta Graph API for Facebook/Instagram marketing automation
- AI provider abstraction for shopping and marketing assistance

## Core Commerce

- Home, categories, collections, offers, and campaigns
- Product pages with variants, SKU, pricing, inventory, media, and structured data
- Search, filters, sorting, wishlist, cart, and checkout
- Customer accounts, addresses, orders, returns, refunds, and notifications
- Coupons, discounts, taxes, invoices, shipping, and payment records
- Idempotent payment and webhook processing

## Security

- Secure HTTP-only session cookies
- Server-side authorization and admin RBAC
- Password hashing and account recovery
- Input/schema validation and rate limiting
- Webhook signature verification
- Idempotency for financial and external-provider operations
- Secrets kept outside source control
- Audit logging for sensitive administrative actions

## SEO & Performance

- Server-rendered indexable pages
- Metadata, canonical URLs, Open Graph, sitemap, and robots
- Product, Offer, Breadcrumb, and Organization JSON-LD
- Clean slugs and redirect handling
- Optimized images, accessibility, and Core Web Vitals

## Integrations

### Razorpay

Create payment orders server-side, verify signatures independently, process webhooks idempotently, synchronize captures/refunds, and reconcile payment state.

### WhatsApp

Shared Meta webhook architecture for verification, authenticated events, customer identity resolution, product discovery, cart assistance, order status, payment links, abandoned-cart flows, support handoff, and message auditing.

### Meta Ads

Support connected business/ad accounts, catalog synchronization, Pixel/Conversions API, campaign and ad-set workflows, audiences, creative/copy variants, approval-before-publish, performance analytics, and automated optimization rules.

### AI

AI capabilities are advisory and policy-controlled: product discovery, recommendations, size/style assistance, customer support, product copy, SEO metadata, ad copy, creative briefs, campaign suggestions, and merchandising insights. Sensitive operations require explicit server-side authorization.

## Admin Portal

Dashboard, products, categories, collections, inventory, orders, customers, coupons, reviews, returns/refunds, shipping, payments, CMS, SEO, WhatsApp, Meta, ads, AI, analytics, reports, settings, users/roles/permissions, integrations, webhooks, and audit logs.

## Suggested Structure

```text
src/
  app/
    (storefront)/
    account/
    checkout/
    admin/
    api/
  components/
  features/
    auth/
    catalog/
    cart/
    checkout/
    orders/
    payments/
    wishlist/
    reviews/
    whatsapp/
    marketing/
    ads/
    ai/
  lib/
    auth/
    db/
    payments/
    meta/
    whatsapp/
    shipping/
    analytics/
  server/
  types/
  styles/

tests/
  unit/
  integration/
  e2e/

.github/
  workflows/

.env.example
README.md
```

## Engineering Principles

1. Treat all browser input as untrusted.
2. Keep business rules authoritative on the server.
3. Never trust client-provided payment amounts or order state.
4. Authenticate and verify external webhooks.
5. Make payment, order, and webhook processing idempotent.
6. Keep provider integrations behind explicit service boundaries.
7. Never commit credentials or secrets.
8. Enforce customer and administrator authorization server-side.
9. Log security-sensitive and financial state transitions without exposing secrets.
10. Test critical checkout, payment, authentication, authorization, and webhook flows end-to-end.

## Delivery Roadmap

1. Foundation: Next.js, TypeScript, UI system, database, configuration, CI.
2. Commerce: catalog, inventory, cart, checkout, customers, orders.
3. Security & payments: authentication, RBAC, Razorpay, webhooks, refunds.
4. SEO & content: CMS primitives, structured data, metadata, sitemap, performance.
5. WhatsApp & Meta: integrations, webhooks, catalog, conversational commerce, ads.
6. AI & growth: shopping assistant, recommendations, creative/copy automation, analytics.
7. Production hardening: observability, backups, resilience, security, E2E, deployment, monitoring.

## Development

The implementation will be added incrementally with small, reviewable commits. Provider credentials belong in deployment secrets or environment configuration and must never be committed to Git.

## License

Private/proprietary Priyasa project unless a different license is explicitly selected later.
