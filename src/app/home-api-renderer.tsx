import Link from 'next/link';
import { getProductsForHomeSection, getBestSellers, getSaleProducts } from '@/lib/storefront-data';
import { getHomeReviewItems } from '@/lib/home-section-data';
import HomeHeroCarousel from '@/components/HomeHeroCarousel';
import HomeImageCarousel from '@/components/HomeImageCarousel';
import HomeProductGrid, { HomeProductGridStyles } from '@/components/HomeProductGrid';
import HomeDynamicSection from '@/components/HomeDynamicSection';
import {
  HomeServiceStrip,
  HomeEditorialGrid,
  HomeFlashSale,
  HomeOfferBanner,
  HomeReviews,
} from '@/components/HomeApiAdvancedSections';

type Section = {
  id: string | number;
  key?: string;
  type?: string;
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string;
  mobileImageUrl?: string;
  ctaHref?: string;
  ctaLabel?: string;
  sortOrder?: number;
  sort_order?: number;
  isActive?: boolean;
  is_active?: boolean;
  content?: Record<string, any>;
  items?: any[];
  html?: string;
  query?: Record<string, any>;
  template?: string;
};

const text = (value: unknown) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const type = (section: Section) =>
  String(section.type || section.key || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');

const href = (value: unknown) => {
  const valueString = String(value ?? '').trim();
  if (!valueString) return null;
  return valueString.startsWith('/') || valueString.startsWith('http://') || valueString.startsWith('https://')
    ? valueString
    : `/${valueString}`;
};

const content = (section: Section) =>
  section.content && !Array.isArray(section.content) ? section.content : {};

const items = (section: Section) => {
  if (Array.isArray(section.items)) return section.items;
  if (Array.isArray(content(section).items)) return content(section).items;
  if (Array.isArray(content(section).blocks)) return content(section).blocks;
  return [];
};

const query = (section: Section) => {
  if (section.query && typeof section.query === 'object') return section.query;
  if (content(section).query && typeof content(section).query === 'object') return content(section).query;
  return {};
};

const display = (section: Section) =>
  content(section).display && typeof content(section).display === 'object'
    ? content(section).display
    : {};

const image = (item: any) =>
  item?.image_url || item?.imageUrl || item?.image || item?.media?.url || '';

const title = (item: any) => text(item?.title || item?.name || '');
const sub = (item: any) => text(item?.subtitle || item?.description || '');

const cta = (item: any) => ({
  label: text(item?.cta_label || item?.ctaLabel || item?.cta?.label || ''),
  href: href(item?.cta_href || item?.ctaHref || item?.cta?.href),
});

const sectionCta = (section: Section) => ({
  label: text(section.ctaLabel || content(section).cta?.label || ''),
  href: href(section.ctaHref || content(section).cta?.href),
});

const productQuery = (section: Section) => {
  const q = query(section);
  return {
    sort: typeof q.sort === 'string' ? q.sort : undefined,
    in_stock: typeof q.in_stock === 'boolean' ? q.in_stock : undefined,
    sale_only: typeof q.sale_only === 'boolean' ? q.sale_only : undefined,
    brand: typeof q.brand === 'string' ? q.brand : undefined,
    collection: typeof q.collection === 'string' ? q.collection : undefined,
    categorySlug: typeof q.category === 'string' ? q.category : undefined,
  };
};

function SectionHeading({
  section,
  viewHref,
  viewLabel = 'View All',
}: {
  section: Section;
  viewHref?: string | null;
  viewLabel?: string;
}) {
  const heading = text(section.title);
  const subtitle = text(section.subtitle);
  if (!heading && !subtitle && !viewHref) return null;

  return (
    <div className="home-section-head">
      <div>
        {heading && <h2>{heading}</h2>}
        {subtitle && <p>{subtitle}</p>}
      </div>
      {viewHref && (
        <Link className="home-view-all" href={viewHref}>
          {viewLabel} <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}

function slides(section: Section) {
  return items(section)
    .map((item: any, index: number) => {
      const action = cta(item);
      return {
        id: String(item?.id ?? `${section.id}-${index}`),
        eyebrow: text(item?.eyebrow || content(section).eyebrow || ''),
        title: title(item) || text(section.title),
        subtitle: sub(item) || text(section.subtitle),
        imageUrl: image(item) || section.imageUrl,
        mobileImageUrl:
          item?.mobile_image_url ||
          item?.mobileImageUrl ||
          section.mobileImageUrl ||
          image(item) ||
          section.imageUrl,
        ctaLabel: action.label || text(section.ctaLabel),
        ctaHref: action.href || href(section.ctaHref),
      };
    })
    .filter((item: any) => item.imageUrl);
}

async function Products({
  section,
  forceType,
  variant,
}: {
  section: Section;
  forceType?: string;
  variant?: 'load-more' | 'carousel';
}) {
  const sectionType = forceType || type(section);
  const sectionQuery = query(section);
  const requestedLimit = Math.min(
    Math.max(Number(sectionQuery.limit ?? 8) || 8, 1),
    30,
  );
  const isLoadMore =
    variant === 'load-more' || (!variant && sectionType === 'product_grid');
  const fetchLimit = isLoadMore
    ? Math.min(30, Math.max(requestedLimit, 24))
    : requestedLimit;
  const products = await getProductsForHomeSection(
    sectionType,
    fetchLimit,
    productQuery(section),
  );
  const action = sectionCta(section);
  const view = display(section);

  if (!products.length) {
    return (
      <section
        className={`home-section home-product-section ${
          isLoadMore
            ? 'home-product-section--load-more'
            : 'home-product-section--carousel'
        }`}
      >
        <SectionHeading
          section={section}
          viewHref={action.href}
          viewLabel={action.label || 'View All'}
        />
        <div className="home-empty-products">
          No styles are available in this section right now.
        </div>
      </section>
    );
  }

  return (
    <section
      className={`home-section home-product-section ${
        isLoadMore
          ? 'home-product-section--load-more home-new-arrivals'
          : 'home-product-section--carousel home-trending'
      }`}
    >
      <SectionHeading
        section={section}
        viewHref={action.href}
        viewLabel={action.label || 'View All'}
      />
      <HomeProductGrid
        products={products}
        initialVisible={requestedLimit}
        step={Number(view.load_more_step) || requestedLimit}
        variant={isLoadMore ? 'load-more' : 'carousel'}
        display={view}
        ariaLabel={text(section.title) || 'Product carousel'}
      />
    </section>
  );
}

function Categories({ section }: { section: Section }) {
  const values = items(section).filter((item: any) => title(item) || image(item));
  if (!values.length) return null;
  const action = sectionCta(section);

  return (
    <section className="home-section home-category-section">
      <SectionHeading
        section={section}
        viewHref={action.href}
        viewLabel={action.label || 'View All'}
      />
      <div className="category-grid category-grid-editorial home-category-tiles">
        {values.map((item: any, index: number) => {
          const itemAction = cta(item);
          const cardHref =
            itemAction.href ||
            href(item?.href || item?.cta_href || item?.ctaHref);
          const body = (
            <>
              <div className="category-image">
                {image(item) && (
                  <img src={image(item)} alt="" loading="lazy" />
                )}
              </div>
              <div className="category-label">
                <strong>{title(item)}</strong>
                {sub(item) && <span>{sub(item)}</span>}
                {itemAction.label && <span>{itemAction.label} →</span>}
              </div>
            </>
          );

          return cardHref ? (
            <Link
              className="category-card"
              key={String(item?.id ?? `${section.id}-${index}`)}
              href={cardHref}
            >
              {body}
            </Link>
          ) : (
            <article
              className="category-card"
              key={String(item?.id ?? `${section.id}-${index}`)}
            >
              {body}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Offer({ section }: { section: Section }) {
  const values = items(section);
  const item = values[0];
  const itemAction = cta(item || {});
  const offer = sectionCta(section);
  const offerHref = offer.href || itemAction.href;
  const offerLabel = offer.label || itemAction.label;

  if (!item && !text(section.title) && !text(section.subtitle)) return null;

  return (
    <section className="home-section home-api-offer">
      <div className="home-api-offer-inner">
        <div className="home-api-offer-copy">
          {text(section.title) && (
            <span className="home-offer-kicker">{text(section.title)}</span>
          )}
          {text(section.subtitle) && <h2>{text(section.subtitle)}</h2>}
          {values.map(
            (value: any, index: number) =>
              sub(value) && <p key={String(value?.id ?? index)}>{sub(value)}</p>,
          )}
          {item?.title && text(item.title) !== text(section.title) && (
            <strong>{text(item.title)}</strong>
          )}
          {offerHref && offerLabel && (
            <Link className="button dark-button" href={offerHref}>
              {offerLabel} →
            </Link>
          )}
        </div>
        {item && image(item) && (
          <div className="home-api-offer-image">
            <img
              src={image(item)}
              alt={title(item) || text(section.title)}
              loading="lazy"
            />
          </div>
        )}
      </div>
    </section>
  );
}

function Banner({ section }: { section: Section }) {
  const item = items(section)[0];
  const imageUrl = section.imageUrl || image(item) || content(section).image_url;
  const mobileImage =
    section.mobileImageUrl ||
    item?.mobile_image_url ||
    item?.mobileImageUrl ||
    content(section).mobile_image_url ||
    imageUrl;
  const action = sectionCta(section);

  if (!text(section.title) && !text(section.subtitle) && !imageUrl) return null;

  return (
    <section
      className={`home-section home-api-banner ${
        imageUrl ? 'home-api-banner--image' : 'home-api-banner--text-only'
      }`}
    >
      <div className="home-api-banner-copy">
        {text(section.title) && <h2>{text(section.title)}</h2>}
        {text(section.subtitle) && <p>{text(section.subtitle)}</p>}
        {action.href && action.label && (
          <Link className="button dark-button" href={action.href}>
            {action.label} →
          </Link>
        )}
      </div>
      {imageUrl && (
        <picture className="home-api-banner-media">
          {mobileImage && (
            <source media="(max-width:760px)" srcSet={mobileImage} />
          )}
          <img
            src={imageUrl}
            alt={text(section.title)}
            loading="lazy"
          />
        </picture>
      )}
    </section>
  );
}

function TextSection({ section }: { section: Section }) {
  const body = text(section.html || content(section).html);
  if (!body && !text(section.title) && !text(section.subtitle)) return null;

  return (
    <section className="home-section home-api-text">
      {text(section.title) && <h2>{text(section.title)}</h2>}
      {text(section.subtitle) && (
        <p className="home-api-text-subtitle">{text(section.subtitle)}</p>
      )}
      {body && <p>{body}</p>}
    </section>
  );
}

export async function renderHomeSections(sections: Section[]) {
  const active = sections
    .filter(
      (section) =>
        section &&
        section.id != null &&
        (section.type || section.key) &&
        section.isActive !== false &&
        section.is_active !== false,
    )
    .sort(
      (a, b) =>
        Number(a.sort_order ?? a.sortOrder ?? 0) -
          Number(b.sort_order ?? b.sortOrder ?? 0) ||
        String(a.id).localeCompare(String(b.id), undefined, { numeric: true }),
    );

  const output: React.ReactNode[] = [
    <HomeProductGridStyles key="home-product-grid-styles" />,
  ];

  for (const section of active) {
    const sectionType = type(section);
    const cfg = content(section);
    const sectionQuery = query(section);
    const view = display(section);

    if (
      sectionType === 'hero_slider' ||
      sectionType === 'hero' ||
      sectionType === 'hero-slide'
    ) {
      const heroSlides = slides(section);
      if (heroSlides.length) {
        output.push(
          <section className="home-section home-hero-multi" key={String(section.id)}>
            <HomeHeroCarousel
              slides={heroSlides}
              autoplay={cfg.autoplay !== false}
              intervalMs={Math.max(
                2500,
                Number(cfg.interval_ms ?? cfg.intervalMs ?? 4500) || 4500,
              )}
            />
          </section>,
        );
      }
      continue;
    }

    if (
      sectionType === 'service_strip' ||
      sectionType === 'service-strip' ||
      sectionType === 'promises'
    ) {
      output.push(
        <HomeServiceStrip key={String(section.id)} items={items(section)} />,
      );
      continue;
    }

    if (
      sectionType === 'product_carousel' ||
      sectionType === 'products-carousel'
    ) {
      const sort = String(sectionQuery.sort || '').toLowerCase();
      const force = ['popular', 'best', 'bestsellers', 'trending'].includes(sort)
        ? 'best-sellers'
        : ['sale', 'discount'].includes(sort)
          ? 'sale'
          : 'latest';
      output.push(
        <Products
          key={String(section.id)}
          section={section}
          forceType={force}
          variant="carousel"
        />,
      );
      continue;
    }

    if (sectionType === 'product_grid' || sectionType === 'products-grid') {
      output.push(
        <Products
          key={String(section.id)}
          section={section}
          forceType="latest"
          variant="load-more"
        />,
      );
      continue;
    }

    if (sectionType === 'flash_sale' || sectionType === 'flash-sale') {
      const products = await getSaleProducts(
        Math.min(30, Number(sectionQuery.limit) || 12),
        ['discount', 'sale'].includes(String(sectionQuery.sort || '').toLowerCase())
          ? String(sectionQuery.sort)
          : 'discount',
        productQuery(section),
      );
      output.push(
        <HomeFlashSale
          key={String(section.id)}
          section={section}
          products={products}
        />,
      );
      continue;
    }

    if (sectionType === 'editorial_grid' || sectionType === 'editorial-grid') {
      output.push(<HomeEditorialGrid key={String(section.id)} section={section} />);
      continue;
    }

    if (sectionType === 'offer_banner' || sectionType === 'offer-banner') {
      output.push(<HomeOfferBanner key={String(section.id)} section={section} />);
      continue;
    }

    if (sectionType === 'best_sellers' || sectionType === 'best-sellers') {
      output.push(
        <Products
          key={String(section.id)}
          section={section}
          forceType="best-sellers"
          variant="carousel"
        />,
      );
      continue;
    }

    if (
      sectionType === 'personalized_products' ||
      sectionType === 'personalized-products'
    ) {
      const products = await getBestSellers(
        Math.min(30, Number(sectionQuery.limit) || 12),
        String(sectionQuery.fallback_sort || 'popular'),
        productQuery(section),
      );
      output.push(
        <section
          className="home-section home-product-section home-product-section--carousel"
          key={String(section.id)}
        >
          <SectionHeading section={section} />
          <HomeProductGrid
            products={products}
            variant="carousel"
            display={view}
            ariaLabel={text(section.title) || 'Recommended products'}
          />
        </section>,
      );
      continue;
    }

    if (
      sectionType === 'review_carousel' ||
      sectionType === 'review-carousel'
    ) {
      output.push(
        <HomeReviews
          key={String(section.id)}
          section={section}
          reviews={await getHomeReviewItems(Math.min(10, Number(cfg.limit) || 10))}
        />,
      );
      continue;
    }

    if (['image-carousel', 'image-slide', 'carousel'].includes(sectionType)) {
      const imageSlides = slides(section);
      if (imageSlides.length) {
        output.push(
          <section
            className="home-section home-image-highlight-section"
            key={String(section.id)}
          >
            <HomeImageCarousel slides={imageSlides} display={view} />
          </section>,
        );
      }
      continue;
    }

    if (sectionType === 'category_grid' || sectionType === 'category-grid') {
      output.push(<Categories key={String(section.id)} section={section} />);
      continue;
    }

    if (sectionType === 'offer' || sectionType === 'promo') {
      output.push(<Offer key={String(section.id)} section={section} />);
      continue;
    }

    if (
      ['banner', 'image-banner', 'image_banner', 'collection-banner', 'feature'].includes(
        sectionType,
      )
    ) {
      output.push(<Banner key={String(section.id)} section={section} />);
      continue;
    }

    if (sectionType === 'text') {
      output.push(<TextSection key={String(section.id)} section={section} />);
      continue;
    }

    // Unknown/future CMS presentation types remain visible through the generic schema-driven renderer.
    output.push(<HomeDynamicSection key={String(section.id)} section={section} />);
  }

  return output;
}
