'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { money } from '@/lib/catalog';
import { DeliveryPincode } from '@/components/DeliveryPincode';
import { AuthOtpModal } from '@/components/AuthOtpModal';
import { CashIcon, CheckIcon, CreditCardIcon, ShieldIcon, UpiIcon, WalletIcon } from '@/components/StorefrontIcons';

declare global { interface Window { Razorpay?: any } }

type PaymentMethod = 'razorpay' | 'cod' | 'wallet';

async function loadRazorpay() {
  if (window.Razorpay) return true;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load payment gateway. Please try again.'));
    document.body.appendChild(script);
  });
  return !!window.Razorpay;
}

export default function Checkout() {
  const [form, setForm] = useState({ fullName: '', phone: '', line1: '', city: '', state: '', pincode: '', coupon: '' });
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    try { setItems(JSON.parse(window.localStorage.getItem('priyasa_cart') || '[]')); } catch { setItems([]); }
    fetch('/api/customer/session', { cache: 'no-store' }).then((response) => response.json()).then(async (data) => {
      setAuthenticated(!!data.authenticated);
      if (!data.user) return;
      setForm((current) => ({ ...current, phone: data.user.phone || current.phone, fullName: data.user.name || current.fullName }));
      const addressData = await fetch('/api/customer/addresses', { cache: 'no-store' }).then((response) => response.json()).catch(() => ({}));
      const list = addressData.data || [];
      setAddresses(list);
      const preferred = list.find((address: any) => address.isDefault) || list[0];
      if (preferred) selectAddress(preferred);
      const wallet = await fetch('/api/account/wallet', { cache: 'no-store' }).then((response) => response.json()).catch(() => ({}));
      setWalletBalance(Number(wallet.wallet?.balance || 0));
    }).catch(() => setAuthenticated(false));
  }, []);

  const clientSubtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0), [items]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (!items.length) { setQuote(null); return; }
      const response = await fetch('/api/checkout/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })), coupon: form.coupon || undefined }) });
      const data = await response.json().catch(() => ({}));
      if (cancelled) return;
      if (response.ok) setQuote(data); else { setQuote(null); setStatus(data.error || 'Unable to calculate your order.'); }
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [items, form.coupon]);

  function selectAddress(address: any) {
    setSelectedAddressId(address.id);
    setForm((current) => ({ ...current, fullName: address.fullName, phone: address.phone, line1: address.line1, city: address.city, state: address.state, pincode: address.pincode }));
  }

  function update(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field !== 'phone') setSelectedAddressId('');
  }

  function fillPincode(address: { pincode: string; city: string; state: string; area?: string }) {
    setForm((current) => ({ ...current, pincode: address.pincode, city: address.city || current.city, state: address.state || current.state, line1: !current.line1 && address.area ? address.area : current.line1 }));
    setSelectedAddressId('');
  }

  const displayTotal = quote?.total ?? clientSubtotal;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!authenticated) { setLoginOpen(true); return; }
    if (!items.length) { setStatus('Your bag is empty.'); return; }
    if (!form.fullName.trim() || !form.line1.trim() || !form.city.trim() || !form.state.trim() || !/^\d{6}$/.test(form.pincode)) { setStatus('Please complete your delivery address.'); return; }
    if (!/^\+?\d{10,15}$/.test(form.phone)) { setStatus('Enter a valid mobile number.'); return; }
    if (!quote) { setStatus('Please wait while we validate your order.'); return; }
    if (paymentMethod === 'wallet' && walletBalance < Number(displayTotal)) { setStatus('Your Priyasa Wallet balance is insufficient.'); return; }

    setBusy(true); setStatus('Rechecking price, stock and offer…');
    try {
      const quoteResponse = await fetch('/api/checkout/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })), coupon: form.coupon || undefined }) });
      const freshQuote = await quoteResponse.json().catch(() => ({}));
      if (!quoteResponse.ok) throw new Error(freshQuote.error || 'Your bag changed. Please refresh.');
      setQuote(freshQuote);
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ ...form, addressId: selectedAddressId || undefined, items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })), paymentMethod }) });
      const order = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(order.error || 'Unable to create order.');

      if (paymentMethod === 'cod' || paymentMethod === 'wallet') {
        window.localStorage.removeItem('priyasa_cart');
        window.location.href = `/checkout/success?order=${encodeURIComponent(order.orderNumber)}&method=${paymentMethod}`;
        return;
      }

      setStatus('Opening secure payment…');
      const paymentResponse = await fetch('/api/payments/razorpay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.orderId }) });
      const payment = await paymentResponse.json().catch(() => ({}));
      if (!paymentResponse.ok) throw new Error(payment.error || 'Unable to start payment.');
      await loadRazorpay();
      if (!window.Razorpay) throw new Error('Payment gateway unavailable.');

      const razorpay = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        name: 'PRIYASA',
        description: `Order ${payment.orderNumber}`,
        order_id: payment.razorpayOrderId,
        theme: { color: '#a81132' },
        handler: async (gatewayResponse: any) => {
          try {
            setStatus('Verifying payment securely…');
            const verification = await fetch('/api/payments/razorpay/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.orderId, ...gatewayResponse }) });
            const result = await verification.json().catch(() => ({}));
            if (!verification.ok) throw new Error(result.error || 'Payment verification failed.');
            window.localStorage.removeItem('priyasa_cart');
            window.location.href = `/checkout/success?order=${encodeURIComponent(order.orderNumber)}`;
          } catch (error) { setBusy(false); setStatus(error instanceof Error ? error.message : 'Payment verification failed. Please contact support.'); }
        },
        modal: { ondismiss: () => { setBusy(false); setStatus('Payment was not completed. Your order remains available in My Orders so you can retry.'); } },
      });
      razorpay.on('payment.failed', (failure: any) => { setBusy(false); setStatus(failure?.error?.description || 'Payment failed. Please retry.'); });
      razorpay.open();
    } catch (error) { setBusy(false); setStatus(error instanceof Error ? error.message : 'Checkout failed.'); }
  }

  if (authenticated === false && !loginOpen) return <div className="storefront-page"><div className="page storefront-inner checkout-page"><div className="checkout-login-gate"><span className="eyebrow">PRIYASA CHECKOUT</span><h1>Sign in to continue</h1><p>Login with your mobile number to securely place your order and receive delivery updates.</p><button className="button dark-button" onClick={() => setLoginOpen(true)}>Continue with Mobile</button><Link className="button button-light" href="/cart">Back to Bag</Link></div></div><AuthOtpModal open={loginOpen} onClose={() => setLoginOpen(false)} /></div>;

  const paymentOptions = [
    { id: 'razorpay' as const, label: 'Online payment', caption: 'UPI · Cards · Net Banking · Wallets', icon: <UpiIcon /> },
    { id: 'wallet' as const, label: 'Priyasa Wallet', caption: `Balance · ${money(walletBalance)}`, icon: <WalletIcon /> },
    { id: 'cod' as const, label: 'Cash on Delivery', caption: 'Pay when your order arrives', icon: <CashIcon /> },
  ];

  return <div className="storefront-page"><div className="page storefront-inner checkout-page"><div className="breadcrumbs"><Link href="/cart">Bag</Link> / Checkout</div><div className="checkout-steps"><div className="active"><b>1</b><span>Address</span></div><i /><div className={step >= 2 ? 'active' : ''}><b>2</b><span>Payment</span></div><i /><div><b>3</b><span>Confirmation</span></div></div><div className="checkout-layout"><form className="checkout-form" onSubmit={submit}><section className="checkout-card"><div className="checkout-card-head"><div><span className="eyebrow dark">01 · DELIVERY</span><h1>Shipping address</h1></div><span><ShieldIcon /> Secure checkout</span></div>{addresses.length > 0 && <div className="saved-addresses"><div className="saved-addresses-head"><strong>Saved addresses</strong><Link href="/account/addresses">Manage</Link></div>{addresses.map((address) => <button type="button" key={address.id} className={`saved-address ${selectedAddressId === address.id ? 'active' : ''}`} onClick={() => selectAddress(address)}><span>{address.isDefault ? 'Default' : 'Address'}</span><strong>{address.fullName}</strong><small>{address.line1}, {address.city}, {address.state} - {address.pincode}</small></button>)}</div>}<div className="form-grid">{[['fullName','Full Name'],['phone','Phone Number'],['line1','Address'],['city','City'],['state','State'],['pincode','Pincode']].map(([field,label]) => <label className={field === 'line1' ? 'full-span' : ''} key={field}>{label}<input className="input" required inputMode={field === 'pincode' || field === 'phone' ? 'numeric' : undefined} maxLength={field === 'pincode' ? 6 : 120} value={(form as any)[field]} onChange={(event) => update(field, field === 'pincode' ? event.target.value.replace(/\D/g, '').slice(0, 6) : event.target.value)} /></label>)}<label className="full-span">Coupon code<input className="input" placeholder="Optional offer code" value={form.coupon} onChange={(event) => update('coupon', event.target.value.toUpperCase())} /></label></div><DeliveryPincode weightGrams={Math.max(500, items.reduce((sum, item) => sum + Number(item.quantity || 0) * 500, 0))} cod={paymentMethod === 'cod'} onAddress={fillPincode} /><button type="button" className="button dark-button full-button" onClick={() => setStep(2)} disabled={!form.fullName.trim() || !/^\+?\d{10,15}$/.test(form.phone) || !form.line1.trim() || !form.city.trim() || !form.state.trim() || !/^\d{6}$/.test(form.pincode) || !items.length}>Continue to payment</button></section><section className={`checkout-card payment-preview ${step < 2 ? 'disabled' : ''}`}><div className="checkout-card-head"><div><span className="eyebrow dark">02 · PAYMENT</span><h2>Choose your payment</h2><p className="payment-subtitle">Select a secure payment method for this order.</p></div><span className="payment-secure"><ShieldIcon /> Secure</span></div><div className="payment-method-grid payment-method-grid-premium">{paymentOptions.map((option) => <button type="button" key={option.id} className={`payment-method payment-method-select ${paymentMethod === option.id ? 'active' : ''}`} onClick={() => setPaymentMethod(option.id)} disabled={step < 2}><span className="payment-method-icon">{option.icon}</span><span className="payment-method-copy"><b>{option.label}</b><small>{option.caption}</small></span><span className="payment-radio">{paymentMethod === option.id ? <CheckIcon /> : null}</span></button>)}</div>{paymentMethod === 'wallet' ? <div className="wallet-checkout-note"><WalletIcon /><div><strong>Priyasa Wallet</strong><p>Your balance: <b>{money(walletBalance)}</b>. {walletBalance >= Number(displayTotal) ? 'Ready to pay this order instantly.' : 'Choose another method or add eligible wallet credit.'}</p></div></div> : paymentMethod === 'razorpay' ? <div className="payment-method-details"><span><UpiIcon /> UPI</span><span><CreditCardIcon /> Cards</span><span><WalletIcon /> Wallets</span><small>You complete payment in Razorpay. Priyasa does not receive your card or UPI credentials.</small></div> : <div className="cod-details"><CashIcon /><div><strong>Cash on Delivery selected</strong><p>Pay the delivery partner when your parcel arrives. COD availability and order limits are checked server-side.</p></div></div>}{step >= 2 && <button className="button dark-button full-button payment-submit" disabled={busy || !quote || (paymentMethod === 'wallet' && walletBalance < Number(displayTotal))} type="submit">{busy ? 'Processing…' : paymentMethod === 'cod' ? `Place COD order · ${money(displayTotal)}` : paymentMethod === 'wallet' ? `Pay from Wallet · ${money(displayTotal)}` : `Pay securely · ${money(displayTotal)}`}</button>}</section>{status && <div className="checkout-status" role="status">{status}</div>}</form><aside className="checkout-summary"><span className="eyebrow dark">YOUR BAG</span><h2>Order summary</h2>{items.map((item) => <div className="checkout-item" key={item.variantId}><div className="checkout-item-image">{item.image && <img src={item.image} alt="" />}</div><span>{item.name}<small>Qty {item.quantity}</small></span><strong>{money(Number(item.price || 0) * Number(item.quantity || 0))}</strong></div>)}<div className="summary-lines"><div><span>Subtotal</span><strong>{money(quote?.subtotal ?? clientSubtotal)}</strong></div><div><span>Discount</span><strong className="green">-{money(quote?.discount ?? 0)}</strong></div><div><span>Shipping</span><strong>{quote?.shipping === 0 ? 'Free' : money(quote?.shipping ?? 99)}</strong></div><hr /><div className="cart-total"><span>Total</span><strong>{money(displayTotal)}</strong></div></div><div className="checkout-assurance"><CheckIcon /> Server validates price and stock<br /><CheckIcon /> Coupon and shipping rules rechecked<br /><CheckIcon /> Inventory reserved during checkout<br /><CheckIcon /> Payment/order status verified server-side</div></aside></div></div></div><AuthOtpModal open={loginOpen} onClose={() => setLoginOpen(false)} /></div>;
}
