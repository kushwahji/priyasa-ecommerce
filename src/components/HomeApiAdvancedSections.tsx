'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@/lib/catalog';
import { ProductCard } from '@/components/ProductCard';

type PromiseItem = { icon?: string; title?: string; subtitle?: string };
type EditorialItem = { id?: string | number; title?: string; subtitle?: string; image_url?: string; mobile_image_url?: string; href?: string };
type ReviewItem = { id: string; rating: number; customer?: string; text: string; product?: string; productImage?: string };

const clean = (value: unknown) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const link = (value: unknown) => { const v = String(value ?? '').trim(); return v && (v.startsWith('/') || v.startsWith('http://') || v.startsWith('https://')) ? v : v ? `/${v}` : '/shop'; };

export function HomeApiStyles() {
  return <style dangerouslySetInnerHTML={{ __html: `
.home-api-service-strip .home-service-strip-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}
.home-api-editorial .home-editorial-grid{grid-template-columns:repeat(var(--editorial-columns,3),minmax(0,1fr))}
.home-api-editorial[data-editorial-layout="casual"] .home-editorial-grid{grid-template-columns:repeat(12,minmax(0,1fr));grid-auto-flow:dense}
.home-api-editorial[data-editorial-layout="casual"] .home-editorial-grid>a:nth-child(6n+1){grid-column:span 7;min-height:390px}
.home-api-editorial[data-editorial-layout="casual"] .home-editorial-grid>a:nth-child(6n+2){grid-column:span 5;min-height:390px}
.home-api-editorial[data-editorial-layout="casual"] .home-editorial-grid>a:nth-child(6n+3){grid-column:span 4;min-height:300px}
.home-api-editorial[data-editorial-layout="casual"] .home-editorial-grid>a:nth-child(6n+4){grid-column:span 4;min-height:300px}
.home-api-editorial[data-editorial-layout="casual"] .home-editorial-grid>a:nth-child(6n+5){grid-column:span 4;min-height:300px}
.home-api-editorial[data-editorial-layout="casual"] .home-editorial-grid>a:nth-child(6n){grid-column:span 6;min-height:340px}
.home-api-editorial[data-editorial-layout="masonry"] .home-editorial-grid{align-items:start}
.home-api-editorial[data-editorial-layout="masonry"] .home-editorial-grid>a:nth-child(3n+2){margin-top:34px}
.home-api-reviews .home-review-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.home-api-offer-banner picture{display:block;position:absolute;inset:0}
.home-api-offer-banner img{display:block}
.home-api-offer-banner .home-api-offer-copy{width:min(48%,560px)}
.home-empty-products{width:min(1320px,calc(100% - 48px));margin:0 auto;padding:28px;text-align:center;background:#fff7f9;border:1px solid #f0e0e5;border-radius:8px;color:#686b78;font-size:12px}
@media(max-width:760px){
 .home-api-service-strip .home-service-strip-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;width:100%!important}
 .home-api-service-strip .home-service-strip-grid>div{min-height:82px!important;border-right:1px solid #eee!important;border-bottom:0!important;gap:5px!important;padding:0 4px!important;box-sizing:border-box!important}
 .home-api-service-strip .home-service-strip-grid>div:last-child{border-right:0!important}
 .home-api-service-strip .home-service-strip-grid>div>span:first-child{font-size:18px!important;flex:0 0 auto}
 .home-api-service-strip .home-service-strip-grid>div>span:last-child{text-align:left!important;min-width:0!important}
 .home-api-service-strip .home-service-strip-grid strong{font-size:9px!important;letter-spacing:.2px!important;white-space:nowrap!important}
 .home-api-service-strip .home-service-strip-grid small{font-size:8px!important;white-space:nowrap!important}
 .home-api-editorial{padding:26px 0 18px!important}
 .home-api-editorial .home-editorial-grid{grid-template-columns:repeat(var(--editorial-mobile-columns,var(--editorial-columns,2)),minmax(0,1fr))!important;width:calc(100% - 24px)!important;gap:9px!important}
 .home-api-editorial[data-editorial-layout="casual"] .home-editorial-grid{grid-template-columns:repeat(6,minmax(0,1fr))!important}
 .home-api-editorial[data-editorial-layout="casual"] .home-editorial-grid>a:nth-child(6n+1){grid-column:span 4;min-height:300px}
 .home-api-editorial[data-editorial-layout="casual"] .home-editorial-grid>a:nth-child(6n+2){grid-column:span 2;min-height:300px}
 .home-api-editorial[data-editorial-layout="casual"] .home-editorial-grid>a:nth-child(6n+3),.home-api-editorial[data-editorial-layout="casual"] .home-editorial-grid>a:nth-child(6n+4),.home-api-editorial[data-editorial-layout="casual"] .home-editorial-grid>a:nth-child(6n+5){grid-column:span 2;min-height:240px}
 .home-api-editorial[data-editorial-layout="casual"] .home-editorial-grid>a:nth-child(6n){grid-column:span 3;min-height:260px}
 .home-api-editorial .home-editorial-grid a,.home-api-editorial .home-editorial-grid img{min-height:250px!important;height:250px!important}
 .home-api-editorial[data-editorial-layout="casual"] .home-editorial-grid a,.home-api-editorial[data-editorial-layout="casual"] .home-editorial-grid img{height:100%!important;min-height:0!important}
 .home-api-editorial .home-editorial-grid strong{font-size:13px!important}
 .home-api-editorial .home-editorial-grid small{font-size:9px!important}
 .home-api-offer-banner{padding:18px 0 26px!important}
 .home-api-offer-banner>div{width:calc(100% - 20px)!important;min-height:390px!important}
 .home-api-offer-banner picture,.home-api-offer-banner img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}
 .home-api-offer-banner img{object-fit:cover!important}
 .home-api-offer-banner .home-api-offer-copy{width:100%!important;min-height:390px!important;padding:210px 20px 24px!important;justify-content:flex-end!important;background:linear-gradient(0deg,rgba(255,245,247,.98) 0%,rgba(255,245,247,.8) 42%,transparent 76%)!important}
 .home-api-offer-banner h2{font-size:25px!important}
 .home-api-reviews{padding:28px 0!important}
 .home-api-reviews .home-review-grid{display:flex!important;overflow-x:auto!important;scroll-snap-type:x mandatory!important;padding:0 12px 4px!important;gap:10px!important;scrollbar-width:none!important}
 .home-api-reviews .home-review-grid::-webkit-scrollbar{display:none}
 .home-api-reviews .home-review-grid article{flex:0 0 82%!important;scroll-snap-align:start!important}
 .home-empty-products{width:calc(100% - 24px)!important}
}
` }} />;
}

