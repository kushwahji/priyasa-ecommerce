# Hostinger environment configuration

Priyasa is deployed from GitHub, but production secrets are **not** stored in the repository. Hostinger must inject the environment variables into the Node.js application at runtime, and variables used by the Next.js build must also be available during the build.

## Required for the web application

Set these in the Hostinger Node.js application environment/secrets:

- `NODE_ENV=production`
- `DATABASE_URL=mysql://<hostinger-user>:<password>@<hostinger-db-host>:3306/<database-name>`
- `SESSION_SECRET=<long-random-secret-at-least-32-characters>`
- `NEXT_PUBLIC_APP_URL=https://staging.priyasa.in` for staging

Do not commit real values to GitHub.

## Production integrations

Configure only the integrations that are enabled for the environment:

- Razorpay: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- Shipping: `SHIPPING_PROVIDER`, Shiprocket credentials, or Shipprime credentials
- OTP/API: `PRIYASA_API_BASE_URL`, `PRIYASA_API_TOKEN`, `OTP_PROVIDER_URL`, `OTP_PROVIDER_TOKEN`
- Email: `RESEND_API_KEY`, `EMAIL_FROM`
- Jobs: `CRON_SECRET`
- Firebase web push: the `NEXT_PUBLIC_FIREBASE_*` variables
- WooCommerce: `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET`

## Important Git deployment rule

Git deployment updates application code. It does **not** automatically copy Hostinger's private environment/secrets into the repository. Keep secrets configured in Hostinger.

The repository intentionally does not contain a `.env` file. `.env.example` is only a variable-name template.

## Verify after every deployment

Open:

`https://staging.priyasa.in/api/health`

A healthy deployment returns JSON containing:

- `ok: true`
- `database: "up"`
- `environment.databaseUrl: true`
- `environment.sessionSecret: true`

If `database` is `not_configured`, Hostinger did not inject `DATABASE_URL` into the running Node.js process. If it is `down`, the variable exists but the server cannot connect to the configured MySQL host/database.

Never expose or log the actual values of secrets when troubleshooting.
