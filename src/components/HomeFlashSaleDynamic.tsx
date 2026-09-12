'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@/lib/catalog';
import HomeProductGrid from '@/components/HomeProductGrid';

const clean = (value: unknown) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const href = (value: unknown) => { const v = String(value ?? '').trim(); return v && (v.startsWith('/') || v.startsWith('http://') || v.startsWith('https://')) ? v : v ? `/${v}` : '/shop'; };

export default function HomeFlashSaleDynamic({ section, products }: { section: any; products: Product[] }) {
  const content = section?.content || {};
  const sale = content.sale || {};
  const display = content.display && typeof content.display === 'object' ? content.display : {};
  const endsAt = sale.ends_at || null;
  const [remaining, setRemaining] = useState(() => endsAt ? Math.max(0, new Date(endsAt).getTime() - Date.now()) : 0);
  useEffect(() => { if (!endsAt) return; const id = window.setInterval(() => setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now())), 1000); return () => window.clearInterval(id); }, [endsAt]);
  const time = useMemo(() => { const s = Math.floor(remaining / 1000); return `${String(Math.floor(s / 86400)).padStart(2, '0')}d ${String(Math.floor((s % 86400) / 3600)).padStart(2, '0')}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m ${String(s % 60).padStart(2, '0')}s`; }, [remaining]);
  const cta = content.cta || {};
  const showDiscount = display.show_discount !== false;
  const showMrp = display.show_mrp !== false;
  const showStockProgress = display.show_stock_progress === true;
  const displayWithOverrides = { ...display, show_discount: showDiscount, show_mrp: showMrp };
  return <section className="home-flash-sale" style={{ padding: '30px 0 38px', background: '#fff' }}><div className="home-section-head" style={{ width: 'min(1320px, calc(100% - 48px))', margin: '0 auto 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20 }}><div>{section.title && <h2>{clean(section.title)}</h2>}{section.subtitle && <p>{clean(section.subtitle)}</p>}</div>{cta.href && <a className="home-view-all" href={href(cta.href)}>{clean(cta.label || 'View All')} <span>→</span></a>}</div><div style={{ width: 'min(1320px, calc(100% - 48px))', margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{sale.show_countdown && endsAt ? <span style={{ fontSize: 11, fontWeight: 800, color: '#8d1d4e', letterSpacing: .7 }}>ENDS IN {remaining ? time : 'ENDED'}</span> : <span/>}<span style={{ fontSize: 10, color: '#686b78' }}>{products.length} styles</span></div>{products.length ? <><HomeProductGrid products={products} initialVisible={Number(display.load_more_step || products.length) || products.length} step={Number(display.load_more_step || 12) || 12} variant="carousel" display={displayWithOverrides} ariaLabel={clean(section.title) || 'Flash sale products'} />{showStockProgress && <div style={{ width: 'min(1320px, calc(100% - 48px))', margin: '12px auto 0', fontSize: 10, color: '#686b78' }}>Limited-stock sale • Availability is controlled by live catalog inventory.</div>}</> : <div className="home-empty-products">No discounted styles are available right now.</div>}</section>;
}
