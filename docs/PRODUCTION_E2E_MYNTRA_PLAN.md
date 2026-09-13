# Production E2E Myntra-style storefront

The `feature/full-e2e-api-integration` branch keeps PriyasaCore as the commerce authority and hardens the customer storefront around the production journey:

`Home → PLP → PDP → Login/OTP → Cart → Address → Payment → COD confirmation`

The current pass also covers responsive PDP media, a single WhatsApp order CTA to `+91 8104132334`, guest-cart continuity, authenticated quote normalization, mobile OTP bottom-sheet UX, and responsive cart/checkout presentation.

Final staging verification still requires a real customer OTP and a live COD order because those steps depend on the Core API and staging credentials.
