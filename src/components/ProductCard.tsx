'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Product } from '@/lib/catalog';
import { money } from '@/lib/catalog';
import { AddToCart } from '@/components/AddToCart';
import { SafeImage } from '@/components/SafeImage';

type Props = { product: Product };
type WishlistState = { authenticated: boolean; ids: Set<string> };
const WISHLIST_KEY = 'priyasa_wishlist';
const COMPARE_KEY = 'priyasa_compare';

function readIds(key: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.map((id) => String(id)) : [];
  } catch {
    return [];
  }
}

let wishlistRequest: Promise<WishlistState> | null = null;
function getWishlistState(): Promise<WishlistState> {
  if (wishlistRequest) return wishlistRequest;
  wishlistRequest = fetch('/api/customer/wishlist', { cache: 'no-store' })
    .then(async (response): Promise<WishlistState> => {
      const data: unknown = await response.json().catch(() => ({}));
      const payload = data && typeof data === 'object' ? data as { authenticated?: unknown; data?: unknown } : {};
      const wishlist = Array.isArray(payload.data) ? payload.data : [];
      const ids = new Set<string>();
      for (const item of wishlist) {
        if (item && typeof item === 'object' && 'id' in item) ids.add(String((item as { id: unknown }).id));
      }
      return { authenticated: Boolean(payload.authenticated), ids };
    })
    .catch(() => ({ authenticated: false, ids: new Set<string>() }));
  return wishlistRequest;
}

