'use client';

import { useRef, useState } from 'react';
import type { Product } from '@/lib/catalog';
import { ProductCard } from '@/components/ProductCard';

type Props = {
  products: Product[];
  initialVisible?: number;
  step?: number;
  variant?: 'load-more' | 'carousel';
};

export default function HomeProductGrid({ products, initialVisible = 8, step = 8, variant = 'load-more' }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(Math.min(initialVisible, products.length));

  if (!products.length) return null;

  if (variant === 'carousel') {
    const scroll = (direction: number) => {
      railRef.current?.scrollBy({ left: direction * Math.max(280, railRef.current.clientWidth * 0.78), behavior: 'smooth' });
    };

    return (
      <div className="home-product-carousel" aria-label="Product carousel">
        <div className="home-product-carousel-viewport" ref={railRef}>
          <div className="home-product-carousel-track">
            {products.map((product) => (
              <div className="home-product-carousel-item" key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
        {products.length > 4 && (
          <>
            <button type="button" className="home-product-carousel-control home-product-carousel-prev" onClick={() => scroll(-1)} aria-label="Previous products">‹</button>
            <button type="button" className="home-product-carousel-control home-product-carousel-next" onClick={() => scroll(1)} aria-label="Next products">›</button>
          </>
        )}
      </div>
    );
  }

  const shown = products.slice(0, visible);
  const remaining = products.length - visible;

  return (
    <>
      <div className="product-grid product-grid-editorial home-product-grid home-product-grid--load-more">
        {shown.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
      {remaining > 0 && (
        <div className="home-load-more">
          <button type="button" className="button button-light" onClick={() => setVisible((current) => Math.min(current + step, products.length))}>
            Load More <span>({remaining} more)</span> ↓
          </button>
          <small>Showing {visible} of {products.length} styles</small>
        </div>
      )}
    </>
  );
}
