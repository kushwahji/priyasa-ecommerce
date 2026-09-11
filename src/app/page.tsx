import HomeHeroCarousel from '@/components/HomeHeroCarousel';
import HomeProductGrid from '@/components/HomeProductGrid';
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';
import { getCachedHomeCms, getCachedStorefrontProducts } from '@/lib/storefront-cache';
import { getProductsForHomeSection } from '@/lib/storefront-data';
import { SiteStructuredData } from '@/app/seo-schema';
import { ReturnIcon, ShieldIcon, TruckIcon, GiftIcon } from '@/components/StorefrontIcons';
import Link from 'next/link';

export const revalidate = 120;

type HomeSection={id:string|number;key?:string;type?:string;title?:string|null;subtitle?:string|null;image_url?:string|null;imageUrl?:string|null;mobile_image_url?:string|null;mobileImageUrl?:string|null;cta_label?:string|null;ctaLabel?:string|null;cta_href?:string|null;ctaHref?:string|null;content?:any;sort_order?:number;sortOrder?:number};
const text=(value:unknown)=>String(value??'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim();
const typeOf=(section:HomeSection)=>String(section.type||'').toLowerCase();
const image=(section:HomeSection)=>section.imageUrl||section.image_url||'';
const href=(section:HomeSection)=>section.ctaHref||section.cta_href||'';
const label=(section:HomeSection)=>section.ctaLabel||section.cta_label||'Shop Now';
const sortOf=(section:HomeSection)=>Number(section.sort_order??section.sortOrder??0);

function trustStrip(){return <section className="home-service-promises home-managed-trust" aria-label="Priyasa service promises"><div className="home-service-promises-inner"><div className="home-service-promise"><ReturnIcon/><div><strong>7 Days Easy Return</strong><small>Simple & hassle-free</small></div></div><div className="home-service-promise"><ShieldIcon/><div><strong>Premium Quality</strong><small>Made with care</small></div></div><div className="home-service-promise"><GiftIcon/><div><strong>COD Available</strong><small>Pay when it arrives</small></div></div><div className="home-service-promise"><TruckIcon/><div><strong>Pan India Delivery</strong><small>Across India</small></div></div></div></section>}

function ManagedOffer({section}:{section:HomeSection}){const items=Array.isArray(section.content?.items)?section.content.items:[section];return <section className="home-managed-offer">{items.map((item:any,index:number)=><Link key={`${section.id}-${index}`} href={item.cta_href||item.ctaHref||href(section)||'/shop'} className="home-managed-offer-card">{item.image_url||item.imageUrl?<img src={item.image_url||item.imageUrl} alt={text(item.title||section.title||'Priyasa offer')} loading="lazy"/>:<div className="home-managed-offer-fallback"/>}<div className="home-managed-offer-copy"><span>{text(item.subtitle||section.subtitle||'PRIYASA OFFER')}</span><strong>{text(item.title||section.title||'Special Offer')}</strong><b>{item.cta_label||item.ctaLabel||label(section)} →</b></div></Link>)}</section>}

function ManagedBanner({section}:{section:HomeSection}){const src=image(section);if(!src)return null;return <section className="home-managed-banner"><div className="home-managed-banner-copy"><span>{text(section.subtitle||'PRIYASA EDIT')}</span><h2>{text(section.title||'Style That Speaks')}</h2>{href(section)&&<Link href={href(section)}>{label(section)} →</Link>}</div><picture>{(section.mobile_image_url||section.mobileImageUrl)&&<source media="(max-width:760px)" srcSet={String(section.mobile_image_url||section.mobileImageUrl)}/>}<img src={src} alt={text(section.title||'Priyasa fashion')} loading="lazy"/></picture></section>}

async function DynamicProducts({section}:{section:HomeSection}){const query=section.content?.query||{};const limit=Math.min(Math.max(Number(query.limit||8),3),30);const type=typeOf(section);let products:any[]=[];if(type==='new_arrivals'||type==='new-arrivals')products=await getCachedStorefrontProducts({limit,sort:String(query.sort||'newest')});else if(type==='trending')products=await getCachedStorefrontProducts({limit,sort:String(query.sort||'popular')});else if(type==='products-sale'||type==='sale')products=await getProductsForHomeSection('sale',limit);else products=await getProductsForHomeSection(type,limit);if(!products.length)return null;return <section className="home-section home-product-section home-managed-products" key={section.id}><div className="home-section-head"><div><span className="home-kicker">{text(section.subtitle)||'PRIYASA EDIT'}</span><h2>{text(section.title)||'Curated for you'}</h2></div><Link className="home-view-all" href={href(section)||'/shop'}>{label(section)||'View All'} →</Link></div><HomeProductGrid products={products} initialVisible={products.length} step={products.length}/></section>}

export default async function Home(){
 const sections=(await getCachedHomeCms()).slice().filter((s:any)=>s?.is_active!==false&&s?.isActive!==false).sort((a:any,b:any)=>sortOf(a)-sortOf(b)) as HomeSection[];
 const body:any[]=[];let heroAdded=false;let trustAdded=false;
 for(const section of sections){const type=typeOf(section);if(type==='category_grid')continue;
  if(type==='hero_slider'||type==='hero'||type==='hero-slide'){
   if(heroAdded)continue;const items=Array.isArray(section.content?.items)?section.content.items:[];const slides=(items.length?items:[section]).map((item:any,index:number)=>({id:`${section.id}-${index}`,title:item.title||section.title,subtitle:item.subtitle||section.subtitle,imageUrl:item.image_url||item.imageUrl||image(section),mobileImageUrl:item.mobile_image_url||item.mobileImageUrl||section.mobile_image_url||section.mobileImageUrl||item.image_url||item.imageUrl||image(section),ctaLabel:item.cta_label||item.ctaLabel||section.cta_label||section.ctaLabel||'Shop Now',ctaHref:item.cta_href||item.ctaHref||section.cta_href||section.ctaHref||'/shop'}));body.push(<section className="home-section home-hero-multi home-managed-hero" key={section.id}><HomeHeroCarousel slides={slides}/></section>);heroAdded=true;if(!trustAdded){body.push(trustStrip());trustAdded=true;}continue;
  }
  if(type==='offer'){body.push(<ManagedOffer section={section} key={section.id}/>);continue;}
  if(type==='new_arrivals'||type==='new-arrivals'||type==='trending'||type.startsWith('products-')||['latest','latest-collection','best-sellers','sale'].includes(type)){const rendered=await DynamicProducts({section});if(rendered)body.push(rendered);continue;}
  if(type==='banner'||type==='promo'||type==='image-banner'||type==='collection-banner'){const rendered=ManagedBanner({section});if(rendered)body.push(<div key={section.id}>{rendered}</div>);continue;}
  if(type==='text'){body.push(<section className="home-managed-text home-section" key={section.id}><span className="home-kicker">{text(section.title||'PRIYASA')}</span><p>{text(section.content?.html)||text(section.subtitle)}</p></section>);continue;}
 }
 if(!heroAdded){const fallback=await getCachedStorefrontProducts({limit:1,sort:'newest'});if(fallback.length)body.unshift(<section className="home-section home-hero-multi home-managed-hero" key="fallback"><HomeHeroCarousel slides={[{id:'fallback',title:'Priyasa Fashion',subtitle:'New season. New style.',imageUrl:fallback[0].image,ctaLabel:'Shop Now',ctaHref:'/shop'}]}/></section>);}
 if(!trustAdded)body.splice(Math.min(1,body.length),0,trustStrip());
 return <div className="home-managed-v1"><SiteStructuredData/>{body.filter(Boolean)}<PersonalizedRecommendations/></div>;
}
