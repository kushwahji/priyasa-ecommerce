import Link from 'next/link';
import { getActiveCms, getStorefrontCategories } from '@/lib/storefront-data';
import { SearchIcon, BagIcon, GiftIcon } from '@/components/StorefrontIcons';

export const dynamic = 'force-dynamic';

export default async function Offers() {
  const [categories, hero] = await Promise.all([
    getStorefrontCategories(),
    getActiveCms('offers.hero'),
  ]);

  return (
    <div className="offers-page offers-page-v1">
      <div className="offers-mobile-head">
        <Link className="back" href="/" aria-label="Back">‹</Link>
        <h1>Offers</h1>
        <div className="actions">
          <Link href="/search" aria-label="Search"><SearchIcon /></Link>
          <Link href="/cart" aria-label="Bag"><BagIcon /></Link>
        </div>
      </div>
      <div className="offers-breadcrumb"><Link href="/">Home</Link><span> / </span>Offers</div>
      <section
        className="offers-hero"
        style={hero?.imageUrl ? {
          backgroundImage: `linear-gradient(90deg,rgba(255,240,243,.96),rgba(255,223,229,.7)),url(${hero.imageUrl})`,
          backgroundSize: 'cover',
        } : {}}
      >
        <div>
          <span className="eyebrow">{hero?.type || 'PRIYASA OFFERS'}</span>
          <h1>{hero?.title || 'Special Offers'}</h1>
          <p>{hero?.subtitle || 'Explore the latest Priyasa catalogue and campaign offers.'}</p>
          {hero?.ctaHref && <Link className="button" href={hero.ctaHref}>{hero.ctaLabel || 'Shop Now'} →</Link>}
        </div>
      </section>
      <div className="offer-tabs">
        <Link className="active" href="/offers">All Offers</Link>
        {categories.map((category) => <Link key={category.id} href={`/category/${category.slug}`}>{category.name}</Link>)}
      </div>
      <section className="offer-list">
        <article className="offer-row">
          <div className="offer-row-image"><GiftIcon /></div>
          <div>
            <span className="eyebrow">SHOP NOW</span>
            <h2>Discover Priyasa offers</h2>
            <p>Browse live catalogue campaigns and eligible products from the storefront.</p>
          </div>
          <Link className="button" href="/shop">Shop Now →</Link>
        </article>
        <div className="empty-shop">
          <h3>More offers coming soon</h3>
          <p>Discount eligibility and coupon rules are managed by Priyasa Core at checkout.</p>
        </div>
      </section>
      <section className="offer-benefits">
        <div><b>✓</b><span><strong>Easy Returns</strong><small>On eligible products</small></span></div>
        <div><b>✓</b><span><strong>Secure Payment</strong><small>Protected checkout</small></span></div>
        <div><b>✓</b><span><strong>Fast Delivery</strong><small>Across India</small></span></div>
      </section>
    </div>
  );
}
