'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon } from '@/components/StorefrontIcons';

type Variant = { id: string; color?: string; size?: string; price?: number; stock?: number; sku?: string; imageUrls?: string[] };
type Product = { id: string; name: string; slug?: string; price: number; colors: string[]; sizes: string[]; image?: string; variantId?: string; variants?: Variant[] };
const WHATSAPP = '918104132334';
const CART_KEY = 'priyasa_cart';
type CartItem = { variantId: string; productId: string; name: string; price: number; quantity: number; image?: string; color?: string; size?: string };
function localCart(): CartItem[] { try { const value = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
async function addCartItem(item: CartItem) {
  const response = await fetch('/api/cart', { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  const server: CartItem[] = Array.isArray(data?.data?.items) ? data.data.items : [];
  if (!(response.ok && data?.data && Array.isArray(data.data.items))) {
    const local = localCart(); const index = local.findIndex((entry) => String(entry.variantId) === String(item.variantId)); const next = [...local];
    if (index >= 0) next[index] = { ...next[index], ...item, quantity: Math.min(20, Number(next[index].quantity || 0) + item.quantity) }; else next.push(item);
    localStorage.setItem(CART_KEY, JSON.stringify(next)); window.dispatchEvent(new Event('priyasa-cart-updated')); return;
  }
  const index = server.findIndex((entry) => String(entry.variantId) === String(item.variantId)); const next = [...server];
  if (index >= 0) next[index] = { ...next[index], ...item, quantity: Math.min(20, Number(next[index].quantity || 0) + item.quantity) }; else next.push(item);
  const save = await fetch('/api/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: next.map((entry) => ({ variantId: String(entry.variantId), quantity: Number(entry.quantity) })) }) });
  const saveData = await save.json().catch(() => ({})); if (!save.ok) throw new Error(saveData.error || 'Unable to update your bag.');
  localStorage.setItem(CART_KEY, JSON.stringify(next)); window.dispatchEvent(new Event('priyasa-cart-updated'));
}

export function ProductPurchase({ product }: { product: Product }) {
  const router = useRouter();
  const variants = product.variants || [];
  const purchasableVariants = variants.filter((item) => Number(item.stock || 0) > 0);
  const firstAvailable = purchasableVariants[0] || variants[0];
  const colors = [...new Set((product.colors.length ? product.colors : variants.map((item) => item.color).filter(Boolean)) as string[])];
  const sizes = [...new Set((product.sizes.length ? product.sizes : variants.map((item) => item.size).filter(Boolean)) as string[])];
  const [color, setColor] = useState(firstAvailable?.color || colors[0] || '');
  const [size, setSize] = useState(firstAvailable?.size || sizes[0] || '');
  const [qty, setQty] = useState(1);
  const [liked, setLiked] = useState(false);
  const [auth, setAuth] = useState(false);
  const [message, setMessage] = useState('');
  const [busyAction, setBusyAction] = useState<'cart' | 'buy' | null>(null);
  const variant = useMemo(() => {
    if (!variants.length) return null;
    return variants.find((item) => item.color === color && item.size === size && Number(item.stock || 0) > 0)
      || variants.find((item) => (!color || item.color === color) && (!size || item.size === size) && Number(item.stock || 0) > 0)
      || variants.find((item) => Number(item.stock || 0) > 0) || null;
  }, [variants, color, size]);
  const price = variant?.price ?? product.price;
  const maxQty = Math.max(1, Math.min(20, Number(variant?.stock || 20)));
  const unavailable = variants.length > 0 && !variant;
  const busy = busyAction !== null;

  useEffect(() => {
    fetch('/api/customer/wishlist', { cache: 'no-store' }).then((response) => response.json()).then((data) => {
      if (data.authenticated) { setAuth(true); setLiked((data.data || []).some((item: { id: string }) => item.id === product.id)); }
      else { try { setLiked(JSON.parse(localStorage.getItem('priyasa_wishlist') || '[]').includes(product.id)); } catch {} }
    }).catch(() => { try { setLiked(JSON.parse(localStorage.getItem('priyasa_wishlist') || '[]').includes(product.id)); } catch {} });
  }, [product.id]);
  useEffect(() => { if (!message) return; const timer = window.setTimeout(() => setMessage(''), 3200); return () => window.clearTimeout(timer); }, [message]);

  function cartItem(): CartItem | null {
    if (variants.length && !variant) return null;
    const variantId = variant?.id || product.variantId || product.id;
    return { variantId, productId: product.id, name: product.name, price, image: variant?.imageUrls?.[0] || product.image, quantity: qty, color: variant?.color || color || undefined, size: variant?.size || size || undefined };
  }
  async function addToCart() {
    const item = cartItem(); if (!item) { setMessage('Please select an available color and size.'); return; }
    setBusyAction('cart'); setMessage('');
    try { await addCartItem(item); setMessage(`${product.name} added to your bag.`); } catch (error) { setMessage(error instanceof Error ? error.message : 'We could not update your bag. Please try again.'); } finally { setBusyAction(null); }
  }
  async function buyNow() {
    const item = cartItem(); if (!item) { setMessage('Please select an available color and size.'); return; }
    setBusyAction('buy'); setMessage('');
    try { await addCartItem(item); router.push('/checkout'); } catch (error) { setBusyAction(null); setMessage(error instanceof Error ? error.message : 'We could not start checkout. Please try again.'); }
  }
  async function toggleWishlist() {
    if (auth) { const next = !liked; setLiked(next); const response = await fetch(`/api/customer/wishlist${next ? '' : '?productId=' + encodeURIComponent(product.id)}`, { method: next ? 'POST' : 'DELETE', headers: { 'Content-Type': 'application/json' }, body: next ? JSON.stringify({ productId: product.id }) : undefined }); if (!response.ok) setLiked(!next); return; }
    try { const key = 'priyasa_wishlist'; const list: string[] = JSON.parse(localStorage.getItem(key) || '[]'); const next = liked ? list.filter((id) => id !== product.id) : [...new Set([...list, product.id])]; localStorage.setItem(key, JSON.stringify(next)); setLiked(!liked); } catch { setMessage('Wishlist is temporarily unavailable.'); }
  }
  function selectColor(nextColor: string) { setColor(nextColor); const nextSize = sizes.find((candidate) => variants.some((item) => item.color === nextColor && item.size === candidate && Number(item.stock || 0) > 0)); if (nextSize) setSize(nextSize); }
  function whatsapp() {
    if (unavailable) { setMessage('Please select an available color and size.'); return; }
    const url = typeof window !== 'undefined' ? window.location.href : `https://priyasa.com/product/${product.slug || ''}`;
    const text = `Hi PRIYASA 👋\nI want to order this product:\n\nProduct: ${product.name}\nSKU: ${variant?.sku || product.id}\nColor: ${color || variant?.color || 'Any'}\nSize: ${size || variant?.size || 'Any'}\nQuantity: ${qty}\nPrice: ₹${price.toLocaleString('en-IN')}\n\nProduct link: ${url}`;
    window.location.assign(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`);
  }
  const colorLabel = (value: string) => value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  return <div className="purchase-panel premium-purchase-panel">
    <div className="purchase-heading-row"><div><span className="purchase-kicker">SELECT YOUR FIT</span><strong>Choose options</strong></div><button type="button" className={`pdp-wishlist ${liked ? 'liked' : ''}`} onClick={toggleWishlist} aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}>{liked ? '♥' : '♡'} <span>{liked ? 'Saved' : 'Wishlist'}</span></button></div>
    {colors.length > 0 && <div className="option-block"><div className="option-label"><strong>Color</strong><span>{color || 'Select'}</span></div><div className="color-options">{colors.map((item) => <button type="button" key={item} aria-label={`Color ${item}`} title={item} className={`color-chip ${color === item ? 'active' : ''}`} onClick={() => selectColor(item)}><span className="color-chip-swatch" aria-hidden="true" /><b>{colorLabel(item)}</b></button>)}</div></div>}
    {sizes.length > 0 && <div className="option-block"><div className="option-label"><strong>Size</strong><a className="size-guide-link" href="/size-guide">Size Guide ↗</a></div><div className="size-options">{sizes.map((item) => { const available = !variants.length || variants.some((entry) => (!color || entry.color === color) && entry.size === item && Number(entry.stock || 0) > 0); return <button type="button" disabled={!available} key={item} className={size === item ? 'active' : ''} onClick={() => setSize(item)}>{item}{!available && <small>Sold out</small>}</button>; })}</div></div>}
    {unavailable && <div className="pdp-selection-warning" role="status">This combination is currently unavailable. Please choose another option.</div>}
    <div className="quantity-row"><strong>Quantity</strong><div className="qty-control"><button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button type="button" aria-label="Increase quantity" disabled={qty >= maxQty} onClick={() => setQty(Math.min(maxQty, qty + 1))}>+</button></div>{variant && <small>{variant.stock} left</small>}</div>
    <div className="purchase-actions"><button type="button" aria-label="Add to Cart" className="button pdp-add-button" onClick={addToCart} disabled={unavailable || busy}>{busyAction === 'cart' ? 'Adding…' : 'Add to Bag'}</button><button type="button" className="button dark-button pdp-buy-button" onClick={buyNow} disabled={unavailable || busy}>{busyAction === 'buy' ? 'Processing…' : 'Buy Now'}</button></div>
    <button type="button" className="whatsapp-order-button" onClick={whatsapp} disabled={unavailable || busy}>Order on WhatsApp <span>→</span></button>
    <div className="purchase-trust"><span>✓ Secure payment</span><span>✓ Pan-India delivery</span><span>✓ Easy returns</span></div>
    {message && <div className="storefront-toast is-visible pdp-purchase-toast" role="status" aria-live="polite"><CheckIcon />{message}</div>}
  </div>;
}
