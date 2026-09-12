'use client';

import { useRef, useState } from 'react';
import type { Product } from '@/lib/catalog';
import { ProductCard } from '@/components/ProductCard';

type DisplayConfig = {
  desktop_columns?: number; tablet_columns?: number; mobile_columns?: number;
  desktop_cards?: number; tablet_cards?: number; mobile_cards?: number;
  mobile_scroll?: boolean; desktopColumns?: number; tabletColumns?: number; mobileColumns?: number; mobileScroll?: boolean;
  load_more?: boolean; load_more_step?: number;
  show_rating?: boolean; show_mrp?: boolean; show_discount?: boolean;
};

type Props = { products: Product[]; initialVisible?: number; step?: number; variant?: 'load-more' | 'carousel'; display?: DisplayConfig; ariaLabel?: string };
const clampColumns = (value: unknown, fallback: number, max = 6) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 1 ? Math.min(max, Math.round(parsed)) : fallback; };

export default function HomeProductGrid({ products, initialVisible = 8, step = 8, variant = 'load-more', display, ariaLabel = 'Product carousel' }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const loadMoreEnabled = display?.load_more !== false;
  const [visible, setVisible] = useState(Math.min(initialVisible, products.length));
  if (!products.length) return null;
  const desktop = clampColumns(display?.desktop_columns ?? display?.desktopColumns ?? display?.desktop_cards, variant === 'carousel' ? 4 : 5);
  const tablet = clampColumns(display?.tablet_columns ?? display?.tabletColumns ?? display?.tablet_cards, Math.min(3, desktop));
  const mobile = clampColumns(display?.mobile_columns ?? display?.mobileColumns ?? display?.mobile_cards, 2, 4);
  const mobileScroll = display?.mobile_scroll ?? display?.mobileScroll ?? true;
  const visibility = `${display?.show_rating === false ? ' home-products--hide-rating' : ''}${display?.show_mrp === false ? ' home-products--hide-mrp' : ''}${display?.show_discount === false ? ' home-products--hide-discount' : ''}`;

  if (variant === 'carousel') {
    const scroll = (direction: number) => { const rail = railRef.current; if (!rail) return; rail.scrollBy({ left: direction * Math.max(280, rail.clientWidth * 0.82), behavior: 'smooth' }); };
    return <div className={`home-product-carousel ${mobileScroll ? 'home-product-carousel--mobile-scroll' : 'home-product-carousel--mobile-grid'}${visibility}`} aria-label={ariaLabel} style={{ '--home-carousel-desktop': desktop, '--home-carousel-tablet': tablet, '--home-carousel-mobile': mobile } as React.CSSProperties}><div className="home-product-carousel-viewport" ref={railRef}><div className="home-product-carousel-track">{products.map((product) => <div className="home-product-carousel-item" key={product.id}><ProductCard product={product} /></div>)}</div></div>{products.length > desktop && <><button type="button" className="home-product-carousel-control home-product-carousel-prev" onClick={() => scroll(-1)} aria-label="Previous products">‹</button><button type="button" className="home-product-carousel-control home-product-carousel-next" onClick={() => scroll(1)} aria-label="Next products">›</button></>}</div>;
  }

  const shown = loadMoreEnabled ? products.slice(0, visible) : products;
  const remaining = loadMoreEnabled ? products.length - visible : 0;
  const loadStep = Math.max(1, Number(display?.load_more_step ?? step) || step);
  return <><div className={`product-grid product-grid-editorial home-product-grid home-product-grid--load-more${visibility}`} style={{ '--home-grid-desktop': desktop, '--home-grid-tablet': tablet, '--home-grid-mobile': mobile } as React.CSSProperties}>{shown.map((product) => <ProductCard key={product.id} product={product} />)}</div>{remaining > 0 && <div className="home-load-more"><button type="button" className="button button-light" onClick={() => setVisible((current) => Math.min(current + loadStep, products.length))}>Load More <span>({remaining} more)</span> ↓</button><small>Showing {visible} of {products.length} styles</small></div>}</>;
}

export function HomeProductGridStyles() {
  return <style dangerouslySetInnerHTML={{ __html: `
.home-product-grid{grid-template-columns:repeat(var(--home-grid-desktop,5),minmax(0,1fr))!important}.home-products--hide-rating .product-rating{display:none!important}.home-products--hide-mrp .mrp{display:none!important}.home-products--hide-discount .discount-text,.home-products--hide-discount .nykaa-discount-badge{display:none!important}
.home-product-carousel{position:relative;width:min(1320px,calc(100% - 48px));margin:0 auto}.home-product-carousel-viewport{overflow:hidden}.home-product-carousel-track{display:flex;gap:16px;overflow-x:auto;scroll-behavior:smooth;scroll-snap-type:x mandatory;scrollbar-width:none;padding:2px 1px 8px}.home-product-carousel-track::-webkit-scrollbar{display:none}.home-product-carousel-item{flex:0 0 calc((100% - (var(--home-carousel-desktop,4) - 1)*16px)/var(--home-carousel-desktop,4));min-width:0;scroll-snap-align:start}.home-product-carousel-control{position:absolute;top:42%;transform:translateY(-50%);width:40px;height:40px;border:1px solid #e6dadd;border-radius:50%;background:rgba(255,255,255,.96);box-shadow:0 8px 24px rgba(43,26,29,.12);cursor:pointer;font-size:26px;line-height:1;z-index:2}.home-product-carousel-prev{left:-18px}.home-product-carousel-next{right:-18px}.home-load-more{display:grid;justify-items:center;gap:8px;padding:22px 0 4px}.home-load-more small{color:#7b6a6e;font-size:11px}
@media(max-width:900px){.home-product-grid{grid-template-columns:repeat(var(--home-grid-tablet,3),minmax(0,1fr))!important}.home-product-carousel-item{flex-basis:calc((100% - (var(--home-carousel-tablet,3) - 1)*14px)/var(--home-carousel-tablet,3))}.home-product-carousel-track{gap:14px}.home-product-carousel{width:calc(100% - 32px)}}
@media(max-width:560px){.home-product-grid{grid-template-columns:repeat(var(--home-grid-mobile,2),minmax(0,1fr))!important}.home-product-carousel-item{flex-basis:calc((100% - (var(--home-carousel-mobile,2) - 1)*10px)/var(--home-carousel-mobile,2))}.home-product-carousel-track{gap:10px;padding-left:1px;padding-right:1px}.home-product-carousel{width:calc(100% - 24px)}.home-product-carousel-control{display:none}.home-product-carousel--mobile-grid .home-product-carousel-viewport{overflow:visible}.home-product-carousel--mobile-grid .home-product-carousel-track{display:grid;grid-template-columns:repeat(var(--home-carousel-mobile,2),minmax(0,1fr));overflow:visible;scroll-snap-type:none}.home-product-carousel--mobile-grid .home-product-carousel-item{flex:none;width:auto}}
` }} />;
}
