import Link from 'next/link';
import { getProductsForHomeSection } from '@/lib/storefront-data';
import HomeHeroCarousel from '@/components/HomeHeroCarousel';
import HomeImageCarousel from '@/components/HomeImageCarousel';
import HomeProductGrid from '@/components/HomeProductGrid';

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
};

const text = (value: unknown) => String(value ?? '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();
const type = (section: Section) => String(section.type || section.key || '').toLowerCase().trim();
const href = (value: unknown) => {
  const valueString = String(value ?? '').trim();
  return valueString && (valueString.startsWith('/') || valueString.startsWith('http://') || valueString.startsWith('https://'))
    ? valueString
    : valueString ? `/${valueString}` : null;
};
const items = (section: Section) => Array.isArray(section.items) ? section.items : Array.isArray(section.content?.items) ? section.content.items : [];
const query = (section: Section) => section.query && typeof section.query === 'object'
  ? section.query
  : section.content?.query && typeof section.content.query === 'object' ? section.content.query : {};
const image = (item: any) => item?.image_url || item?.imageUrl || item?.image || item?.media?.url || '';
const title = (item: any) => text(item?.title || item?.name || '');
const sub = (item: any) => text(item?.subtitle || item?.description || '');
const cta = (item: any) => ({ label: text(item?.cta_label || item?.ctaLabel || ''), href: href(item?.cta_href || item?.ctaHref) });

function SectionHeading({ section, viewHref, viewLabel = 'View All' }: { section: Section; viewHref?: string | null; viewLabel?: string }) {
  const heading = text(section.title);
  const subtitle = text(section.subtitle);
  if (!heading && !subtitle && !viewHref) return null;
  return (
    <div className="home-section-head">
      <div>
        {heading && <h2>{heading}</h2>}
        {subtitle && <p>{subtitle}</p>}
      </div>
      {viewHref && <Link className="home-view-all" href={viewHref}>{viewLabel} <span aria-hidden="true">→</span></Link>}
    </div>
  );
}

function slides(section: Section) {
  return items(section).map((item: any, index: number) => {
    const action = cta(item);
    return {
      id: String(item?.id ?? `${section.id}-${index}`),
      title: title(item) || text(section.title),
      subtitle: sub(item) || text(section.subtitle),
      imageUrl: image(item) || section.imageUrl,
      mobileImageUrl: item?.mobile_image_url || item?.mobileImageUrl || section.mobileImageUrl || image(item) || section.imageUrl,
      ctaLabel: action.label || text(section.ctaLabel),
      ctaHref: action.href || href(section.ctaHref),
    };
  }).filter((item: any) => item.imageUrl);
}

async function Products({ section }: { section: Section }) {
  const sectionType = type(section);
  const sectionQuery = query(section);
  const requestedLimit = Math.min(Math.max(Number(sectionQuery.limit ?? 8) || 8, 1), 30);
  const isLoadMore = sectionType === 'new_arrivals' || sectionType === 'new-arrivals' || sectionType === 'latest' || sectionType === 'products-latest';
  const productType = isLoadMore ? 'latest' : sectionType;
  const fetchLimit = isLoadMore ? Math.min(30, Math.max(requestedLimit, 24)) : requestedLimit;
  const products = await getProductsForHomeSection(productType, fetchLimit, {
    sort: typeof sectionQuery.sort === 'string' ? sectionQuery.sort : undefined,
  });
  if (!products.length) return null;

  const viewHref = href(section.ctaHref);
  return (
    <section className={`home-section home-product-section ${isLoadMore ? 'home-product-section--load-more home-new-arrivals' : 'home-product-section--carousel home-trending'}`}>
      <SectionHeading section={section} viewHref={viewHref} />
      <HomeProductGrid products={products} initialVisible={requestedLimit} step={requestedLimit} variant={isLoadMore ? 'load-more' : 'carousel'} />
    </section>
  );
}

function Categories({ section }: { section: Section }) {
  const categoryItems = items(section).filter((item: any) => title(item) || image(item));
  if (!categoryItems.length) return null;
  return (
    <section className="home-section home-category-section">
      <SectionHeading section={section} viewHref={href(section.ctaHref)} />
      <div className="category-grid category-grid-editorial home-category-tiles">
        {categoryItems.map((item: any, index: number) => {
          const action = cta(item);
          const cardHref = action.href || href(item?.cta_href || item?.ctaHref);
          const content = (
            <>
              <div className="category-image">
                {image(item) && <img src={image(item)} alt="" loading="lazy" />}
              </div>
              <div className="category-label">
                <strong>{title(item)}</strong>
                {action.label && <span>{action.label} <span aria-hidden="true">→</span></span>}
              </div>
            </>
          );
          return cardHref
            ? <Link className="category-card" key={String(item?.id ?? `${section.id}-${index}`)} href={cardHref}>{content}</Link>
            : <article className="category-card" key={String(item?.id ?? `${section.id}-${index}`)}>{content}</article>;
        })}
      </div>
    </section>
  );
}

function Offer({ section }: { section: Section }) {
  const offerItems = items(section);
  const item = offerItems[0];
  const action = cta(item || {});
  const offerHref = href(section.ctaHref) || action.href;
  const offerLabel = text(section.ctaLabel) || action.label;
  if (!item && !text(section.title) && !text(section.subtitle)) return null;
  return (
    <section className="home-section home-api-offer">
      <div className="home-api-offer-inner">
        <div className="home-api-offer-copy">
          {text(section.title) && <span className="home-offer-kicker">{text(section.title)}</span>}
          {text(section.subtitle) && <h2>{text(section.subtitle)}</h2>}
          {offerItems.map((value: any, index: number) => sub(value) && <p key={String(value?.id ?? index)}>{sub(value)}</p>)}
          {item?.title && text(item.title) !== text(section.title) && <strong>{text(item.title)}</strong>}
          {offerHref && offerLabel && <Link className="button dark-button" href={offerHref}>{offerLabel} <span aria-hidden="true">→</span></Link>}
        </div>
        {item && image(item) && <div className="home-api-offer-image"><img src={image(item)} alt={title(item) || text(section.title)} loading="lazy" /></div>}
      </div>
    </section>
  );
}

function Banner({ section }: { section: Section }) {
  const bannerItems = items(section);
  const item = bannerItems[0];
  const imageUrl = section.imageUrl || image(item);
  const mobileImage = section.mobileImageUrl || item?.mobile_image_url || item?.mobileImageUrl || imageUrl;
  if (!text(section.title) && !text(section.subtitle) && !imageUrl) return null;
  return (
    <section className={`home-section home-api-banner ${imageUrl ? 'home-api-banner--image' : 'home-api-banner--text-only'}`}>
      <div className="home-api-banner-copy">
        {text(section.title) && <h2>{text(section.title)}</h2>}
        {text(section.subtitle) && <p>{text(section.subtitle)}</p>}
        {href(section.ctaHref) && text(section.ctaLabel) && <Link className="button dark-button" href={href(section.ctaHref)!}>{text(section.ctaLabel)} <span aria-hidden="true">→</span></Link>}
      </div>
      {imageUrl && <picture className="home-api-banner-media">
        {mobileImage && <source media="(max-width:760px)" srcSet={mobileImage} />}
        <img src={imageUrl} alt={text(section.title)} loading="lazy" />
      </picture>}
    </section>
  );
}

function TextSection({ section }: { section: Section }) {
  const body = text(section.html || section.content?.html);
  if (!body && !text(section.title) && !text(section.subtitle)) return null;
  return (
    <section className="home-section home-api-text">
      {text(section.title) && <h2>{text(section.title)}</h2>}
      {text(section.subtitle) && <p className="home-api-text-subtitle">{text(section.subtitle)}</p>}
      {body && <p>{body}</p>}
      {href(section.ctaHref) && text(section.ctaLabel) && <Link className="home-view-all" href={href(section.ctaHref)!}>{text(section.ctaLabel)} →</Link>}
    </section>
  );
}

export async function renderHomeSections(sections: Section[]) {
  const active = sections
    .filter((section) => section && section.id != null && section.type && section.isActive !== false && section.is_active !== false)
    .sort((a, b) => Number(a.sort_order ?? a.sortOrder ?? 0) - Number(b.sort_order ?? b.sortOrder ?? 0));

  const output: React.ReactNode[] = [];
  for (const section of active) {
    const sectionType = type(section);
    if (sectionType === 'hero_slider' || sectionType === 'hero' || sectionType === 'hero-slide') {
      const heroSlides = slides(section);
      const heroContent = section.content && !Array.isArray(section.content) ? section.content : {};
      const autoplay = heroContent.autoplay !== false;
      const intervalMs = Math.max(2500, Number(heroContent.interval_ms ?? heroContent.intervalMs ?? 4500) || 4500);
      if (heroSlides.length) output.push(
        <section className="home-section home-hero-multi" key={String(section.id)}>
          <HomeHeroCarousel slides={heroSlides} autoplay={autoplay} intervalMs={intervalMs} />
        </section>
      );
      continue;
    }
    if (sectionType === 'image-carousel' || sectionType === 'image-slide' || sectionType === 'carousel') {
      const carouselSlides = slides(section);
      if (carouselSlides.length) output.push(<section className="home-section home-image-highlight-section" key={String(section.id)}><HomeImageCarousel slides={carouselSlides} /></section>);
      continue;
    }
    if (['new_arrivals', 'new-arrivals', 'products-latest', 'latest', 'latest-collection', 'trending', 'best-sellers', 'products-best', 'products-sale', 'sale'].includes(sectionType)) {
      output.push(<Products section={section} key={String(section.id)} />);
      continue;
    }
    if (sectionType === 'category_grid' || sectionType === 'category-grid') {
      output.push(<Categories section={section} key={String(section.id)} />);
      continue;
    }
    if (sectionType === 'offer' || sectionType === 'promo') {
      output.push(<Offer section={section} key={String(section.id)} />);
      continue;
    }
    if (['banner', 'image-banner', 'collection-banner', 'feature'].includes(sectionType)) {
      output.push(<Banner section={section} key={String(section.id)} />);
      continue;
    }
    if (sectionType === 'text') output.push(<TextSection section={section} key={String(section.id)} />);
  }
  return output;
}
