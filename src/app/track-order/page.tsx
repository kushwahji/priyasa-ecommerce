import Link from 'next/link';
import { cookies } from 'next/headers';
import { priyasaApi } from '@/lib/priyasa-api';

type OrderRecord = {
  orderNumber?: string;
  order_number?: string;
  number?: string;
  status?: string;
  orderStatus?: string;
  shipment?: Record<string, unknown> | null;
  shipments?: Record<string, unknown>[];
};

type OrdersResponse = OrderRecord[] | { data?: OrderRecord[]; orders?: OrderRecord[] } | null;

const label = (value: unknown) => String(value || 'UNKNOWN').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

function orderRows(body: unknown): OrderRecord[] {
  if (Array.isArray(body)) return body as OrderRecord[];
  if (!body || typeof body !== 'object') return [];
  const payload = body as { data?: unknown; orders?: unknown };
  if (Array.isArray(payload.data)) return payload.data as OrderRecord[];
  if (Array.isArray(payload.orders)) return payload.orders as OrderRecord[];
  return [];
}

export default async function Track({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const jar = await cookies();
  const token = jar.get('priyasa_access_token')?.value;
  let found: OrderRecord | null = null;

  if (token && order) {
    const { response, body } = await priyasaApi<OrdersResponse>('/api/v1/storefront/orders', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      found = orderRows(body).find((item) => String(item?.orderNumber ?? item?.order_number ?? item?.number ?? '') === order) ?? null;
    }
  }

  const shipment = found?.shipment ?? found?.shipments?.[0] ?? null;
  const status = found?.status ?? found?.orderStatus;
  const carrier = shipment?.carrier ?? shipment?.provider;
  const trackingNumber = shipment?.trackingNumber ?? shipment?.tracking_number;
  const trackingUrl = shipment?.trackingUrl ?? shipment?.tracking_url;

  return <div className="storefront-page"><div className="page storefront-inner"><div className="breadcrumbs"><Link href="/">Home</Link><span> / </span><Link href="/account/orders">My Orders</Link><span> / </span> Track Order</div><div className="track-page-card"><span className="eyebrow">ORDER TRACKING</span><h1>Track Your Order</h1><p>Enter an order number from My Orders to see the latest status available from Priyasa Core.</p><form className="track-form" method="get"><input className="input" name="order" defaultValue={order || ''} placeholder="PRI-XXXXXXXX"/><button className="button" type="submit">Track Order</button></form>{!token && <div className="checkout-status">Please sign in to track an order.</div>}{token && order && !found && <div className="checkout-status">Order not found for this signed-in customer.</div>}{found && <div className="tracking-result"><div className="tracking-summary"><strong>{found.orderNumber ?? found.order_number ?? found.number ?? order}</strong><span className="order-status">{label(status)}</span></div>{shipment && <div className="shipment-box"><strong>{String(carrier || 'Shipment')}</strong><p>{String(trackingNumber || 'Tracking number will appear after dispatch.')}</p>{trackingUrl && <a href={String(trackingUrl)} target="_blank" rel="noreferrer">Track carrier shipment →</a>}</div>}</div>}</div></div></div>;
}
