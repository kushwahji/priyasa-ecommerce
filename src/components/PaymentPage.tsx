'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { money } from '@/lib/catalog';

declare global { interface Window { Razorpay?: any } }

async function loadRazorpay() {
  if (window.Razorpay) return true;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay-checkout]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Unable to load payment gateway')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load payment gateway'));
    document.body.appendChild(script);
  });
  return !!window.Razorpay;
}

export function PaymentPage({ orderId, orderNumber, total }: { orderId: string; orderNumber: string; total: number }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function pay() {
    if (busy) return;
    setBusy(true);
    setMessage('Preparing secure payment…');
    try {
      const idempotencyKey = crypto.randomUUID();
      const r = await fetch('/api/payments/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ orderId }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Unable to start payment');
      await loadRazorpay();
      if (!window.Razorpay) throw new Error('Payment gateway unavailable');

      const razorpay = new window.Razorpay({
        key: d.keyId,
        amount: d.amount,
        currency: d.currency || 'INR',
        name: 'PRIYASA',
        description: `Order ${orderNumber}`,
        order_id: d.razorpayOrderId,
        prefill: {},
        theme: { color: '#a81132' },
        handler: async (response: any) => {
          try {
            setMessage('Verifying payment securely…');
            const vr = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
              body: JSON.stringify({
                orderId,
                razorpay_order_id: response?.razorpay_order_id,
                razorpay_payment_id: response?.razorpay_payment_id,
                razorpay_signature: response?.razorpay_signature,
              }),
            });
            const vd = await vr.json().catch(() => ({}));
            if (!vr.ok) throw new Error(vd.error || 'Payment verification failed');
            router.replace(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
          } catch (e) {
            setBusy(false);
            setMessage(e instanceof Error ? e.message : 'Payment verification failed. Please retry.');
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setMessage('Payment was not completed. Your order remains available in My Orders.');
          },
        },
      });
      razorpay.on('payment.failed', (event: any) => {
        setBusy(false);
        setMessage(event?.error?.description || 'Payment failed. Your order remains available in My Orders for retry.');
      });
      razorpay.open();
    } catch (e) {
      setBusy(false);
      setMessage(e instanceof Error ? e.message : 'Payment failed');
    }
  }

  return (
    <div className="payment-page-card">
      <div className="payment-page-head">
        <div><span className="eyebrow">PRIYASA SECURE CHECKOUT</span><h1>Complete your payment</h1><p>Order <strong>{orderNumber}</strong></p></div>
        <span className="muted">Encrypted & verified</span>
      </div>
      <div className="payment-page-amount"><span>Amount payable</span><strong>{money(total)}</strong></div>
      <div className="payment-method-single"><h3>Online payment</h3><p>UPI · Credit/Debit Cards · Net Banking · supported payment methods</p></div>
      <button className="button dark-button full-button" disabled={busy} onClick={pay}>{busy ? 'Opening secure payment…' : `Pay ${money(total)} securely`}</button>
      <div className="checkout-assurance">✓ Razorpay-secured checkout<br/>✓ Payment details are handled by the gateway<br/>✓ Priyasa verifies the signature before confirming your order<br/>✓ If payment is interrupted, your order remains available for retry</div>
      {message && <div className="checkout-status" role="status">{message}</div>}
    </div>
  );
}