export function ProductCard({ product }: Props) {
  const [liked, setLiked] = useState(false);
  const [auth, setAuth] = useState(false);
  const [quick, setQuick] = useState(false);
  const [compared, setCompared] = useState(false);
  const [message, setMessage] = useState('');
  const hasDiscount = Number(product.mrp) > Number(product.price) && Number(product.price) > 0;
  const discount = hasDiscount ? Math.max(1, Math.round((1 - Number(product.price) / Number(product.mrp)) * 100)) : 0;
  const colors = useMemo(() => (Array.isArray(product.colors) ? product.colors : []).filter(Boolean).slice(0, 6), [product.colors]);
  const editorialBadge = String(product.badge || '').trim();
  const hasDistinctEditorialBadge = Boolean(editorialBadge) && !/^\d{1,3}%\s*OFF$/i.test(editorialBadge) && editorialBadge.toLowerCase() !== `${discount}% off`.toLowerCase();

  useEffect(() => {
    let active = true;
    getWishlistState().then((state) => {
      if (!active) return;
      setAuth(state.authenticated);
      setLiked(state.authenticated ? state.ids.has(String(product.id)) : readIds(WISHLIST_KEY).includes(String(product.id)));
    });
    setCompared(readIds(COMPARE_KEY).includes(String(product.id)));
    return () => { active = false; };
  }, [product.id]);

  useEffect(() => {
    try {
      const key = 'priyasa_recently_viewed';
      const list = readIds(key);
      localStorage.setItem(key, JSON.stringify([product.id, ...list.filter((id) => id !== product.id)].slice(0, 20)));
    } catch { /* localStorage may be unavailable */ }
  }, [product.id]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 2200);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function toggleWishlist() {
    if (auth) {
      const next = !liked;
      setLiked(next);
      const response = await fetch(`/api/customer/wishlist${next ? '' : '?productId=' + encodeURIComponent(product.id)}`, {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: next ? JSON.stringify({ productId: product.id }) : undefined,
      });
      if (!response.ok) setLiked(!next);
      else { wishlistRequest = null; setMessage(next ? 'Added to wishlist' : 'Removed from wishlist'); }
      return;
    }
    const list = readIds(WISHLIST_KEY);
    const next = liked ? list.filter((id) => id !== String(product.id)) : [...new Set([...list, String(product.id)])];
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    setLiked(!liked);
    setMessage(!liked ? 'Added to wishlist' : 'Removed from wishlist');
  }

  function toggleCompare() {
    const list = readIds(COMPARE_KEY);
    const id = String(product.id);
    if (list.includes(id)) {
      localStorage.setItem(COMPARE_KEY, JSON.stringify(list.filter((itemId) => itemId !== id)));
      setCompared(false); setMessage('Removed from compare'); return;
    }
    if (list.length >= 4) { setMessage('Compare up to 4 products'); return; }
    localStorage.setItem(COMPARE_KEY, JSON.stringify([...list, id]));
    setCompared(true); setMessage('Added to compare');
  }

  function openQuick() { setQuick(true); document.body.classList.add('quick-view-open'); }
  function closeQuick() { setQuick(false); document.body.classList.remove('quick-view-open'); }
  const colorStyle = (color: string): CSSProperties => ({ background: color.toLowerCase().replace(/[^a-z#0-9(),.% -]/g, '') });

  return <>
    <article className="product-card ecomus-product-card nykaa-product-card">
      <div className="product-media ecomus-product-media nykaa-product-media">
        <div className="ecomus-product-badges nykaa-product-badges">
          {hasDiscount && <span className="nykaa-discount-badge">{discount}% OFF</span>}
          {hasDistinctEditorialBadge && <span className="nykaa-editorial-badge">{editorialBadge}</span>}
        </div>
        <div className="ecomus-product-actions nykaa-product-actions" aria-label="Product actions">
          <button type="button" className={`ecomus-action ecomus-wishlist nykaa-wishlist ${liked ? 'is-active' : ''}`} onClick={toggleWishlist} aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'} title={liked ? 'Remove from wishlist' : 'Add to wishlist'}>{liked ? '♥' : '♡'}</button>
          <button type="button" className="ecomus-action nykaa-quick" onClick={openQuick} aria-label={`Quick view ${product.name}`} title="Quick View">Quick View</button>
        </div>
        <Link href={`/product/${product.slug}`} aria-label={product.name} className="product-image-link ecomus-product-image-link">
          <SafeImage src={product.image} alt={product.name} width={600} height={800} loading="lazy" />
        </Link>
        {product.variantId && <div className="ecomus-quick-add nykaa-quick-add"><AddToCart variantId={product.variantId} productId={product.id} name={product.name} price={product.price} image={product.image} /></div>}
      </div>
      <div className="product-info ecomus-product-info nykaa-product-info">
        <div className="product-category">{product.category}</div>
        <h3><Link href={`/product/${product.slug}`}>{product.name}</Link></h3>
        {typeof product.rating === 'number' && product.reviewCount !== undefined && product.reviewCount > 0 && <div className="product-rating"><span>★</span><small>{product.rating.toFixed(1)} ({product.reviewCount})</small></div>}
        <div className="ecomus-price-row nykaa-price-row"><span className="price">{money(product.price)}</span>{hasDiscount && <><span className="mrp">{money(product.mrp)}</span><span className="discount-text">({discount}% OFF)</span></>}</div>
        {colors.length > 0 && <div className="ecomus-color-swatches nykaa-color-swatches" aria-label="Available colors">{colors.map((color, index) => <span key={`${color}-${index}`} className="ecomus-color-swatch nykaa-color-swatch" title={color} aria-label={color} style={colorStyle(color)} />)}{product.colors.length > 6 && <span className="ecomus-color-more">+{product.colors.length - 6}</span>}</div>}
      </div>
    </article>
    {message && <div className="ecomus-product-toast" role="status" aria-live="polite">{message}</div>}
    {quick && <div className="ecomus-quick-view nykaa-quick-view" role="dialog" aria-modal="true" aria-label={`Quick view ${product.name}`} onClick={closeQuick}>
      <div className="ecomus-quick-view-panel" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="ecomus-quick-view-close" onClick={closeQuick} aria-label="Close quick view">×</button>
        <div className="ecomus-quick-view-media"><SafeImage src={product.image} alt={product.name} width={700} height={900} /></div>
        <div className="ecomus-quick-view-content"><span className="product-category">{product.category}</span><h2>{product.name}</h2>{typeof product.rating === 'number' && product.reviewCount !== undefined && product.reviewCount > 0 && <div className="product-rating"><span>★</span><small>{product.rating.toFixed(1)} ({product.reviewCount})</small></div>}<div className="ecomus-quick-price"><b>{money(product.price)}</b>{hasDiscount && <><del>{money(product.mrp)}</del><strong>{discount}% OFF</strong></>}</div>{colors.length > 0 && <div className="ecomus-quick-option"><strong>Color</strong><div className="ecomus-color-swatches">{colors.map((color, index) => <span key={`${color}-${index}`} className="ecomus-color-swatch ecomus-color-swatch--large" title={color} aria-label={color} style={colorStyle(color)} />)}</div></div>}{product.sizes.length > 0 && <div className="ecomus-quick-option"><strong>Size</strong><div className="ecomus-size-options">{product.sizes.slice(0, 8).map((size) => <span key={size}>{size}</span>)}</div></div>}<Link className="button dark-button ecomus-view-product" href={`/product/${product.slug}`} onClick={closeQuick}>View Product</Link></div>
      </div>
    </div>}
  </>;
}
