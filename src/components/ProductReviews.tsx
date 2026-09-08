'use client';

import { useEffect, useState } from 'react';

type Review = {
  id: string;
  rating: number;
  title?: string | null;
  body: string;
  name: string;
  verifiedPurchase: boolean;
  createdAt: string;
  images: string[];
  helpful: number;
};

export default function ProductReviews({ productId }: { productId: string }) {
  const [rows, setRows] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        cache: 'no-store',
      });
      const data = await response.json();
      setRows(data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [productId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMsg('Submitting…');

    const urls = images
      .split(/\s*,\s*|\n/)
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 4);

    const response = await fetch(`/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, title, body, images: urls }),
    });
    const data = await response.json();
    setMsg(data.message || data.error || 'Unable to submit');

    if (response.ok) {
      setTitle('');
      setBody('');
      setImages('');
      await load();
    }
  }

  async function helpful(reviewId: string) {
    const response = await fetch(`/api/products/${reviewId}/reviews/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'helpful' }),
    });
    const data = await response.json();

    if (response.ok && data.ok) {
      setRows((current) =>
        current.map((review) =>
          review.id === reviewId
            ? { ...review, helpful: data.helpful }
            : review,
        ),
      );
    }
  }

  return (
    <div className="product-reviews-panel">
      <div className="review-summary">
        <div>
          <b className="review-score">
            {rows.length
              ? (rows.reduce((sum, review) => sum + review.rating, 0) / rows.length).toFixed(1)
              : '—'}
          </b>
          <div className="review-stars">★★★★★</div>
          <small>{rows.length} approved reviews</small>
        </div>

        <form className="review-form" onSubmit={submit}>
          <strong>Write a review</strong>
          <div className="review-star-input">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={value <= rating ? 'selected' : ''}
                onClick={() => setRating(value)}
                aria-label={`${value} stars`}
              >
                ★
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Review title (optional)"
            maxLength={120}
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Tell us about fit, quality and comfort…"
            minLength={10}
            maxLength={3000}
            required
          />
          <input
            value={images}
            onChange={(event) => setImages(event.target.value)}
            placeholder="Review image URLs, comma separated (optional)"
          />
          <button className="button" disabled={!body.trim()}>
            Submit review
          </button>
          {msg && <small>{msg}</small>}
          <em>Reviews require a delivered purchase and are published after moderation.</em>
        </form>
      </div>

      {loading ? (
        <p>Loading reviews…</p>
      ) : rows.length ? (
        <div className="review-list">
          {rows.map((review) => (
            <article className="review-item" key={review.id}>
              <div className="review-item-head">
                <strong>{review.name}</strong>
                {review.verifiedPurchase && (
                  <span className="verified-review">✓ Verified purchase</span>
                )}
                <small>{new Date(review.createdAt).toLocaleDateString('en-IN')}</small>
              </div>
              <div className="review-stars">
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </div>
              {review.title && <h4>{review.title}</h4>}
              <p>{review.body}</p>
              {review.images.length > 0 && (
                <div className="review-images">
                  {review.images.map((src, index) => (
                    <img
                      key={`${review.id}-${index}`}
                      src={src}
                      alt="Customer review"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
              <button
                className="review-helpful"
                onClick={() => helpful(review.id)}
              >
                Helpful · {review.helpful}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p>Be the first customer to share your experience.</p>
      )}
    </div>
  );
}
