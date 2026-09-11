import HomeHeroCarousel from '@/components/HomeHeroCarousel';
import HomeProductGrid from '@/components/HomeProductGrid';
import HomeProductRail from '@/components/HomeProductRail';
import HomeEditorialRail from '@/components/HomeEditorialRail';
import HomeFlashSale from '@/components/HomeFlashSale';
import HomeReviewCarousel from '@/components/HomeReviewCarousel';
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';
import { getCachedHomeCms, getCachedStorefrontProducts } from '@/lib/storefront-cache';
import { getProductsForHomeSection } from '@/lib/storefront-data';
import { SiteStructuredData } from '@/app/seo-schema';
import { ReturnIcon, ShieldIcon, TruckIcon, GiftIcon } from '@/components/StorefrontIcons';
import Link from 'next/link';

export const revalidate = 120;
type HomeSection={id:string|number;key?:string;type?:string;title?:string|null;subtitle?:string|null;image_url?:string|null;imageUrl?:string|null;mobile_image_url?:string|null;mobileImageUrl?:string|null;cta_label?:string|null;ctaLabel?:string|null;cta_href?:string|null;ctaHref?:string|null;content?:any;sort_order?:number;sortOrder?:number};
const text=(v:unknown)=>String(v??'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim();
const typeOf=(s:HomeSection)=>String(s.type||'').toLowerCase();
const keyOf=(s:HomeSection)=>String(s.key||'').toLowerCase();
const image=(s:HomeSection)=>s.imageUrl||s.image_url||'';
const href=(s:HomeSection)=>s.ctaHref||s.cta_href||'';
const label=(s:HomeSection)=>s.ctaLabel||s.cta_label||'Shop Now';
const sortOf=(s:HomeSection)=>Number(s.sort_order??s.sortOrder??0);
const matches=(s:HomeSection,names:string[])=>names.includes(typeOf(s))||names.includes(keyOf(s));

function trustStrip(){return <section className="home-service-promises home-managed-trust" aria-label="Priyasa service promises"><div className="home-service-promises-inner"><div className="home-service-promise"><ReturnIcon/><div><strong>7 Days Easy Return</strong><small>Simple & hassle-free</small></div></div><div className="home-service-promise"><ShieldIcon/><div><strong>Premium Quality</strong><small>Made with care</small></div></div><div className="home-service-promise"><GiftIcon/><div><strong>COD Available</strong><small>Pay when it arrives</small></div></div><div className="home-service-promise"><TruckIcon/><div><strong>Pan India Delivery</strong><small>Across India</small></div></div></div></section>}
function ManagedOffer({section}:{section:HomeSection}){const items=Array.isArray(section.content?.items)?section.content.items:[section];return <section className="home-managed-offer">{items.map((item:any,i:number)=><Link key={`${section.id}-${i}`} href={item.cta_href||item.ctaHref||href(section)||'/shop'} className="home-managed-offer-card">{item.image_url||item.imageUrl?<img src={item.image_url||item.imageUrl} alt={text(item.title||section.title||'Priyasa offer')} loading="lazy"/>:<div className="home-managed-offer-fallback"/>}<div className="home-managed-offer-copy"><span>{text(item.subtitle||section.subtitle||'PRIYASA OFFER')}</span><strong>{text(item.title||section.title||'Special Offer')}</strong><b>{item.cta_label||item.ctaLabel||label(section)} →</b></div></Link>)}</section>}
function ManagedBanner({section}:{section:HomeSection}){const src=image(section);if(!src)return null;return <section className="home-managed-banner"><div className="home-managed-banner-copy"><span>{text(section.subtitle||'PRIYASA EDIT')}</span><h2>{text(section.title||'Style That Speaks')}</h2>{href(section)&&<Link href={href(section)}>{label(section)} →</Link>}</div><picture>{(section.mobile_image_url||section.mobileImageUrl)&&<source media="(max-width:760px)" srcSet={String(section.mobile_image_url||section.mobileImageUrl)}/>}<img src={src} alt={text(section.title||'Priyasa fashion')} loading="lazy"/></picture></section>}
function heroFor(section:HomeSection){const items=Array.isArray(section.content?.items)?section.content.items:[];const slides=(items.length?items:[section]).map((item:any,i:number)=>({id:`${section.id}-${i}`,title:item.title||section.title,subtitle:item.subtitle||section.subtitle,imageUrl:item.image_url||item.imageUrl||image(section),mobileImageUrl:item.mobile_image_url||item.mobileImageUrl||section.mobile_image_url||section.mobileImageUrl||item.image_url||item.imageUrl||image(section),ctaLabel:item.cta_label||item.ctaLabel||section.cta_label||section.ctaLabel||'Shop Now',ctaHref:item.cta_href||item.ctaHref||section.cta_href||section.ctaHref||'/shop'}));return <section className="home-section home-hero-multi home-managed-hero" key={section.id}><HomeHeroCarousel slides={slides}/></section>}
async function DynamicProducts({section,rail=false,more=false}:{section:HomeSection;rail?:boolean;more?:boolean}){const q=section.content?.query||{};const limit=Math.min(Math.max(Number(q.limit||(more?30:12)),3),30);const type=typeOf(section);let products:any[]=[];if(type==='new_arrivals'||type==='new-arrivals'||keyOf(section).includes('new-arrivals'))products=await getCachedStorefrontProducts({limit,sort:String(q.sort||'newest')});else if(type==='trending'||type==='best-sellers'||keyOf(section).includes('best-seller'))products=await getCachedStorefrontProducts({limit,sort:String(q.sort||'popular')});else if(type==='products-sale'||type==='sale'||keyOf(section).includes('flash-sale'))products=await getProductsForHomeSection('sale',limit);else products=await getProductsForHomeSection(type,limit);if(!products.length)return null;return <section className={`home-section home-product-section home-managed-products ${more?'home-more-products':''}`} key={section.id}><div className="home-section-head"><div><span className="home-kicker">{text(section.subtitle)||'PRIYASA EDIT'}</span><h2>{text(section.title)||'Curated for you'}</h2></div><Link className="home-view-all" href={href(section)||'/shop'}>{label(section)} →</Link></div>{rail?<HomeProductRail products={products}/>:<HomeProductGrid products={products} initialVisible={Math.min(12,products.length)} step={6}/>}</section>}

export default async function Home(){
 const sections=(await getCachedHomeCms()).slice().filter((s:any)=>s?.is_active!==false&&s?.isActive!==false).sort((a:any,b:any)=>sortOf(a)-sortOf(b)) as HomeSection[];
 const hero=sections.find(s=>['hero_slider','hero','hero-slide'].includes(typeOf(s)));
 const latestSection=sections.find(s=>matches(s,['new_arrivals','new-arrivals','products-latest','latest','latest-collection'])||keyOf(s).includes('new-arrivals'));
 const flashSection=sections.find(s=>matches(s,['flash_sale','flash-sale','products-sale'])||keyOf(s).includes('flash-sale'));
 const offer=sections.find(s=>typeOf(s)==='offer'||keyOf(s).includes('offer'));
 const bestSection=sections.find(s=>matches(s,['trending','best-sellers','products-best','popular'])||keyOf(s).includes('best-seller'));
 const editorial=sections.find(s=>['editorial_grid','editorial','image_grid','image_rail'].includes(typeOf(s)));
 const reviews=sections.find(s=>['reviews','review_carousel','review-carousel','testimonials'].includes(typeOf(s)));
 const banners=sections.filter(s=>['banner','promo','image-banner','collection-banner'].includes(typeOf(s)));
 const latest=await getCachedStorefrontProducts({limit:12,sort:'newest'});
 const popular=await getCachedStorefrontProducts({limit:30,sort:'popular'});
 const sale=await getProductsForHomeSection('sale',12);
 const body:any[]=[];
 if(hero)body.push(heroFor(hero));
 body.push(trustStrip());
 if(latestSection){const r=await DynamicProducts({section:latestSection,rail:true});if(r)body.push(r);}else if(latest.length)body.push(<section className="home-section home-managed-products home-product-section" key="fallback-new"><div className="home-section-head"><div><span className="home-kicker">Fresh styles just landed</span><h2>New Arrivals</h2></div><Link className="home-view-all" href="/shop">View All →</Link></div><HomeProductRail products={latest}/></section>);
 if(editorial)body.push(<HomeEditorialRail key={editorial.id} products={latest} title={text(editorial.title)||'Style Edit'} subtitle={text(editorial.subtitle)||'Explore the latest looks'} href={href(editorial)||'/shop'}/>);else if(latest.length)body.push(<HomeEditorialRail key="fallback-editorial" products={latest} title="Style Edit" subtitle="Six looks, one Priyasa mood"/>);
 if(flashSection)body.push(<HomeFlashSale key={flashSection.id} products={sale} endAt={flashSection.content?.end_at||flashSection.content?.endAt} title={text(flashSection.title)||'Flash Sale'} subtitle={text(flashSection.subtitle)||'Limited-time prices on selected styles'}/>);else if(sale.length)body.push(<HomeFlashSale key="fallback-flash" products={sale}/>);
 if(offer)body.push(<ManagedOffer section={offer} key={offer.id}/>);else if(banners[0])body.push(<ManagedBanner section={banners[0]} key={banners[0].id}/>);
 if(bestSection){const r=await DynamicProducts({section:bestSection,more:true});if(r)body.push(r);}else if(popular.length)body.push(<section className="home-section home-managed-products home-product-section home-more-products" key="fallback-more"><div className="home-section-head"><div><span className="home-kicker">Most loved by shoppers</span><h2>Best Sellers</h2></div><Link className="home-view-all" href="/shop">View All →</Link></div><HomeProductGrid products={popular} initialVisible={12} step={6}/></section>);
 if(reviews){const items=Array.isArray(reviews.content?.items)?reviews.content.items:Array.isArray(reviews.content)?reviews.content:[];if(items.length)body.push(<HomeReviewCarousel key={reviews.id} items={items}/>);}
 for(const s of banners.slice(1)){const r=ManagedBanner({section:s});if(r)body.push(<div key={s.id}>{r}</div>);}
 return <div className="home-managed-v1"><SiteStructuredData/>{body.filter(Boolean)}<PersonalizedRecommendations/></div>;
}
