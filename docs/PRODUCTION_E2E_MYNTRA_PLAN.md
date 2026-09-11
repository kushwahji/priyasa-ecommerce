# Priyasa Store — production E2E contract

This branch keeps the Laravel Core API at `https://api.priyasa.com/api/v1` as the commerce authority. The Next.js application is the storefront and BFF/session layer; it must not become a competing order, payment or inventory authority.

## UX target

The storefront follows the current marketplace interaction model used by leading Indian fashion commerce: compact discovery header, search-first navigation, category/product discovery rails, dense product cards, strong offer hierarchy, mobile bottom navigation, editorial home merchandising and a conversion-focused PDP. The implementation is Priyasa-branded rather than copying proprietary assets or source code.

## Critical journeys

1. Home -> category/shop -> product detail.
2. Product gallery -> variant/size -> delivery pincode -> add to bag.
3. Login -> send OTP -> verify OTP -> signed Priyasa session.
4. Address -> cart -> checkout validation -> idempotent order creation.
5. Online payment -> callback/webhook -> confirmed order.
6. COD -> serviceability/risk validation -> confirmed order.
7. Order history -> shipment -> tracking -> delivered.
8. Delivered order -> review / return -> refund lifecycle.
9. Android WebView -> device registration -> authenticated `/api/device/update`.

## Hardening added on this branch

- Product gallery now has a guaranteed placeholder media path and safe single-media behavior, avoiding empty-array navigation and zero-length modulo issues.
- Storefront Playwright smoke coverage checks home discovery, dynamic PDP navigation, login modal state and cart entry.
- Existing OTP BFF routes remain same-origin for the browser/WebView while forwarding to the Core API, preserving server-side session cookies and preventing provider tokens from being exposed to client JavaScript.

## Deployment gate

A production deployment is not considered green until the Playwright suite passes against the deployed URL and the authenticated checkout/payment/shipping journeys are exercised with staging credentials. OTP, payment, shipping and webhook provider behavior cannot be truthfully validated from static source inspection alone.
