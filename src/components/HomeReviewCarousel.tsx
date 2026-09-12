'use client';
import { useRef } from 'react';

type Review = { id?: string|number; rating?: number|string; title?: string; text?: string; comment?: string; body?: string; author?: string; name?: string; verified?: boolean };

export default function HomeReviewCarousel({ items }: { items: Review[] }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!items.length) return null;
  const move = (amount: number) => ref.current?.scrollBy({ left: amount, behavior: 'smooth' });
  return (
    <section className="home-reviews home-section">
      <div className="home-section-head">
        <div><span className="home-kicker">Loved by shoppers</span><h2>What Our Customers Say</h2></div>
        <div className="home-review-controls"><button type="button" onClick={() => move(-360)} aria-label="Previous reviews">←</button><button type="button" onClick={() => move(360)} aria-label="Next reviews">→</button></div>
      </div>
      <div className="home-review-rail" ref={ref}>
        {items.map((review, index) => {
          const rating = Math.max(0, Math.min(5, Number(review.rating || 5)));
          return <article className="home-review-card" key={String(review.id ?? index)}>
            <div className="home-review-stars" aria-label={`${rating} out of 5 stars`}>{'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}</div>
            <h3>{review.title || 'Loved the quality'}</h3>
            <p>{review.text || review.comment || review.body || 'Beautiful fit, premium finish and a great shopping experience.'}</p>
            <strong>{review.author || review.name || 'Priyasa customer'}{review.verified !== false && <small> ✓ Verified</small>}</strong>
          </article>;
        })}
      </div>
    </section>
  );
}
