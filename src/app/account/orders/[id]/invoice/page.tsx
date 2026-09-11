'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const money = (value: unknown) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const pick = (object: any, ...keys: string[]) => {
  for (const key of keys) {
    const value = key.split('.').reduce((current: any, part) => current?.[part], object);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return '';
};

export default function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [invoice, setInvoice] = useState<any>();
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const { id } = await params;
        const response = await fetch(
          `/api/customer/orders/${encodeURIComponent(id)}/invoice`,
          { cache: 'no-store' },
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || data.message || 'Unable to load invoice');
        }
        setInvoice(data.data ?? data);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Unable to load invoice');
      }
    })();
  }, [params]);

  if (error) {
    return (
      <div className="account-shell">
        <div className="account-card">
          <h2>{error}</h2>
          <Link className="button" href="/account/orders">
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="account-shell">
        <div className="account-orders-loading">Preparing invoice…</div>
      </div>
    );
  }

  const items = Array.isArray(invoice.items)
    ? invoice.items
    : Array.isArray(invoice.order?.items)
      ? invoice.order.items
      : [];
  const orderId = pick(invoice, 'orderId', 'order_id', 'order.id');
  const number = pick(invoice, 'invoiceNumber', 'invoice_number', 'number') || 'Invoice';
  const orderNumber = pick(invoice, 'orderNumber', 'order_number', 'order.orderNumber', 'order.order_number');
  const subtotal = pick(invoice, 'subtotal', 'order.subtotal');
  const discount = pick(invoice, 'discount', 'order.discount');
  const shipping = pick(invoice, 'shipping', 'shippingAmount', 'order.shipping');
  const tax = pick(invoice, 'tax', 'taxAmount', 'order.tax');
  const total = pick(invoice, 'total', 'grandTotal', 'order.total');
  const invoiceDate = pick(invoice, 'invoiceDate', 'invoice_date', 'date');
  const buyer = invoice.buyer || invoice.customer || invoice.order?.customer || {};
  const seller = invoice.seller || {};
  const address = invoice.address || invoice.order?.address || {};

  return (
    <div className="account-shell invoice-page">
      <div className="invoice-toolbar">
        <Link
          className="button button-light"
          href={orderId ? `/account/orders/${encodeURIComponent(orderId)}` : '/account/orders'}
        >
          ← Order
        </Link>
        <button className="button dark-button" onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </div>

      <article className="account-card invoice-sheet">
        <header className="invoice-header">
          <div>
            <span className="eyebrow">PRIYASA</span>
            <h1>Tax Invoice</h1>
            <p>
              {number}
              {orderNumber ? ` · Order ${orderNumber}` : ''}
            </p>
          </div>
          <div className="invoice-meta">
            <strong>
              {invoiceDate
                ? new Date(invoiceDate).toLocaleDateString('en-IN')
                : new Date().toLocaleDateString('en-IN')}
            </strong>
            <span>India</span>
          </div>
        </header>

        <div className="invoice-parties">
          <div>
            <small>Billed to</small>
            <strong>{pick(buyer, 'name', 'fullName', 'full_name') || pick(address, 'fullName', 'recipient_name') || 'Customer'}</strong>
            <span>{pick(buyer, 'phone', 'mobile')}</span>
            <span>
              {pick(address, 'line1', 'addressLine1')} {pick(address, 'line2', 'addressLine2')}
            </span>
            <span>
              {pick(address, 'city')}, {pick(address, 'state')} {pick(address, 'pincode', 'postal_code')}
            </span>
            <span>GSTIN: {pick(buyer, 'gstin', 'gstIn') || '—'}</span>
          </div>
          <div>
            <small>Seller</small>
            <strong>{pick(seller, 'name', 'legalName') || 'PRIYASA'}</strong>
            <span>{pick(seller, 'address', 'line1') || '—'}</span>
            <span>GSTIN: {pick(seller, 'gstin', 'gstIn') || '—'}</span>
          </div>
        </div>

        <div className="invoice-table">
          <div className="invoice-row invoice-head">
            <span>Description</span>
            <span>Qty</span>
            <span>Amount</span>
          </div>
          {items.length ? (
            items.map((item: any, index: number) => (
              <div className="invoice-row" key={item.id || index}>
                <span>{item.productName || item.name || item.title || 'Product'}</span>
                <span>{item.quantity || 1}</span>
                <span>
                  {money((item.unitPrice ?? item.unit_price ?? item.price ?? 0) * (item.quantity || 1))}
                </span>
              </div>
            ))
          ) : (
            <div className="invoice-row">
              <span>Order {orderNumber || ''}</span>
              <span>1</span>
              <span>{money(subtotal || total)}</span>
            </div>
          )}
        </div>

        <div className="invoice-totals">
          <div>
            <span>Subtotal</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <div>
            <span>Discount</span>
            <strong>-{money(discount)}</strong>
          </div>
          <div>
            <span>Shipping</span>
            <strong>{Number(shipping || 0) ? money(shipping) : 'Free'}</strong>
          </div>
          <div>
            <span>GST / Tax</span>
            <strong>{money(tax)}</strong>
          </div>
          <div className="invoice-grand">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
        </div>

        <footer className="invoice-footer">
          This is a system-generated invoice. Thank you for shopping with PRIYASA.
        </footer>
      </article>
    </div>
  );
}
