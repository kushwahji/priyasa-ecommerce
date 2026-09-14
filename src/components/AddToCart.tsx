'use client';
import { useEffect, useState } from 'react';
import { CheckIcon } from '@/components/StorefrontIcons';
type Props = { variantId: string; productId: string; name: string; price: number; image?: string };
type Item = Props & { quantity: number };
const KEY = 'priyasa_cart';
function localCart(): Item[] { try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
function saveLocal(items: Item[]) { localStorage.setItem(KEY, JSON.stringify(items)); window.dispatchEvent(new Event('priyasa-cart-updated')); }
function serverErrorMessage(value: unknown) { if (value instanceof Error && value.message) return value.message; if (typeof value === 'string' && value.trim()) return value.trim(); return ''; }
export function AddToCart({ variantId, productId, name, price, image }: Props) {
  const [busy, setBusy] = useState(false), [done, setDone] = useState(false), [message, setMessage] = useState('');
  useEffect(() => { if (!message) return; const t = window.setTimeout(() => setMessage(''), 2600); return () => window.clearTimeout(t); }, [message]);
  async function add() {
    if (!variantId) return; setBusy(true); setMessage('');
    const local = localCart();
    try {
      let base = local;
      let serverAvailable = false;
      try {
        const currentResponse = await fetch('/api/cart', { cache: 'no-store', credentials: 'same-origin' });
        const currentData = await currentResponse.json().catch(() => ({}));
        if (currentResponse.ok && Array.isArray(currentData?.data?.items)) {
          base = currentData.data.items;
          serverAvailable = true;
        }
      } catch { /* Keep guest/local cart usable when the deployment blocks the cart route. */ }
      const index = base.findIndex((entry: { variantId: string }) => String(entry.variantId) === String(variantId));
      const merged = [...base];
      if (index >= 0) merged[index] = { ...merged[index], quantity: Math.min(20, Number(merged[index].quantity || 0) + 1) };
      else merged.push({ variantId, productId, name, price, image, quantity: 1 });
      if (serverAvailable) {
        try {
          const save = await fetch('/api/cart', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: merged.map(item => ({ variantId: item.variantId, quantity: item.quantity })) }) });
          if (!save.ok) throw new Error((await save.json().catch(() => ({})))?.error || 'Unable to update your bag.');
        } catch (error) {
          // Do not lose a customer's cart because a server-side cart endpoint is temporarily unavailable.
          saveLocal(merged);
          setDone(true);
          setMessage(`${name} added to your bag.`);
          return;
        }
      }
      saveLocal(merged);
      setDone(true);
      setMessage(index >= 0 ? `${name} quantity updated in your bag.` : `${name} added to your bag.`);
    } catch (error) {
      const detail = serverErrorMessage(error);
      setMessage(detail && !/cross-origin|cors/i.test(detail) ? detail : 'We could not update your bag. Please try again.');
    } finally { setBusy(false); }
  }
  return <><button className="button" onClick={add} disabled={busy || !variantId} aria-label={`Add ${name} to bag`}>{!variantId ? 'Unavailable' : done ? 'Added' : busy ? <><span className="button-spinner" />Adding…</> : 'Add'}</button>{message && <div className="storefront-toast is-visible" role="status" aria-live="polite"><CheckIcon />{message}</div>}</>;
}
