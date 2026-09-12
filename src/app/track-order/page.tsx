import Link from 'next/link';
import { cookies } from 'next/headers';
import { priyasaApi } from '@/lib/priyasa-api';

const label = (value: unknown) => String(value || 'UNKNOWN').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

export default async function Track({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const jar = await cookies();
  const token = jar.get('priyasa_access_token')?.value;
  let found: any = null;

  if (token && order) {
    const { response, body } = await priyasaApi('/api/v1/storefront/orders', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const rows = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : Array.isArray(body?.orders) ? body.orders : [];
      found = rows.find((item: any) => String(item?.orderNumber ?? item?.order_number ?? item?.number ?? '') === order) ?? null;
    }
  }

  const shipment = found?.shipment ?? found?.shipments?.[0] ?? null;
  const status = found?.status ?? found?.orderStatus;

  return <div className="storefront-page"><div className="page storefront-inner"><div className="breadcrumbs"><Link href="/">Home</Link><span> / </span><Link href="/account/orders">My Orders</Link><span> / </span> Track Order</div><div className="track-page-card"><span className="eyebrow">ORDER TRACKING</span><h1>Track Your Order</h1><p>Enter an order number from My Orders to see the latest status available from Priyasa Core.</p><form className="track-form" method="get"><input className="input" name="order" defaultValue={order || ''} placeholder="PRI-XXXXXXXX"/><button className="button" type="submit">Track Order</button></form>{!token && <div className="checkout-status">Please sign in to track an order.</div>}{token && order && !found && <div className="checkout-status">Order not found for this signed-in customer.</div>}{found && <div className="tracking-result"><div className="tracking-summary"><strong>{found.orderNumber ?? found.order_number ?? found.number ?? order}</strong><span className="order-status">{label(status)}</span></div>{shipment && <div className="shipment-box"><strong>{shipment.carrier ?? shipment.provider ?? 'Shipment'}</strong><p>{shipment.trackingNumber ?? shipment.tracking_number ?? 'Tracking number will appear after dispatch.'}</p>{(shipment.trackingUrl ?? shipment.tracking_url) && <a href={shipment.trackingUrl ?? shipment.tracking_url} target="_blank" rel="noreferrer">Track carrier shipment →</a>}</div>}</div>}</div></div></div>;
}
