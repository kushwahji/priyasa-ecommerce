'use client';

import Link from 'next/link';
import { useRef } from 'react';

const clean = (value: unknown) => String(value ?? '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const image = (value: any) => value?.image_url || value?.imageUrl || value?.image || value?.media?.url || '';
const href = (value: unknown) => {
  const v = String(value ?? '').trim();
  return v && (v.startsWith('/') || v.startsWith('http://') || v.startsWith('https://')) ? v : v ? `/${v}` : null;
};

function DynamicCard({ item, index }: { item: any; index: number }) {
  const title = clean(item?.title || item?.name || item?.label);
  const subtitle = clean(item?.subtitle || item?.description || item?.text);
  const src = image(item);
  const to = href(item?.href || item?.url || item?.cta?.href || item?.cta_href || item?.ctaHref);
  const body = (
    <>
      {src ? <div className="home-dynamic-card-media"><img src={src} alt={title} loading="lazy" /></div> : null}
      {(title || subtitle) ? <div className="home-dynamic-card-copy">
        {title ? <strong>{title}</strong> : null}
        {subtitle ? <span>{subtitle}</span> : null}
        {(item?.cta?.label || item?.cta_label || item?.ctaLabel) ? <small>{clean(item?.cta?.label || item?.cta_label || item?.ctaLabel)} →</small> : null}
      </div> : null}
    </>
  );
  return to ? <Link className="home-dynamic-card" href={to} key={String(item?.id ?? index)}>{body}</Link> : <article className="home-dynamic-card" key={String(item?.id ?? index)}>{body}</article>;
}

export default function HomeDynamicSection({ section }: { section: any }) {
  const content = section?.content && typeof section.content === 'object' && !Array.isArray(section.content) ? section.content : {};
  const values = Array.isArray(section?.items) ? section.items : Array.isArray(content.items) ? content.items : Array.isArray(content.blocks) ? content.blocks : [];
  const railRef = useRef<HTMLDivElement>(null);
  const display = content.display && typeof content.display === 'object' ? content.display : {};
  const columns = Math.max(1, Math.min(6, Number(display.desktop_columns ?? display.columns ?? content.columns ?? 4) || 4));
  const mobileColumns = Math.max(1, Math.min(3, Number(display.mobile_columns ?? content.mobile_columns ?? 2) || 2));
  const mobileScroll = display.mobile_scroll === true || content.mobile_scroll === true;
  const layout = String(content.layout || '').toLowerCase();
  const carousel = layout === 'carousel' || content.carousel === true || mobileScroll;
  const body = clean(content.text || content.description || section?.description || content.html);

  if (!values.length && !body && !clean(section?.title) && !clean(section?.subtitle)) return null;

  const scroll = (direction: number) => railRef.current?.scrollBy({ left: direction * Math.max(280, railRef.current.clientWidth * 0.78), behavior: 'smooth' });

  return (
    <section className={`home-section home-dynamic-section ${carousel ? 'home-dynamic-section--carousel' : ''}`} data-home-template={clean(section?.template || content.template || '') || undefined}>
      {(clean(section?.title) || clean(section?.subtitle)) && <div className="home-section-head"><div>{clean(section?.title) && <h2>{clean(section.title)}</h2>}{clean(section?.subtitle) && <p>{clean(section.subtitle)}</p>}</div>{href(section?.cta_href || section?.ctaHref || content?.cta?.href) && <Link className="home-view-all" href={href(section?.cta_href || section?.ctaHref || content?.cta?.href)!}>{clean(section?.cta_label || section?.ctaLabel || content?.cta?.label || 'View All')} →</Link>}</div>}
      {body && <div className="home-dynamic-copy"><p>{body}</p></div>}
      {values.length ? <div className="home-dynamic-rail-wrap">
        {carousel && values.length > columns ? <button type="button" className="home-dynamic-control home-dynamic-control--prev" onClick={() => scroll(-1)} aria-label="Previous">‹</button> : null}
        <div ref={railRef} className={`home-dynamic-grid ${carousel ? 'home-dynamic-grid--scroll' : ''}`} style={{ '--home-dynamic-columns': columns, '--home-dynamic-mobile-columns': mobileColumns } as React.CSSProperties}>
          {values.map((item: any, index: number) => <DynamicCard item={item} index={index} key={String(item?.id ?? index)} />)}
        </div>
        {carousel && values.length > columns ? <button type="button" className="home-dynamic-control home-dynamic-control--next" onClick={() => scroll(1)} aria-label="Next">›</button> : null}
      </div> : null}
    </section>
  );
}
