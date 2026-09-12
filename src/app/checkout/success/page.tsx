import Link from 'next/link';
import { CashIcon, CheckIcon, ShieldIcon } from '@/components/StorefrontIcons';

export default async function CheckoutSuccess({ searchParams }: { searchParams: Promise<{ order?: string; method?: string }> }) {
  const params = await searchParams;
  if (!params.order) return null;
  const cod = params.method === 'cod';

  return (
    <div className="storefront-page ecomus-success">
      <div className="page storefront-inner success-page">
        <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/account/orders">My Orders</Link> / Confirmation</div>
        <div className="success-hero">
          <div className="success-check">{cod ? <CashIcon /> : '✓'}</div>
          <span className="eyebrow">ORDER CONFIRMED</span>
          <h1>{cod ? 'Your COD order is confirmed.' : 'Thank you for shopping with Priyasa.'}</h1>
          <p>{cod ? 'Your order has been received. Please keep the payable amount ready for the delivery partner.' : 'Your payment has been securely verified and your order is now confirmed.'}</p>
          <strong>{params.order}</strong>
          <div className="success-payment-pill">{cod ? <><CashIcon /> Cash on Delivery</> : <><ShieldIcon /> Paid securely</>}</div>
        </div>
        <div className="success-grid">
          <section className="account-card">
            <h2>Order received</h2>
            <div className="success-next"><span><CheckIcon /></span><p><strong>Order confirmation</strong><small>Your order is recorded by Priyasa Core and is ready for processing.</small></p></div>
            <div className="success-next"><span>2</span><p><strong>We prepare your order</strong><small>You will receive delivery updates as it moves.</small></p></div>
            <div className="success-next"><span>3</span><p><strong>Delivered to you</strong><small>Track the shipment from My Orders when tracking is available.</small></p></div>
          </section>
          <aside className="account-card">
            <h2>What happens next?</h2>
            <p>Your order, payment, inventory and shipment state are managed by the Priyasa Core API.</p>
          </aside>
        </div>
        <div className="success-actions">
          <Link className="button" href="/account/orders">View My Orders</Link>
          <Link className="button button-light" href={`/track-order?order=${encodeURIComponent(params.order)}`}>Track Order</Link>
          <Link className="button button-light" href="/shop">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
