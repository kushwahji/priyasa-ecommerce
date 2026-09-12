'use client';
import { useEffect, useState } from 'react';
import { CheckIcon } from '@/components/StorefrontIcons';
type Props = { variantId: string; productId: string; name: string; price: number; image?: string };
type Item = Props & { quantity: number };
const KEY = 'priyasa_cart';
function localCart(): Item[] { try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
export function AddToCart({ variantId, productId, name, price, image }: Props) {
  const [busy, setBusy] = useState(false), [done, setDone] = useState(false), [message, setMessage] = useState('');
  useEffect(() => { if (!message) return; const t = window.setTimeout(() => setMessage(''), 2600); return () => window.clearTimeout(t); }, [message]);
  async function add() {
    if (!variantId) return; setBusy(true); setMessage('');
    try {
      const currentResponse = await fetch('/api/cart', { cache: 'no-store' });
      const currentData = await currentResponse.json().catch(() => ({}));
      const server: Item[] = Array.isArray(currentData?.data?.items) ? currentData.data.items : [];
      const base = currentResponse.ok ? server : localCart();
      const index = base.findIndex((entry: { variantId: string }) => entry.variantId === variantId);
      const merged = [...base];
      if (index >= 0) merged[index] = { ...merged[index], quantity: Math.min(20, Number(merged[index].quantity || 0) + 1) };
      else merged.push({ variantId, productId, name, price, image, quantity: 1 });
      const save = await fetch('/api/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: merged.map(item => ({ variantId: item.variantId, quantity: item.quantity })) }) });
      if (!save.ok) { const error = await save.json().catch(() => ({})); throw new Error(error.error || 'Unable to update your bag.'); }
      localStorage.setItem(KEY, JSON.stringify(merged)); window.dispatchEvent(new Event('priyasa-cart-updated')); setDone(true); setMessage(index >= 0 ? `${name} quantity updated in your bag.` : `${name} added to your bag.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'We could not update your bag. Please try again.'); }
    finally { setBusy(false); }
  }
  return <><button className="button" onClick={add} disabled={busy || !variantId} aria-label={`Add ${name} to bag`}>{!variantId ? 'Unavailable' : done ? 'Added' : busy ? <><span className="button-spinner" />Adding…</> : 'Add'}</button>{message && <div className="storefront-toast is-visible" role="status" aria-live="polite"><CheckIcon />{message}</div>}</>;
}
