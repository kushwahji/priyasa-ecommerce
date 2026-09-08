import { getBestSellers, getHomeCms, getLatestLaunches, getProductsForHomeSection, getStorefrontCategories, getStorefrontProducts } from '@/lib/storefront-data';
import { ProductCard } from '@/components/ProductCard';
import HomeHeroCarousel from '@/components/HomeHeroCarousel';
import HomeImageCarousel from '@/components/HomeImageCarousel';
import HomeCmsSection from '@/components/HomeCmsSection';
import AffiliateHomeSection from '@/components/AffiliateHomeSection';
import { TruckIcon, ShieldIcon, ReturnIcon, GiftIcon } from '@/components/StorefrontIcons';

export const dynamic = 'force-dynamic';

const productSectionType = (type: string) => {
  const normalized = type.toLowerCase();
  return normalized.startsWith('products-') || ['latest', 'latest-collection', 'best-sellers', 'trending', 'sale'].includes(normalized);
};

const festivalSlug = (categories: any[]) =>
  categories.find((category) =>
    ['festival', 'festive', 'diwali', 'navratri', 'eid', 'wedding'].some((keyword) => category.slug.toLowerCase().includes(keyword)),
  )?.slug;

export default async function Home() {
  const [fallbackBest, categories, sections, latest, saleProducts] = await Promise.all([
    getBestSellers(8),
    getStorefrontCategories(),
    getHomeCms(),
    getLatestLaunches(8),
    getProductsForHomeSection('products-sale', 8),
  ]);

  const heroSlides = sections.filter((section) => ['hero', 'hero-slide'].includes(section.type.toLowerCase()));
  const imageSlides = sections.filter((section) => ['image-carousel', 'image-slide', 'carousel'].includes(section.type.toLowerCase()));
  const productSections = sections.filter((section) => productSectionType(section.type));
  const productSectionData = await Promise.all(
    productSections.map((section) => getProductsForHomeSection(section.type, 8)),
  );
  const promos = sections.filter((section) =>
    ['promo', 'banner', 'image-banner', 'collection-banner'].includes(section.type.toLowerCase()),
  );
  const features = sections.filter((section) => ['feature', 'lifestyle'].includes(section.type.toLowerCase()));
  const customSections = sections.filter((section) => ['category-grid', 'text'].includes(section.type.toLowerCase()));
  const hasCmsCategoryGrid = customSections.some((section) => section.type.toLowerCase() === 'category-grid');
  const hasCmsProducts = productSections.length > 0;
  const festival = festivalSlug(categories);
  const festivalProducts = festival
    ? await getStorefrontProducts({ categorySlug: festival, limit: 8 })
    : [];
  const heroProduct = latest[0];

  return (
    <>
      {heroSlides.length > 0 ? (
        <HomeHeroCarousel slides={heroSlides} />
      ) : heroProduct ? (
        <section
          className="hero hero-editorial hero-fallback"
          style={{
            backgroundImage: `linear-gradient(90deg,rgba(255,255,255,.96) 0%,rgba(255,255,255,.82) 42%,rgba(255,255,255,0) 72%),url(${heroProduct.image})`,
          }}
        >
          <div className="hero-copy">
            <span className="eyebrow">LATEST FROM PRIYASA</span>
            <h1>{heroProduct.name}</h1>
            <p>{heroProduct.description || 'Discover the latest style from the live Priyasa catalog.'}</p>
            <a className="button" href={`/product/${heroProduct.slug}`}>Shop This Style →</a>
          </div>
        </section>
      ) : null}

      {(heroSlides.length > 0 || heroProduct) && (
        <section className="trust-strip">
          <span><TruckIcon /><b>Free Shipping</b><small>On eligible orders</small></span>
          <i />
          <span><GiftIcon /><b>COD Available</b><small>At eligible pincodes</small></span>
          <i />
          <span><ReturnIcon /><b>Easy Returns</b><small>As per return policy</small></span>
          <i />
          <span><ShieldIcon /><b>Secure Payment</b><small>Protected checkout</small></span>
        </section>
      )}

      {!hasCmsCategoryGrid && categories.length > 0 && (
        <section className="section section-tight home-categories">
          <div className="section-head">
            <div>
              <span className="eyebrow dark">THE PRIYASA EDIT</span>
              <h2>Shop by Category</h2>
              <p className="section-subtitle">Find the mood, fit and style that feels like you.</p>
            </div>
            <a className="text-link" href="/shop">View All →</a>
          </div>
          <div className="category-grid category-grid-editorial">
            {categories.slice(0, 6).map((category) => (
              <a className="category-card" key={category.id} href={`/category/${category.slug}`}>
                <div className="category-image" style={{ backgroundImage: `url(${category.imageUrl || ''})` }} />
                <div className="category-label"><strong>{category.name}</strong><span>Shop Now →</span></div>
              </a>
            ))}
          </div>
        </section>
      )}

      {hasCmsProducts ? (
        productSections.map((section, index) => {
          const products = productSectionData[index] || [];
          if (!products.length) return null;
          return (
            <section className="section section-tight home-product-section" key={section.id}>
              <div className="section-head">
                <div>
                  <span className="eyebrow dark">{section.subtitle || 'PRIYASA EDIT'}</span>
                  <h2>{section.title || 'Curated for you'}</h2>
                </div>
                {section.ctaHref && <a className="text-link" href={section.ctaHref}>{section.ctaLabel || 'View All'} →</a>}
              </div>
              <div className="product-grid product-grid-editorial">
                {products.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            </section>
          );
        })
      ) : (
        <>
          {fallbackBest.length > 0 && (
            <section className="section section-tight home-product-section">
              <div className="section-head">
                <div>
                  <span className="eyebrow dark">MOST LOVED</span>
                  <h2>Best Sellers</h2>
                  <p className="section-subtitle">The styles Priyasa customers keep coming back for.</p>
                </div>
                <a className="text-link" href="/shop">View All →</a>
              </div>
              <div className="product-grid product-grid-editorial">
                {fallbackBest.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            </section>
          )}

          {latest.length > 0 && (
            <section className="section section-tight home-product-section">
              <div className="section-head">
                <div>
                  <span className="eyebrow dark">NEW IN</span>
                  <h2>Latest Collection</h2>
                  <p className="section-subtitle">Fresh styles from the live Priyasa catalog.</p>
                </div>
                <a className="text-link" href="/new-arrivals">View All →</a>
              </div>
              <div className="product-grid product-grid-editorial">
                {latest.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            </section>
          )}

          {festivalProducts.length > 0 && (
            <section className="section section-tight home-product-section">
              <div className="section-head">
                <div><span className="eyebrow dark">COLLECTION</span><h2>Festival Collection</h2></div>
                <a className="text-link" href={`/category/${festival}`}>Shop Collection →</a>
              </div>
              <div className="product-grid product-grid-editorial">
                {festivalProducts.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            </section>
          )}

          {saleProducts.length > 0 && (
            <section className="section section-tight home-product-section">
              <div className="section-head">
                <div><span className="eyebrow dark">SPECIAL EDIT</span><h2>Sale Favourites</h2></div>
                <a className="text-link" href="/offers">View Offers →</a>
              </div>
              <div className="product-grid product-grid-editorial">
                {saleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            </section>
          )}
        </>
      )}

      {imageSlides.length > 0 && <HomeImageCarousel slides={imageSlides} />}

      {promos.map((promo) => (
        <section className="split-banner" key={promo.id}>
          <div className="split-copy">
            <span className="eyebrow dark">{promo.type.replaceAll('-', ' ').toUpperCase()}</span>
            <h2>{promo.title || 'The Priyasa edit'}</h2>
            {promo.subtitle && <p>{promo.subtitle}</p>}
            {promo.ctaHref && <a className="button dark-button" href={promo.ctaHref}>{promo.ctaLabel || 'Shop Now'} →</a>}
          </div>
          <div className="split-image" style={{ backgroundImage: `url(${promo.imageUrl || ''})` }} />
        </section>
      ))}

      {features.length > 0 && (
        <section className="section section-tight">
          <div className="section-head">
            <div><span className="eyebrow dark">PRIYASA EDIT</span><h2>Style for Every You</h2></div>
          </div>
          <div className="feature-grid feature-grid-editorial">
            {features.map((feature) => (
              <a
                key={feature.id}
                href={feature.ctaHref || '/shop'}
                className="feature"
                style={{ backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.5)),url(${feature.imageUrl || ''})` }}
              >
                <span className="eyebrow">{feature.type.replaceAll('-', ' ')}</span>
                <h3>{feature.title || 'Explore the edit'}</h3>
                <span>{feature.ctaLabel || 'Shop Now'} →</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {customSections.map((section) => <HomeCmsSection key={section.id} section={section} />)}
      <AffiliateHomeSection />
    </>
  );
}
