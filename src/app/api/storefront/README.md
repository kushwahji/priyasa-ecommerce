# Storefront API contract

The browser storefront must use `/api/storefront/*` for new PriyasaCore commerce operations. The route proxies to `/api/v1/storefront/*` and keeps the customer access token server-side.

Public reads include home, CMS, settings, categories, collections, products and shipping serviceability/methods. Customer operations require the secure Priyasa access token.

Core remains authoritative for product price, stock, coupons, checkout totals, order state, payment state, shipment state, returns and refunds. The local Prisma database must not become a second source of truth for these domains.
