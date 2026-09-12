'use client';

import Link from 'next/link';
import { DeliveryPincode } from '@/components/DeliveryPincode';
import ProductReviews from '@/components/ProductReviews';
import { ProductCard } from '@/components/ProductCard';
import RecommendationRail from '@/components/RecommendationRail';
import { money } from '@/lib/storefront-data';

type Variant = { id: string; color?: string; size?: string; price?: number; mrp?: number; stock?: number; sku?: string };
type Product = {
  id: string;
  name: string;
  category: string;
  categorySlug?: string;
  price: number;
  mrp: number;
  description: string;
  colors: string[];
  sizes: string[];
  fabric?: string;
  care?: string;
  rating?: number;
  reviewCount?: number;
  variants?: Variant[];
};

type Props = { product: Product; related: Product[] };

export default function ProductPdpDetails({ product, related }: Props) {
  const attributes = [
    ['Category', product.category],
    ['Fabric', product.fabric || 'See product description'],
    ['Colour', product.colors.length ? product.colors.join(', ') : 'As shown'],
    ['Available sizes', product.sizes.length ? product.sizes.join(', ') : 'See options above'],
    ['Care', product.care || 'Refer to care instructions on the product'],
    ['SKU', product.variants?.find((variant) => variant.sku)?.sku || 'Available at checkout'],
  ];

  const highlights = [
    { icon: '✦', label: product.fabric || 'Premium fabric' },
    { icon: '⌁', label: 'Comfort-first fit' },
    { icon: '◇', label: 'Made for every occasion' },
    { icon: '♢', label: 'Easy-care guidance' },
  ];

  return (
    <section className="pdp-details-stack" aria-label="Product details and services">
      <nav className="pdp-section-tabs" aria-label="Product sections">
        <a className="active" href="#details">Details</a>
        <a href="#reviews">Reviews</a>
        <a href="#qa">Q&A</a>
        <a href="#similar">Similar</a>
      </nav>

      <section id="details" className="pdp-detail-card pdp-highlights-card">
        <div className="pdp-card-heading"><h2>Highlights</h2><span>PRIYASA EDIT</span></div>
        <div className="pdp-highlights-grid">
          {highlights.map((item) => <div key={item.label} className="pdp-highlight-item"><b>{item.icon}</b><span>{item.label}</span></div>)}
        </div>
      </section>

      <section className="pdp-detail-card pdp-delivery-card">
        <div className="pdp-card-heading"><h2>Delivery &amp; Services</h2><span>FAST &amp; SECURE</span></div>
        <DeliveryPincode weightGrams={500} cod />
        <div className="pdp-service-list">
          <div><b>▣</b><span><strong>Cash on Delivery</strong><small>Eligibility is checked for your pincode.</small></span></div>
          <div><b>↩</b><span><strong>7 Days Easy Returns &amp; Exchange</strong><small>For eligible products under the current policy.</small></span></div>
          <div><b>✓</b><span><strong>100% Original Products</strong><small>Authentic products from PRIYASA.</small></span></div>
        </div>
      </section>

      <section className="pdp-detail-card pdp-offers-card">
        <div className="pdp-card-heading"><h2>Offers &amp; Bank Deals</h2><span>AT CHECKOUT</span></div>
        <div className="pdp-offer-row"><b>₹</b><span><strong>Payment offers</strong><small>Eligible bank, UPI and payment offers are applied at checkout.</small></span><em>›</em></div>
        <div className="pdp-offer-row"><b>↯</b><span><strong>Secure checkout</strong><small>Choose Razorpay-supported payment methods at checkout.</small></span><em>›</em></div>
      </section>

      <section className="pdp-detail-card pdp-attributes-card">
        <div className="pdp-card-heading"><h2>Product Details</h2><span>SPECIFICATIONS</span></div>
        <p className="pdp-description-copy">{product.description || 'Detailed product information will be shown here when supplied by the catalog.'}</p>
        <div className="pdp-attributes-table">
          {attributes.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
        </div>
      </section>

      <section className="pdp-accordion-list">
        <details open>
          <summary><span>Material &amp; Care</span><small>{product.care || 'View care guidance'}</small></summary>
          <div>{product.fabric && <p><strong>Fabric:</strong> {product.fabric}</p>}<p>{product.care || 'Please follow the care label supplied with the product.'}</p></div>
        </details>
        <details>
          <summary><span>Size &amp; Fit</span><small>{product.sizes.length ? product.sizes.join(' · ') : 'See available options'}</small></summary>
          <div><p>Select an available size and colour above. Variant stock is checked before adding the item to your bag.</p><Link href="/size-guide">Open Size Guide →</Link></div>
        </details>
        <details>
          <summary><span>Return &amp; Exchange</span><small>Easy returns</small></summary>
          <div><p>Return and exchange eligibility is determined by the current Priyasa policy for the ordered product.</p><Link href="/return-refund-policy">Read return policy →</Link></div>
        </details>
        <details id="qa">
          <summary><span>Q&amp;A</span><small>Product questions</small></summary>
          <div><p>Questions about this product can be raised through customer support. We will keep product answers tied to the catalog data.</p><Link href="/contact">Contact PRIYASA →</Link></div>
        </details>
      </section>

      <section id="reviews" className="pdp-detail-card pdp-reviews-card">
        <div className="pdp-card-heading"><h2>Customer Reviews</h2><span>{product.reviewCount ? `${product.rating?.toFixed(1) || '—'} / 5` : 'NO REVIEWS YET'}</span></div>
        <div className="pdp-review-topline">
          <div><strong>{product.reviewCount ? (product.rating || 0).toFixed(1) : '—'}</strong><span>★★★★★</span><small>{product.reviewCount || 0} approved reviews</small></div>
          <div className="pdp-rating-bars">
            {[5, 4, 3, 2, 1].map((star) => <div key={star}><span>{star} ★</span><i><b style={{ width: star === 5 && product.reviewCount ? '68%' : '18%' }} /></i></div>)}
          </div>
        </div>
        <ProductReviews productId={product.id} />
      </section>

      {related.length > 0 && <section id="similar" className="pdp-detail-card pdp-similar-card">
        <div className="pdp-card-heading"><h2>Similar Products</h2><Link href="/shop">See All →</Link></div>
        <div className="pdp-similar-grid">{related.slice(0, 4).map((item) => <ProductCard key={item.id} product={item} />)}</div>
      </section>}

      <RecommendationRail productId={product.id} title="Made to go with it" eyebrow="PRIYASA RECOMMENDS" subtitle="Similar styles and products customers often discover together." limit={8} excludeIds={[product.id, ...related.map((item) => item.id)]} />

      <div className="pdp-mobile-trust-strip">
        <span><b>↩</b><small>7 Days<br />Easy Returns</small></span>
        <span><b>✓</b><small>Premium<br />Quality</small></span>
        <span><b>▣</b><small>COD<br />Available</small></span>
        <span><b>⌖</b><small>Pan India<br />Delivery</small></span>
      </div>
    </section>
  );
}
