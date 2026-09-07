# Priyasa Custom Commerce API + Automation

## Create a connection

Admin endpoint: `POST /api/admin/integrations/custom-api` (admin permission `settings.write`).

Request fields: `name`, `baseUrl`, `apiKey`, `productsEndpoint`, `ordersEndpoint`, `customersEndpoint`, `orderUpdateEndpoint`, `webhookUrl`, optional `webhookSecret`, and `scopes`.

The response returns the generated client API key and webhook credentials **once**. Store them securely.

## REST API

All `/api/v1/*` commerce endpoints require:

```http
Authorization: Bearer YOUR_COMMERCE_API_KEY
Content-Type: application/json
Accept: application/json
```

Endpoints:

- `GET /api/v1/products?page=1&per_page=50`
- `GET /api/v1/products/{id}`
- `GET /api/v1/orders?page=1&per_page=50&status=shipped&updated_after=2026-09-01T00:00:00Z`
- `GET /api/v1/orders/{id}`
- `POST /api/v1/orders`
- `PATCH /api/v1/orders/{id}` with `{ "status": "shipped" }`
- `GET /api/v1/customers?page=1&per_page=50`

`POST /api/v1/orders` requires an `Idempotency-Key` header. Repeating the same key returns the original response instead of creating a second order.

Normalized order statuses:
`pending`, `confirmed`, `processing`, `packed`, `shipped`, `out_for_delivery`, `delivered`, `cancelled`, `failed`, `refunded`, `returned`.

## Incoming webhook

Generated URL:

`POST /api/public/commerce-automation/webhooks/custom/{webhook_token}`

Required headers:

```http
X-Commerce-Signature: sha256=...
X-Commerce-Timestamp: 2026-09-08T01:30:00Z
X-Commerce-Event: order.updated
X-Commerce-Event-Id: evt_987654
```

Signature is HMAC-SHA256 over `timestamp + "." + raw_request_body`. Timestamps older/newer than five minutes are rejected and event IDs are deduplicated through the existing `WebhookEvent` ledger.

Supported event names include `product.created`, `product.updated`, `product.deleted`, `order.created`, `order.updated`, `order.cancelled`, `order.shipped`, `order.delivered`, `order.refunded`, `customer.created`, and `customer.updated`.

## Outbound status automation

Every successful `recordOrderStatus()` transition now emits:

- `order.status_changed`
- `order.{normalized_status}`
- `order.updated` custom webhook events

Existing `Automation` rules are queued as `AutomationRun` records. The existing cron worker processes those runs and queued custom webhook deliveries with retry/backoff.

Example automation:

```json
{
  "name": "WhatsApp shipped notification",
  "trigger": "order.shipped",
  "conditions": { "status": "shipped" },
  "actions": [{ "type": "webhook", "url": "https://automation.example.com/order-shipped" }]
}
```

## Security

- API keys are stored as SHA-256 hashes; remote credentials and webhook secrets are encrypted with AES-256-GCM using `SESSION_SECRET`.
- Permission scopes are checked per endpoint.
- Public API requests are logged.
- A per-process 120 requests/minute connection limiter is enabled.
- Webhooks use HMAC-SHA256, five-minute timestamp validation, constant-time signature comparison, and event-ID replay protection.
- Webhook deliveries are persisted and retried with exponential backoff.
- Never put API keys or webhook secrets in source control or client-side code.

The Hostinger deployment must have `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, and `CRON_SECRET` configured.
