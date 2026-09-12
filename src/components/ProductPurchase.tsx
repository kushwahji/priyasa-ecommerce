'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon } from '@/components/StorefrontIcons';

type Variant = { id: string; color: string; size: string; price: number; stock: number };
type Product = { id: string; name: string; slug?: string; price: number; colors: string[]; sizes: string[]; image?: string; variants?: Variant[] };
const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '917987610989').replace(/\D/g, '');

export function ProductPurchase({ product }: { product: Product }) {
  const router = useRouter();
  const [color, setColor] = useState(product.colors[0] || '');
  const [size, setSize] = useState(product.sizes[0] || '');
  const [qty, setQty] = useState(1);
  const [liked, setLiked] = useState(false);
  const [auth, setAuth] = useState(false);
  const [message, setMessage] = useState('');
  const variant = useMemo(() => product.variants?.find((v) => v.color === color && v.size === size && v.stock > 0), [product.variants, color, size]);
  const price = variant?.price ?? product.price;
  const maxQty = Math.max(1, Math.min(20, variant?.stock || 20));
  const unavailable = Boolean(product.variants?.length) && !variant;

  useEffect(() => {
    fetch('/api/customer/wishlist', { cache: 'no-store' }).then((r) => r.json()).then((data) => {
      if (data.authenticated) { setAuth(true); setLiked((data.data || []).some((x: { id: string }) => x.id === product.id)); }
      else { try { setLiked(JSON.parse(localStorage.getItem('priyasa_wishlist') || '[]').includes(product.id)); } catch {} }
    }).catch(() => { try { setLiked(JSON.parse(localStorage.getItem('priyasa_wishlist') || '[]').includes(product.id)); } catch {} });
  }, [product.id]);

  useEffect(() => { if (!message) return; const t = window.setTimeout(() => setMessage(''), 2600); return () => window.clearTimeout(t); }, [message]);

  function cartItem() {
    if (!variant) return null;
    return { variantId: variant.id, productId: product.id, name: `${product.name} · ${variant.color} · ${variant.size}`, price, image: product.image, quantity: qty };
  }

  function addToCart() {
    const item = cartItem();
    if (!item) { setMessage('Please select an available color and size.'); return; }
    try {
      const key = 'priyasa_cart'; const cart = JSON.parse(localStorage.getItem(key) || '[]'); const i = cart.findIndex((x: { variantId: string }) => x.variantId === item.variantId);
      if (i >= 0) cart[i] = { ...cart[i], quantity: Math.min(20, Number(cart[i].quantity || 0) + qty) }; else cart.push(item);
      localStorage.setItem(key, JSON.stringify(cart)); window.dispatchEvent(new Event('priyasa-cart-updated')); setMessage(`${product.name} added to your bag.`);
    } catch { setMessage('We could not update your bag. Please try again.'); }
  }

  function buyNow() {
    const item = cartItem();
    if (!item) { setMessage('Please select an available color and size.'); return; }
    try {
      const key = 'priyasa_cart'; const cart = JSON.parse(localStorage.getItem(key) || '[]'); const i = cart.findIndex((x: { variantId: string }) => x.variantId === item.variantId);
      if (i >= 0) cart[i] = { ...cart[i], quantity: Math.min(20, Number(cart[i].quantity || 0) + qty) }; else cart.push(item);
      localStorage.setItem(key, JSON.stringify(cart)); window.dispatchEvent(new Event('priyasa-cart-updated')); router.push('/checkout');
    } catch { setMessage('We could not start checkout. Please try again.'); }
  }

  async function toggleWishlist() {
    if (auth) {
      const next = !liked; setLiked(next);
      const r = await fetch(`/api/customer/wishlist${next ? '' : '?productId=' + encodeURIComponent(product.id)}`, { method: next ? 'POST' : 'DELETE', headers: { 'Content-Type': 'application/json' }, body: next ? JSON.stringify({ productId: product.id }) : undefined });
      if (!r.ok) setLiked(!next); return;
    }
    try { const key = 'priyasa_wishlist'; const list: string[] = JSON.parse(localStorage.getItem(key) || '[]'); const next = liked ? list.filter((id) => id !== product.id) : [...new Set([...list, product.id])]; localStorage.setItem(key, JSON.stringify(next)); setLiked(!liked); }
    catch { setMessage('Wishlist is temporarily unavailable.'); }
  }

  function whatsapp() {
    const url = typeof window !== 'undefined' ? window.location.href : `https://priyasa.com/product/${product.slug || ''}`;
    const text = `Hi PRIYASA 👋\nI want to order this product:\n\n${product.name}\nColor: ${color || 'Any'}\nSize: ${size || 'Any'}\nQuantity: ${qty}\nPrice: ₹${price}\n\nProduct: ${url}`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  return <div className="purchase-panel premium-purchase-panel">
    <div className="purchase-heading-row"><div><span className="purchase-kicker">SELECT YOUR FIT</span><strong>Choose options</strong></div><button type="button" className={`pdp-wishlist ${liked ? 'liked' : ''}`} onClick={toggleWishlist} aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}>{liked ? '♥' : '♡'} <span>{liked ? 'Saved' : 'Wishlist'}</span></button></div>
    <div className="option-block"><div className="option-label"><strong>Color</strong><span>{color || 'Select'}</span></div><div className="color-options">{product.colors.map((c) => <button type="button" key={c} aria-label={c} title={c} className={`color-chip color-${c.toLowerCase().replaceAll(' ', '-')} ${color === c ? 'active' : ''}`} onClick={() => { setColor(c); const first = product.sizes.find((s) => product.variants?.some((v) => v.color === c && v.size === s && v.stock > 0)); if (first) setSize(first); }}><span /></button>)}</div></div>
    <div className="option-block"><div className="option-label"><strong>Size</strong><a className="size-guide-link" href="/size-guide">Size Guide ↗</a></div><div className="size-options">{product.sizes.map((s) => { const available = !product.variants?.length || product.variants.some((v) => v.color === color && v.size === s && v.stock > 0); return <button type="button" disabled={!available} key={s} className={size === s ? 'active' : ''} onClick={() => setSize(s)}>{s}{!available && <small>Sold out</small>}</button>; })}</div></div>
    {unavailable && <div className="pdp-selection-warning" role="status">This combination is currently unavailable. Please choose another option.</div>}
    <div className="quantity-row"><strong>Quantity</strong><div className="qty-control"><button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button type="button" aria-label="Increase quantity" disabled={qty >= maxQty} onClick={() => setQty(Math.min(maxQty, qty + 1))}>+</button></div>{variant && <small>{variant.stock} left</small>}</div>
    <div className="purchase-actions"><button type="button" className="button pdp-add-button" onClick={addToCart} disabled={unavailable}>Add to Bag</button><button type="button" className="button dark-button pdp-buy-button" onClick={buyNow} disabled={unavailable}>Buy Now</button></div>
    <button type="button" className="whatsapp-order-button" onClick={whatsapp} aria-label="Order this product on WhatsApp">Order on WhatsApp <span>→</span></button>
    <div className="purchase-trust"><span>✓ Secure payment</span><span>✓ Pan-India delivery</span><span>✓ Easy returns</span></div>
    {message && <div className="storefront-toast is-visible pdp-purchase-toast" role="status" aria-live="polite"><CheckIcon />{message}</div>}
    <div className="pdp-mobile-purchase"><div><small>{variant ? `${color} · ${size}` : 'Select options'}</small><strong>₹{price.toLocaleString('en-IN')}</strong></div><button type="button" className="button" onClick={buyNow} disabled={unavailable}>Buy Now</button><button type="button" className="button dark-button" onClick={addToCart} disabled={unavailable}>Add to Bag</button><button type="button" className="whatsapp-mobile-button" onClick={whatsapp} disabled={unavailable}>Order on WhatsApp</button></div>
  </div>;
}
