'use client';

import { useEffect, useState } from 'react';

type AddressData = { pincode: string; city: string; state: string; area?: string };
type Result = { serviceable: boolean; etaDays?: string | number | null; shippingCharge?: number | null; codAvailable?: boolean; courier?: string | null; couriers?: unknown[]; message: string };
type Props = { weightGrams?: number; cod?: boolean; compact?: boolean; onAddress?: (address: AddressData) => void };

export function DeliveryPincode({ weightGrams = 500, cod = false, compact = false, onAddress }: Props) {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem('priyasa_delivery_pincode');
    if (saved && /^\d{6}$/.test(saved)) setPincode(saved);
  }, []);

  async function check(value = pincode) {
    const pin = value.replace(/\D/g, '').slice(0, 6);
    setPincode(pin); setError(''); setResult(null);
    if (pin.length !== 6) return;
    setLoading(true);
    try {
      const locationResponse = await fetch(`/api/location/pincode?pincode=${pin}`, { cache: 'no-store' });
      const location = await locationResponse.json().catch(() => ({}));
      if (!locationResponse.ok || !location.found) throw new Error(location.message || location.error || 'Pincode not found.');
      onAddress?.({ pincode: pin, city: location.city || '', state: location.state || '', area: location.area || '' });

      const response = await fetch('/api/shipping/serviceability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: pin, payment_method: cod ? 'cod' : 'razorpay' }),
      });
      const data: Result & { error?: string } = await response.json().catch(() => ({} as any));
      if (!response.ok) throw new Error(data.error || data.message || 'Unable to check delivery');
      setResult(data);
      if (data.serviceable) window.localStorage.setItem('priyasa_delivery_pincode', pin);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to check delivery');
    } finally { setLoading(false); }
  }

  return <div className={`delivery-check ${compact ? 'delivery-check-compact' : ''}`}>
    <div className="delivery-title"><span aria-hidden="true">🚚</span><strong>Check delivery</strong><span>Enter pincode for availability & ETA</span></div>
    <div className="delivery-input-row">
      <input inputMode="numeric" maxLength={6} value={pincode} onChange={(e) => { const value = e.target.value.replace(/\D/g, '').slice(0, 6); setPincode(value); if (value.length === 6) void check(value); }} placeholder="Enter 6-digit pincode" aria-label="Delivery pincode" />
      <button type="button" onClick={() => void check()} disabled={loading || pincode.length !== 6}>{loading ? 'Checking…' : 'Check'}</button>
    </div>
    {result && <div className={result.serviceable ? 'delivery-result success' : 'delivery-result unavailable'} role="status"><strong>{result.serviceable ? '✓ Delivery available' : '× Delivery unavailable'}</strong><span>{result.serviceable ? (result.etaDays ? `Estimated delivery: ${result.etaDays} days` : 'Delivery available to this pincode.') : 'We currently cannot deliver to this pincode.'}</span>{result.serviceable && result.shippingCharge != null && <span>{result.shippingCharge > 0 ? `Delivery from ₹${Number(result.shippingCharge).toLocaleString('en-IN')}` : 'Free delivery available'}</span>}{result.serviceable && result.codAvailable && <span>✓ Cash on Delivery available</span>}</div>}
    {error && <div className="delivery-error" role="alert">{error}</div>}
  </div>;
}
