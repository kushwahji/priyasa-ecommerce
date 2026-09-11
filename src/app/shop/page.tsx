import Link from 'next/link';
import { getCachedActiveCms, getCachedStorefrontCategories, getCachedStorefrontProducts } from '@/lib/storefront-cache';
import { ShopFilters } from '@/components/ShopFilters';
import { SearchIcon, BagIcon } from '@/components/StorefrontIcons';

export const revalidate = 120;

export default async function Shop() {
  const [products, categories, hero] = await Promise.all([
    getCachedStorefrontProducts(),
    getCachedStorefrontCategories(),
    getCachedActiveCms('shop.hero'),
  ]);

  return <div className="storefront-page shop-page-v1">
    <div className="plp-mobile-head">
      <Link className="back" href="/" aria-label="Back to home" />
      <h1>Shop</h1>
      <div className="actions"><Link href="/search" aria-label="Search"><SearchIcon /></Link><Link href="/cart" aria-label="Bag"><BagIcon /></Link></div>
    </div>
    {hero && <section className="plp-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(27,13,16,.76),rgba(27,13,16,.1)),url(${hero.imageUrl || ''})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="plp-hero-overlay"><span className="eyebrow">{hero.type}</span><h1>{hero.title}</h1>{hero.subtitle && <p>{hero.subtitle}</p>}{hero.ctaHref && <Link className="button" href={hero.ctaHref}>{hero.ctaLabel || 'Shop Now'} →</Link>}</div>
    </section>}
    <div className="page storefront-inner">
      <div className="breadcrumbs"><Link href="/">Home</Link> / Shop</div>
      <div className="collection-intro"><div><span className="eyebrow dark">THE PRIYASA EDIT</span><h1>All styles</h1></div><p>Explore the live collection.</p></div>
      <ShopFilters products={products} categories={categories.map(c => ({ name: c.name, slug: c.slug }))} />
    </div>
  </div>;
}
