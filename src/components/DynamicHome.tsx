import Link from 'next/link';
import HomeHeroCarousel from '@/components/HomeHeroCarousel';
import HomeImageCarousel from '@/components/HomeImageCarousel';
import HomeProductGrid from '@/components/HomeProductGrid';
import {ProductCard} from '@/components/ProductCard';
import {getCachedStorefrontProducts} from '@/lib/storefront-cache';
import {getProductsForHomeSection} from '@/lib/storefront-data';
import type {HomeCmsSection} from '@/lib/storefront-data';
import {ReturnIcon,ShieldIcon,TruckIcon,GiftIcon} from '@/components/StorefrontIcons';

const clean=(v:any)=>String(v??'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim();
const typeOf=(s:any)=>String(s?.type||'').toLowerCase();
const img=(s:any)=>s?.imageUrl||s?.image_url||'';
const href=(s:any)=>s?.ctaHref||s?.cta_href||'/shop';
const label=(s:any)=>s?.ctaLabel||s?.cta_label||'Shop Now';
const itemsOf=(s:any)=>Array.isArray(s?.content?.items)?s.content.items:[];
const sortOf=(s:any)=>Number(s?.sortOrder??s?.sort_order??0);

function Heading({title,subtitle,href:to='/shop',label:cta='View All'}:{title:string;subtitle?:string;href?:string;label?:string}){
 return <div className="home-section-head"><div>{subtitle&&<span className="home-kicker">{clean(subtitle)}</span>}<h2>{clean(title)}</h2></div><Link className="home-view-all" href={to}>{clean(cta)} →</Link></div>;
}

function TrustStrip(){
 return <section className="home-service-promises home-managed-trust" aria-label="Priyasa service promises"><div className="home-service-promises-inner">
  <div className="home-service-promise"><ReturnIcon/><div><strong>7 Days Easy Return</strong><small>Simple & hassle-free</small></div></div>
  <div className="home-service-promise"><ShieldIcon/><div><strong>Premium Quality</strong><small>Made with care</small></div></div>
  <div className="home-service-promise"><GiftIcon/><div><strong>COD Available</strong><small>Pay when it arrives</small></div></div>
  <div className="home-service-promise"><TruckIcon/><div><strong>Pan India Delivery</strong><small>Across India</small></div></div>
 </div></section>;
}

function Hero({s}:{s:HomeCmsSection}){
 const items=itemsOf(s);const slides=(items.length?items:[s]).map((x:any,i:number)=>({id:String(x.id||`${s.id}-${i}`),title:x.title||s.title,subtitle:x.subtitle||s.subtitle,imageUrl:x.image_url||x.imageUrl||img(s),mobileImageUrl:x.mobile_image_url||x.mobileImageUrl||s.mobile_image_url||s.mobileImageUrl||img(s),ctaLabel:x.cta_label||x.ctaLabel||label(s),ctaHref:x.cta_href||x.ctaHref||href(s)}));
 return <section className="home-section home-hero-multi home-managed-hero" data-testid="home-hero"><HomeHeroCarousel slides={slides}/></section>;
}

function EditorialRail({items}:{items:any[]}){
 if(!items.length)return null;
 return <div className="home-editorial-rail">{items.slice(0,6).map((x:any,i:number)=><Link className="home-editorial-card" key={x.id||i} href={x.cta_href||x.ctaHref||'/shop'}>{(x.image_url||x.imageUrl)&&<img src={x.image_url||x.imageUrl} alt={clean(x.title||'Priyasa style')} loading={i<2?'eager':'lazy'}/>}<span>{clean(x.subtitle||'PRIYASA EDIT')}</span><strong>{clean(x.title||'Explore style')}</strong><b>{clean(x.cta_label||x.ctaLabel||'Shop Now')} →</b></Link>)}</div>;
}

function ProductRail({products}:{products:any[]}){
 if(!products.length)return null;
 return <div className="home-product-rail" data-testid="home-product-rail">{products.map(product=><div className="home-product-rail-item" key={product.id}><ProductCard product={product}/></div>)}</div>;
}

function OfferBanner({s}:{s:HomeCmsSection}){
 const source=img(s);if(!source)return null;
 return <section className="home-managed-banner"><div className="home-managed-banner-copy"><span>{clean(s.subtitle||'PRIYASA OFFER')}</span><h2>{clean(s.title||'Style That Speaks')}</h2><Link href={href(s)}>{label(s)} →</Link></div><picture>{(s.mobileImageUrl||s.mobile_image_url)&&<source media="(max-width:760px)" srcSet={String(s.mobileImageUrl||s.mobile_image_url)}/>}<img src={source} alt={clean(s.title||'Priyasa offer')} loading="lazy"/></picture></section>;
}

function Reviews({s}:{s:HomeCmsSection}){
 const items=itemsOf(s);if(!items.length)return null;
 return <section className="home-reviews" data-testid="home-reviews"><Heading title={clean(s.title||'What our customers say')} subtitle={clean(s.subtitle||'Loved by Priyasa shoppers')}/><div className="home-review-rail">{items.slice(0,12).map((x:any,i:number)=><article className="home-review-card" key={x.id||i}><div className="home-review-stars" aria-label={`${Number(x.rating||5)} out of 5 stars`}>{'★'.repeat(Math.max(1,Math.min(5,Math.round(Number(x.rating||5)))))}</div><h3>{clean(x.title||x.product_name||'Verified purchase')}</h3><p>{clean(x.review||x.comment||x.text||x.content||'Beautiful quality and fit.').slice(0,280)}</p><strong>{clean(x.customer_name||x.name||'Priyasa customer')}</strong>{x.verified!==false&&<small> · Verified Buyer</small>}</article>)}</div></section>;
}

async function Products({title,subtitle,products,rail=false,limit=12}:{title:string;subtitle?:string;products:any[];rail?:boolean;limit?:number}){
 const list=products.slice(0,limit);if(!list.length)return null;
 return <section className={`${rail?'home-managed-products':'home-managed-products home-more-products'} home-section`}><Heading title={title} subtitle={subtitle}/>{rail?<ProductRail products={list}/>:<HomeProductGrid products={list} initialVisible={Math.min(8,list.length)} step={8}/>}</section>;
}

export default async function DynamicHome({initialSections=[]}:{initialSections?:HomeCmsSection[]}){
 const sections=[...initialSections].filter(s=>s?.is_active!==false&&s?.isActive!==false).sort((a,b)=>sortOf(a)-sortOf(b)||Number(a.id)-Number(b.id));
 const hero=sections.find(s=>['hero_slider','hero','hero-slide'].includes(typeOf(s)));
 const imageSection=sections.find(s=>typeOf(s)==='image_carousel'||['collection_showcase','brand_grid'].includes(typeOf(s)));
 const offer=sections.find(s=>['offer','banner','promo','image-banner','collection-banner'].includes(typeOf(s)));
 const review=sections.find(s=>['reviews','review_carousel','testimonials'].includes(typeOf(s)));
 const newSection=sections.find(s=>['new_arrivals','new-arrivals','products-latest','latest','product_carousel'].includes(typeOf(s)));
 const flashSection=sections.find(s=>['flash_sale','flash-sale'].includes(typeOf(s)));
 const bestSection=sections.find(s=>['trending','best_sellers','best-sellers','products-best'].includes(typeOf(s)));
 const [newProducts,flashProducts,bestProducts]=await Promise.all([
  getCachedStorefrontProducts({limit:12,sort:'newest'}),
  getProductsForHomeSection('sale',12),
  getCachedStorefrontProducts({limit:30,sort:'popular'}),
 ]);
 const editorialItems=imageSection?itemsOf(imageSection):newProducts.slice(0,6).map((p:any)=>({id:`product-${p.id}`,title:p.name,subtitle:p.category,image_url:p.image,cta_href:`/product/${encodeURIComponent(p.slug)}`,cta_label:'Shop Now'}));
 const reviewItems=review?itemsOf(review):[];
 return <div className="home-reference-v5 home-managed-v1">
  {hero&&<Hero s={hero}/>}<TrustStrip/>
  <Products title={newSection?.title||'New Arrivals'} subtitle={newSection?.subtitle||'Fresh styles just landed'} products={newProducts} rail limit={12}/>
  {editorialItems.length>0&&<section className="home-editorial-section"><Heading title={imageSection?.title||'Trending Now'} subtitle={imageSection?.subtitle||'Discover the latest edits'}/>{imageSection?.type==='image_carousel'?<HomeImageCarousel slides={editorialItems.slice(0,6).map((x:any,i:number)=>({id:String(x.id||i),title:x.title,subtitle:x.subtitle,imageUrl:x.image_url||x.imageUrl,mobileImageUrl:x.mobile_image_url||x.mobileImageUrl,ctaLabel:x.cta_label||x.ctaLabel||'Shop Now',ctaHref:x.cta_href||x.ctaHref||'/shop'}))}/>:<EditorialRail items={editorialItems}/>}</section>}
  <section className="home-flash-sale" data-testid="home-flash-sale"><div className="home-section-head"><div><span className="home-kicker">LIMITED TIME</span><h2>{clean(flashSection?.title||'Flash Sale')}</h2></div><Link className="home-view-all" href={flashSection?href(flashSection):'/shop?sort=sale'}>{flashSection?label(flashSection):'Shop Sale'} →</Link></div><ProductRail products={flashProducts.slice(0,12)}/></section>
  {offer&&<OfferBanner s={offer}/>} 
  <Products title={bestSection?.title||'Best Sellers'} subtitle={bestSection?.subtitle||'What shoppers are loving'} products={bestProducts} limit={30}/>
  {review&&reviewItems.length>0&&<Reviews s={review}/>} 
  {sections.filter(s=>s!==hero&&s!==imageSection&&s!==offer&&s!==review&&s!==newSection&&s!==flashSection&&s!==bestSection&&typeOf(s)==='text').map(s=><section className="home-managed-text home-section" key={s.id}><span className="home-kicker">{clean(s.title||'PRIYASA')}</span><div className="home-rich-copy">{clean(s.content?.html||s.subtitle||'')}</div></section>)}
 </div>;
}