function Head({ title, subtitle, href, label = 'View All' }: { title?: string | null; subtitle?: string | null; href?: string; label?: string }) {
  return <div className="home-section-head" style={{ width: 'min(1320px, calc(100% - 48px))', margin: '0 auto 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20 }}><div>{title && <h2>{clean(title)}</h2>}{subtitle && <p>{clean(subtitle)}</p>}</div>{href && <Link className="home-view-all" href={href}>{clean(label)} <span>→</span></Link>}</div>;
}

export function HomeServiceStrip({ items }: { items: PromiseItem[] }) {
  if (!items.length) return null;
  return <section className="home-api-service-strip" aria-label="Priyasa service promises" style={{ borderTop: '1px solid #eee', borderBottom: '1px solid #eee', background: '#fff' }}><div style={{ width: 'min(1320px, calc(100% - 28px))', margin: '0 auto', display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 4)},1fr)` }} className="home-service-strip-grid">{items.map((item, i) => <div key={i} style={{ minHeight: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderRight: i < items.length - 1 ? '1px solid #eee' : 0 }}><span aria-hidden="true" style={{ fontSize: 21 }}>{item.icon === 'return' ? '↩' : item.icon === 'shield' ? '✓' : item.icon === 'truck' ? '▣' : item.icon === 'location' ? '⌖' : '•'}</span><span><strong style={{ display: 'block', fontSize: 11, letterSpacing: '.4px' }}>{clean(item.title)}</strong><small style={{ color: '#686b78', fontSize: 10 }}>{clean(item.subtitle)}</small></span></div>)}</div></section>;
}

export function HomeEditorialGrid({ section }: { section: any }) {
  const content = section?.content || {};
  const values: EditorialItem[] = Array.isArray(content.items) ? content.items : [];
  if (!values.length) return null;
  const columns = Math.max(1, Math.min(4, Number(content.columns) || 3));
  const mobileColumns = Math.max(1, Math.min(4, Number(content.mobile_columns ?? content.mobileColumns ?? columns) || columns));
  const rawLayout = String(content.layout || content.grid_style || content.gridStyle || 'grid').toLowerCase().replace(/\s+/g,'-');
  const layout = ['grid','casual','masonry'].includes(rawLayout) ? rawLayout : 'grid';
  return <section className="home-api-editorial" data-editorial-layout={layout} style={{ padding: '38px 0 28px', ['--editorial-columns' as any]: columns, ['--editorial-mobile-columns' as any]: mobileColumns }}><Head title={section.title} subtitle={section.subtitle} /><div style={{ width: 'min(1320px, calc(100% - 48px))', margin: '0 auto', display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, gap: 14 }} className="home-editorial-grid">{values.map((item, i) => <Link key={String(item.id ?? i)} href={link(item.href)} style={{ position: 'relative', display: 'block', overflow: 'hidden', borderRadius: 8, background: '#f6f6f7', minHeight: 360, textDecoration: 'none', color: '#282c3f' }}><picture><source media="(max-width:760px)" srcSet={item.mobile_image_url || item.image_url || ''}/><img src={item.image_url || '/images/product-placeholder.svg'} alt={clean(item.title)} loading="lazy" style={{ width: '100%', height: '100%', minHeight: 360, objectFit: 'cover', display: 'block' }}/></picture><span style={{ position: 'absolute', inset: 'auto 0 0', padding: '70px 18px 18px', background: 'linear-gradient(transparent, rgba(0,0,0,.68))', color: '#fff' }}><strong style={{ display: 'block', fontSize: 18 }}>{clean(item.title)}</strong><small style={{ display: 'block', marginTop: 4, opacity: .9 }}>{clean(item.subtitle)}</small></span></Link>)}</div></section>;
}

export function HomeOfferBanner({ section }: { section: any }) {
  const content = section?.content || {};
  if (!content.image_url && !content.title && !content.subtitle) return null;
  const cta = content.cta || {};
  return <section className="home-api-offer-banner" style={{ padding: '28px 0 38px' }}><div style={{ width: 'min(1320px, calc(100% - 48px))', margin: '0 auto', position: 'relative', overflow: 'hidden', borderRadius: 8, minHeight: 310, background: '#fff0f4' }}><picture><source media="(max-width:760px)" srcSet={content.mobile_image_url || content.image_url || ''}/><img src={content.image_url || '/images/product-placeholder.svg'} alt={clean(content.title)} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}/></picture><div className="home-api-offer-copy" style={{ position: 'relative', zIndex: 1, minHeight: 310, padding: '55px 42px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(90deg, rgba(255,245,247,.98), rgba(255,245,247,.72), transparent)' }}><span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.8, color: '#8d1d4e' }}>{clean(content.eyebrow)}</span><h2 style={{ margin: '8px 0', fontSize: 32 }}>{clean(content.title)}</h2><p style={{ margin: '0 0 18px', color: '#686b78', fontSize: 13 }}>{clean(content.subtitle)}</p>{cta.label && <Link className="button dark-button" href={link(cta.href)}>{clean(cta.label)} →</Link>}</div></div></section>;
}

export function HomeFlashSale({ section, products }: { section: any; products: Product[] }) {
  const sale = section?.content?.sale || {};
  const endsAt = sale.ends_at || null;
  const [remaining, setRemaining] = useState(() => endsAt ? Math.max(0, new Date(endsAt).getTime() - Date.now()) : 0);
  useEffect(() => { if (!endsAt) return; const id = window.setInterval(() => setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now())), 1000); return () => window.clearInterval(id); }, [endsAt]);
  const time = useMemo(() => { const s = Math.floor(remaining / 1000); return `${String(Math.floor(s / 86400)).padStart(2,'0')}d ${String(Math.floor((s % 86400) / 3600)).padStart(2,'0')}h ${String(Math.floor((s % 3600) / 60)).padStart(2,'0')}m ${String(s % 60).padStart(2,'0')}s`; }, [remaining]);
  const cta = section?.content?.cta || {};
  return <section className="home-flash-sale" style={{ padding: '30px 0 38px', background: '#fff' }}><Head title={section.title} subtitle={section.subtitle} href={cta.href ? link(cta.href) : undefined} label={cta.label || 'View All'} /><div style={{ width: 'min(1320px, calc(100% - 48px))', margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{sale.show_countdown && endsAt ? <span style={{ fontSize: 11, fontWeight: 800, color: '#8d1d4e', letterSpacing: .7 }}>ENDS IN {remaining ? time : 'ENDED'}</span> : <span/>}<span style={{ fontSize: 10, color: '#686b78' }}>{products.length} styles</span></div>{products.length ? <div className="home-product-grid" style={{ width: 'min(1320px, calc(100% - 48px))', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 16 }}>{products.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div style={{ width: 'min(1320px, calc(100% - 48px))', margin: '0 auto', padding: 30, textAlign: 'center', background: '#fff7f9', borderRadius: 8, color: '#686b78', fontSize: 12 }}>No discounted styles are available right now.</div>}</section>;
}

export function HomeReviews({ section, reviews }: { section: any; reviews: ReviewItem[] }) {
  return <section className="home-api-reviews" style={{ padding: '38px 0 34px', background: '#fafafa' }}><Head title={section.title} subtitle={section.subtitle} />{reviews.length ? <div style={{ width: 'min(1320px, calc(100% - 48px))', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }} className="home-review-grid">{reviews.slice(0,10).map((review) => <article key={review.id} style={{ background:'#fff', border:'1px solid #eee', borderRadius:8, padding:18 }}><div style={{ letterSpacing: 2, fontSize: 12 }}>{'★'.repeat(Math.max(0,Math.min(5,Math.round(review.rating))))}</div><p style={{ fontSize: 13, lineHeight: 1.6, color:'#444', minHeight: 62 }}>“{clean(review.text)}”</p><strong style={{ fontSize: 11 }}>{clean(review.customer || 'Priyasa customer')}</strong>{review.product && <small style={{ display:'block', marginTop:5, color:'#686b78' }}>{clean(review.product)}</small>}</article>)}</div> : <div style={{ width:'min(1320px, calc(100% - 48px))', margin:'0 auto', padding:28, textAlign:'center', background:'#fff', border:'1px solid #eee', borderRadius:8, color:'#686b78', fontSize:12 }}>Be the first to share your Priyasa experience.</div>}</section>;
}
