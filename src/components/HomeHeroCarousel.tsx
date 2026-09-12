'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Slide = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  mobileImageUrl?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
};

export default function HomeHeroCarousel({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  if (!slides.length) return null;

  const slide = slides[Math.min(active, slides.length - 1)];
  const next = () => setActive((value) => (value + 1) % slides.length);
  const prev = () => setActive((value) => (value - 1 + slides.length) % slides.length);
  const image = slide.imageUrl || '/images/product-placeholder.svg';
  const mobileImage = slide.mobileImageUrl || image;

  const touchStart = (event: React.TouchEvent) => {
    const touch = event.changedTouches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
  };

  const touchEnd = (event: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;
    startX.current = null;
    startY.current = null;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next(); else prev();
  };

  const imageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    if (img.dataset.fallback) return;
    img.dataset.fallback = '1';
    const picture = img.closest('picture');
    const source = picture?.querySelector('source');
    if (source) source.removeAttribute('srcset');
    img.src = '/images/product-placeholder.svg';
  };

  return (
    <section
      className="home-hero-carousel premium-home-hero"
      onTouchStart={touchStart}
      onTouchEnd={touchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Priyasa featured collections"
    >
      <div className="home-hero-media">
        <picture>
          <source media="(max-width:760px)" srcSet={mobileImage} />
          <img key={`${slide.id}-hero`} src={image} alt={slide.title || 'Priyasa collection'} className="home-hero-image" onError={imageError} />
        </picture>
        <div className="home-hero-shade" />
      </div>

      <div className="home-hero-copy">
        <span className="eyebrow">{slide.subtitle || 'PRIYASA COLLECTIONS'}</span>
        <h1>{slide.title || 'Discover your style'}</h1>
        {slide.subtitle && <p>{slide.subtitle}</p>}
        {slide.ctaHref && <Link className="button" href={slide.ctaHref}>{slide.ctaLabel || 'Shop Now'} <span aria-hidden="true">→</span></Link>}
      </div>

      {slides.length > 1 && (
        <>
          <button type="button" className="home-hero-control home-hero-prev" onClick={prev} aria-label="Previous slide">‹</button>
          <button type="button" className="home-hero-control home-hero-next" onClick={next} aria-label="Next slide">›</button>
          <div className="home-hero-dots" role="tablist" aria-label="Featured slides">
            {slides.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={index === active ? 'active' : ''}
                onClick={() => setActive(index)}
                role="tab"
                aria-label={`Go to slide ${index + 1}`}
                aria-selected={index === active}
              />
            ))}
          </div>
          <div className="hero-slide-meta" aria-live="polite">
            <span>{String(active + 1).padStart(2, '0')}</span><i /><span>{String(slides.length).padStart(2, '0')}</span>
          </div>
        </>
      )}
    </section>
  );
}
