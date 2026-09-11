import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { priyasaApi } from '@/lib/priyasa-api';
import { CashIcon, CheckIcon, ShieldIcon } from '@/components/StorefrontIcons';

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const value = (obj: Record<string, unknown>, ...keys: string[]) => keys.map((key) => obj[key]).find((item) => item !== undefined && item !== null);
const numberValue = (obj: Record<string, unknown>, ...keys: string[]) => Number(value(obj, ...keys) ?? 0);
const textValue = (obj: Record<string, unknown>, ...keys: string[]) => String(value(obj, ...keys) ?? '');

export default async function CheckoutSuccess({ searchParams }: { searchParams: Promise<{ order?: string; method?: string }> }) {
  const params = await searchParams;
  if (!params.order) return notFound();

  const token = (await cookies()).get('priyasa_access_token')?.value;
  if (!token) return notFound();

  // Core is the source of truth for payment/order state. The confirmation URL
  // is only a locator and must never itself be treated as proof of payment.
  const { response, body } = await priyasaApi(`/api/v1/storefront/orders/${encodeURIComponent(params.order)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return notFound();

  const raw = ((body as any)?.data ?? body) as Record<string, unknown>;
  const order = (raw?.order && typeof raw.order === 'object' ? raw.order : raw) as Record<string, unknown>;
  const orderNumber = textValue(order, 'order_number', 'orderNumber') || params.order;
  const status = textValue(order, 'status').toLowerCase();
  const paymentMethod = textValue(order, 'payment_method', 'paymentMethod').toLowerCase();
  const payment = (value(order, 'payment') as Record<string, unknown> | undefined) ?? {};
  const paymentProvider = textValue(payment, 'provider', 'method').toLowerCase();
  const cod = params.method === 'cod' || paymentMethod === 'cod' || paymentProvider === 'cod';
  const confirmed = ['confirmed', 'processing', 'packed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(status);
  const paid = cod || ['paid', 'captured', 'success', 'succeeded'].includes(textValue(payment, 'status', 'state').toLowerCase());
  const items = Array.isArray(order.items) ? order.items as Record<string, unknown>[] : [];
  const address = (value(order, 'address', 'shipping_address', 'shippingAddress') as Record<string, unknown> | undefined) ?? null;
  const total = numberValue(order, 'grand_total', 'grandTotal', 'total');
  const orderId = textValue(order, 'id', 'order_id', 'orderId');

  if (!confirmed || (!cod && !paid)) {
    return (
      <div className="storefront-page ecomus-success">
        <div className="page storefront-inner success-page">
          <div className="success-hero">
            <div className="success-check">!</div>
            <span className="eyebrow">PAYMENT STATUS</span>
            <h1>{status === 'payment_failed' ? 'Payment was not completed.' : 'We are still confirming your order.'}</h1>
            <p>Your order has not been marked as successfully paid/confirmed yet. Please check My Orders before attempting another payment.</p>
            <strong>{orderNumber}</strong>
            <div className="success-payment-pill"><ShieldIcon /> Status · {status.replaceAll('_', ' ') || 'pending'}</div>
          </div>
          <div className="success-actions">
            <Link className="button" href={orderId ? `/account/orders/${encodeURIComponent(orderId)}` : '/account/orders'}>View My Order</Link>
            <Link className="button button-light" href="/account/orders">My Orders</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="storefront-page ecomus-success">
      <div className="page storefront-inner success-page">
        <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/account/orders">My Orders</Link> / Confirmation</div>
        <div className="success-hero">
          <div className="success-check">{cod ? <CashIcon /> : '✓'}</div>
          <span className="eyebrow">ORDER CONFIRMED</span>
          <h1>{cod ? 'Your COD order is confirmed.' : 'Thank you for shopping with Priyasa.'}</h1>
          <p>{cod ? 'Your order has been received. Please keep the payable amount ready for the delivery partner.' : 'Your payment has been securely verified and your order is confirmed by PRIYASA.'}</p>
          <strong>{orderNumber}</strong>
          <div className="success-payment-pill">{cod ? <><CashIcon /> Cash on Delivery · {money(total)}</> : <><ShieldIcon /> Paid securely · {money(total)}</>}</div>
        </div>

        <div className="success-grid">
          <section className="account-card">
            <h2>Order summary</h2>
            {items.map((item) => (
              <div className="detail-item" key={textValue(item, 'id', 'variant_id', 'variantId')}>
                <div>
                  <strong>{textValue(item, 'product_name', 'productName', 'name')}</strong>
                  <small>{textValue(item, 'color')} · {textValue(item, 'size')} · Qty {numberValue(item, 'quantity')}</small>
                </div>
                <b>{money(numberValue(item, 'unit_price', 'unitPrice') * numberValue(item, 'quantity'))}</b>
              </div>
            ))}
            <div className="summary-lines"><div><span>Total</span><strong>{money(total)}</strong></div></div>
          </section>

          <aside className="account-card">
            <h2>What happens next?</h2>
            <div className="success-next"><span><CheckIcon /></span><p><strong>Order confirmed</strong><small>PRIYASA has confirmed your order and payment status.</small></p></div>
            <div className="success-next"><span>2</span><p><strong>We prepare your order</strong><small>You will receive delivery updates as it moves.</small></p></div>
            <div className="success-next"><span>3</span><p><strong>Delivered to you</strong><small>Track the shipment from My Orders.</small></p></div>
            {address && <div className="order-address"><strong>Delivering to</strong><p>{textValue(address, 'full_name', 'fullName')}<br />{textValue(address, 'line1', 'address_line1')}<br />{textValue(address, 'city')}, {textValue(address, 'state')} - {textValue(address, 'pincode', 'postal_code')}</p></div>}
          </aside>
        </div>

        <div className="success-actions">
          <Link className="button" href={orderId ? `/account/orders/${encodeURIComponent(orderId)}` : '/account/orders'}>View My Order</Link>
          <Link className="button button-light" href={`/track-order?order=${encodeURIComponent(orderNumber)}`}>Track Order</Link>
          <Link className="button button-light" href="/shop">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
