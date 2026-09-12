'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

type Slide = { id: string; title?: string | null; subtitle?: string | null; imageUrl?: string | null; mobileImageUrl?: string | null; ctaLabel?: string | null; ctaHref?: string | null };
type DisplayConfig = { desktopColumns?: number; tabletColumns?: number; mobileColumns?: number; desktop_cards?: number; tablet_cards?: number; mobile_cards?: number };

const columns = (value: unknown, fallback: number, max = 6) => { const n = Number(value); return Number.isFinite(n) && n >= 1 ? Math.min(max, Math.round(n)) : fallback; };

export default function HomeImageCarousel({ slides, display }: { slides: Slide[]; display?: DisplayConfig }) {
 const desktop = columns(display?.desktopColumns ?? display?.desktop_cards, 4);
 const tablet = columns(display?.tabletColumns ?? display?.tablet_cards, Math.min(3, desktop));
 const mobile = columns(display?.mobileColumns ?? display?.mobile_cards, 2, 4);
 const [perView, setPerView] = useState(desktop);
 const [page, setPage] = useState(0);
 const startX = useRef<number|null>(null); const startY = useRef<number|null>(null);
 useEffect(() => { const update = () => setPerView(window.matchMedia('(max-width:560px)').matches ? mobile : window.matchMedia('(max-width:900px)').matches ? tablet : desktop); update(); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update); }, [desktop, tablet, mobile]);
 const totalPages = Math.max(1, Math.ceil(slides.length / perView));
 useEffect(() => setPage((v) => Math.min(v, totalPages - 1)), [totalPages]);
 const visible = useMemo(() => { if (!slides.length) return []; const start = page * perView; return Array.from({ length: perView }, (_, i) => slides[(start + i) % slides.length]).filter(Boolean); }, [page, perView, slides]);
 if (!slides.length) return null;
 const next = () => setPage((v) => (v + 1) % totalPages); const prev = () => setPage((v) => (v - 1 + totalPages) % totalPages);
 const touchStart = (e: React.TouchEvent) => { const t = e.changedTouches[0]; startX.current = t.clientX; startY.current = t.clientY; };
 const touchEnd = (e: React.TouchEvent) => { if (startX.current === null || startY.current === null) return; const t = e.changedTouches[0], dx = t.clientX - startX.current, dy = t.clientY - startY.current; startX.current = null; startY.current = null; if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return; dx < 0 ? next() : prev(); };
 const imageError = (e: React.SyntheticEvent<HTMLImageElement>) => { const img = e.currentTarget; if (img.dataset.fallback) return; img.dataset.fallback = '1'; img.src = '/images/product-placeholder.svg'; };
 return <section className="campaign-carousel home-image-carousel home-image-carousel-grid" onTouchStart={touchStart} onTouchEnd={touchEnd} aria-roledescription="carousel" aria-label="Priyasa campaign collections" style={{ '--campaign-columns': perView } as React.CSSProperties}><div className="campaign-carousel-viewport"><div className="campaign-carousel-track">{visible.map((s, i) => <article className="campaign-carousel-card home-image-carousel-card" key={`${s.id}-${page}-${i}`}><Link href={s.ctaHref || '/shop'} className="campaign-carousel-link" aria-label={s.title || 'Explore Priyasa collection'}><picture className="campaign-carousel-picture"><source media="(max-width:560px)" srcSet={s.mobileImageUrl || s.imageUrl || '/images/product-placeholder.svg'}/><img className="campaign-carousel-image" src={s.imageUrl || '/images/product-placeholder.svg'} alt={s.title || 'Priyasa collection'} loading={i < 2 ? 'eager' : 'lazy'} onError={imageError}/></picture><div className="campaign-carousel-copy"><span>{s.subtitle || 'PRIYASA EDIT'}</span><strong>{s.title || 'Explore the edit'}</strong>{s.ctaLabel && <small>{s.ctaLabel} →</small>}</div></Link></article>)}</div></div>{totalPages > 1 && <><button type="button" className="campaign-carousel-control campaign-carousel-prev" onClick={prev} aria-label="Previous campaign page">‹</button><button type="button" className="campaign-carousel-control campaign-carousel-next" onClick={next} aria-label="Next campaign page">›</button></>}<div className="campaign-carousel-dots" role="tablist" aria-label="Campaign pages">{Array.from({ length: totalPages }, (_, i) => <button type="button" key={i} className={i === page ? 'active' : ''} onClick={() => setPage(i)} aria-label={`Show campaign page ${i + 1}`} aria-selected={i === page} role="tab"/>)}</div></section>;
}
