'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CloseIcon, HeartIcon, BagIcon, SearchIcon, UserIcon } from '@/components/StorefrontIcons';

type CartItem = { quantity?: number; name?: string; price?: number; image?: string; color?: string; size?: string };
type SearchProduct = { id: string; name: string; slug: string; category?: string; price?: number; mrp?: number; image?: string; badge?: string };
type Props = { searchPlaceholder?: string };
const KEY = 'priyasa_cart';

function readCart(): CartItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
function readCount(items: CartItem[]) { return items.reduce((sum, item) => sum + Math.max(0, Number(item?.quantity || 0)), 0); }
function money(value: unknown) { return `₹${Number(value || 0).toLocaleString('en-IN')}`; }

export function StorefrontHeaderActions({ searchPlaceholder = 'Search for products, brands and more...' }: Props) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [panel, setPanel] = useState<'search' | 'cart' | 'account' | null>(null);
  const [query, setQuery] = useState('');
  const [searchItems, setSearchItems] = useState<SearchProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const searchRequest = useRef(0);

  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('priyasa-cart-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('priyasa-cart-updated', sync);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('e2-panel-open', !!panel);
    return () => document.body.classList.remove('e2-panel-open');
  }, [panel]);

  useEffect(() => {
    if (panel !== 'search') return;
    const value = query.trim();
    if (value.length < 2) {
      setSearchItems([]);
      setSearchLoading(false);
      setSearchError(false);
      return;
    }
    const requestId = ++searchRequest.current;
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(false);
      try {
        const response = await fetch(`/api/storefront/search-advanced?q=${encodeURIComponent(value)}&limit=6`, { cache: 'no-store' });
        const payload = await response.json();
        if (requestId !== searchRequest.current) return;
        if (!response.ok) throw new Error('Search failed');
        setSearchItems(Array.isArray(payload?.data?.products) ? payload.data.products : []);
      } catch {
        if (requestId === searchRequest.current) {
          setSearchItems([]);
          setSearchError(true);
        }
      } finally {
        if (requestId === searchRequest.current) setSearchLoading(false);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query, panel]);

  const close = () => setPanel(null);
  const openSearch = () => {
    setPanel('search');
    window.setTimeout(() => document.getElementById('header-live-search')?.focus(), 0);
  };
  const count = readCount(items);
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);

  return <>
    <div className="actions">
      <button type="button" className="header-icon" aria-label="Search" onClick={openSearch}><SearchIcon /></button>
      <button type="button" className="header-icon" aria-label="Account / Login" onClick={() => setPanel('account')}><UserIcon /></button>
      <Link href="/wishlist" aria-label="Wishlist" className="header-icon"><HeartIcon /></Link>
      <button type="button" className="header-icon" aria-label={`Shopping bag${count ? `, ${count} items` : ''}`} data-count={count || undefined} onClick={() => setPanel('cart')}><BagIcon /></button>
    </div>

    {panel && <>
      <button className="e2-panel-backdrop" aria-label="Close panel" onClick={close} />
      {panel === 'search' && <section className="e2-panel e2-panel--search" role="dialog" aria-modal="true" aria-label="Search Priyasa">
        <div className="e2-panel-head">
          <span className="e2-panel-title">Search Priyasa</span>
          <button className="e2-panel-close" onClick={close} aria-label="Close search"><CloseIcon /></button>
        </div>
        <div className="e2-search-body">
          <form className="e2-search-form" action="/search" onSubmit={e => { if (!query.trim()) e.preventDefault(); }}>
            <SearchIcon />
            <input id="header-live-search" autoFocus value={query} onChange={e => setQuery(e.target.value)} name="q" placeholder={searchPlaceholder} aria-label="Search products" autoComplete="off" />
            {query && <button type="button" className="e2-search-clear" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
            <button type="submit">Search</button>
          </form>

          <div className="header-search-results" aria-live="polite">
            {!query.trim() && <>
              <div className="e2-search-label">Trending</div>
              <div className="e2-search-links">
                <Link href="/new-arrivals" onClick={close}>New Arrivals</Link>
                <Link href="/offers" onClick={close}>Best Offers</Link>
                <Link href="/category/dresses" onClick={close}>Dresses</Link>
                <Link href="/category/kurta-sets" onClick={close}>Kurta Sets</Link>
                <Link href="/category/ethnic-wear" onClick={close}>Ethnic Wear</Link>
              </div>
            </>}
            {query.trim() && searchLoading && <div className="header-search-status">Searching Priyasa…</div>}
            {query.trim() && !searchLoading && searchError && <div className="header-search-status">Search is temporarily unavailable. Try again.</div>}
            {query.trim() && !searchLoading && !searchError && searchItems.length === 0 && <div className="header-search-status">No products found for “{query.trim()}”.</div>}
            {query.trim() && !searchLoading && searchItems.length > 0 && <>
              <div className="e2-search-label">Products</div>
              <div className="header-search-product-list">
                {searchItems.map(product => {
                  const discount = Number(product.mrp) > Number(product.price) ? Math.round((1 - Number(product.price) / Number(product.mrp)) * 100) : 0;
                  return <Link key={product.id} href={`/product/${product.slug}`} className="header-search-product" onClick={close}>
                    <img src={product.image || '/images/product-placeholder.svg'} alt="" loading="lazy" />
                    <span className="header-search-product-copy">
                      <strong>{product.name}</strong>
                      <small>{product.category || 'Fashion'}</small>
                      <span><b>{money(product.price)}</b>{Number(product.mrp) > Number(product.price) && <del>{money(product.mrp)}</del>}{discount > 0 && <em>{discount}% OFF</em>}</span>
                    </span>
                  </Link>;
                })}
              </div>
              <Link className="header-search-view-all" href={`/search?q=${encodeURIComponent(query.trim())}`} onClick={close}>View all results for “{query.trim()}” →</Link>
            </>}
          </div>
        </div>
      </section>}

      {panel === 'account' && <aside className="e2-panel" role="dialog" aria-modal="true" aria-label="Account"><div className="e2-panel-head"><span className="e2-panel-title">My Priyasa Account</span><button className="e2-panel-close" onClick={close} aria-label="Close account"><CloseIcon /></button></div><div className="e2-account-body"><div className="e2-account-grid"><Link className="e2-account-link" href="/account" onClick={close}><span>Account overview</span><span>→</span></Link><Link className="e2-account-link" href="/account/orders" onClick={close}><span>My orders</span><span>→</span></Link><Link className="e2-account-link" href="/wishlist" onClick={close}><span>Wishlist</span><span>→</span></Link><Link className="e2-account-link" href="/account/returns" onClick={close}><span>Returns & exchanges</span><span>→</span></Link><Link className="e2-account-link" href="/help" onClick={close}><span>Help Centre</span><span>→</span></Link></div><Link className="e2-account-login" href="/login" onClick={close}>Sign in / Create account</Link></div></aside>}

      {panel === 'cart' && <aside className="e2-panel" role="dialog" aria-modal="true" aria-label="Shopping cart"><div className="e2-panel-head"><span className="e2-panel-title">Shopping Cart ({count})</span><button className="e2-panel-close" onClick={close} aria-label="Close shopping cart"><CloseIcon /></button></div>{items.length ? <div className="e2-cart-body"><div className="e2-cart-items">{items.slice(0, 8).map((item, index) => <div className="e2-cart-item" key={`${item.name || 'item'}-${index}`}>{item.image ? <img src={item.image} alt="" /> : <div />}{<div><strong>{item.name || 'Product'}</strong><span>{[item.color, item.size].filter(Boolean).join(' · ') || 'Selected variant'}</span><span>Qty {Number(item.quantity) || 1}</span></div>}<b>{money((Number(item.price) || 0) * (Number(item.quantity) || 0))}</b></div>)}</div></div> : <div className="e2-cart-body"><div className="e2-cart-empty"><strong>Your cart is empty</strong><span>Discover the latest Priyasa styles.</span></div></div>}<div className="e2-panel-foot"><div className="e2-panel-foot-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><Link className="e2-panel-button e2-panel-button--dark" href="/checkout" onClick={close}>Checkout</Link><Link className="e2-panel-button e2-panel-button--light" href="/cart" onClick={close}>View Cart</Link></div></aside>}
    </>}
  </>;
}
