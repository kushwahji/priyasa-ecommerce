import HomeHeroCarousel from '@/components/HomeHeroCarousel';
import HomeProductGrid from '@/components/HomeProductGrid';
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';
import { getCachedHomeCms, getCachedStorefrontProducts } from '@/lib/storefront-cache';
import { getProductsForHomeSection } from '@/lib/storefront-data';
import { SiteStructuredData } from '@/app/seo-schema';
import { ReturnIcon, ShieldIcon, TruckIcon, GiftIcon } from '@/components/StorefrontIcons';

export const revalidate = 120;

type HomeSection = {
  id:string|number;
  key?:string;
  type?:string;
  title?:string|null;
  subtitle?:string|null;
  image_url?:string|null;
  imageUrl?:string|null;
  cta_label?:string|null;
  ctaLabel?:string|null;
  cta_href?:string|null;
  ctaHref?:string|null;
  content?:any;
  sort_order?:number;
  sortOrder?:number;
};

const text=(value:unknown)=>String(value??'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim();
const typeOf=(section:HomeSection)=>String(section.type||'').toLowerCase();
const image=(section:HomeSection)=>section.imageUrl||section.image_url||'';
const href=(section:HomeSection)=>section.ctaHref||section.cta_href||'';
const label=(section:HomeSection)=>section.ctaLabel||section.cta_label||'Shop Now';

function trustStrip(){return <section className="home-service-promises home-managed-trust" aria-label="Priyasa service promises"><div className="home-service-promises-inner"><div className="home-service-promise"><ReturnIcon/><div><strong>7 Days Easy Return</strong></div></div><div className="home-service-promise"><ShieldIcon/><div><strong>Premium Quality</strong></div></div><div className="home-service-promise"><GiftIcon/><div><strong>COD Available</strong></div></div><div className="home-service-promise"><TruckIcon/><div><strong>Pan India Delivery</strong></div></div></div></section>}

function ManagedOffer({section}:{section:HomeSection}){const item=Array.isArray(section.content?.items)?section.content.items[0]:null;const offer={...section,...item};return <section className="home-managed-offer"><div className="home-managed-offer-copy"><span className="home-kicker">{text(section.type)||'PRIYASA OFFERS'}</span><h2>{text(offer.title||section.title||'Special Offer')}</h2>{offer.subtitle&&<p>{text(offer.subtitle)}</p>}{(offer.cta_href||offer.ctaHref||href(section))&&<a className="button" href={offer.cta_href||offer.ctaHref||href(section)}>{offer.cta_label||offer.ctaLabel||label(section)} →</a>}</div>{(offer.image_url||offer.imageUrl||image(section))&&<div className="home-managed-offer-image" style={{backgroundImage:`url(${offer.image_url||offer.imageUrl||image(section)})`}}/>}</section>}

function ManagedBanner({section}:{section:HomeSection}){return <section className="home-managed-banner"><div className="home-managed-banner-copy"><span className="home-kicker">{text(section.type)||'PRIYASA EDIT'}</span><h2>{text(section.title||'The Priyasa Edit')}</h2>{section.subtitle&&<p>{text(section.subtitle)}</p>}{href(section)&&<a className="button dark-button" href={href(section)}>{label(section)} →</a>}</div><div className="home-managed-banner-image" style={{backgroundImage:`url(${image(section)})`}}/></section>}

export default async function Home(){
  const sections=(await getCachedHomeCms()).slice().sort((a:any,b:any)=>(Number(a.sort_order??a.sortOrder??0)-Number(b.sort_order??b.sortOrder??0)));
  const latest=await getCachedStorefrontProducts({limit:30});
  const body:any[]=[];
  let trustAdded=false;
  let heroAdded=false;

  for(const section of sections as HomeSection[]){
    const type=typeOf(section);
    if(type==='banner'&&String(section.key||'')==='home')continue;
    if(type==='category_grid')continue;

    if(type==='hero_slider'||type==='hero'||type==='hero-slide'){
      if(heroAdded)continue;
      const items=Array.isArray(section.content?.items)?section.content.items:[];
      const slides=items.length?items.map((item:any,index:number)=>({id:`${section.id}-${index}`,title:item.title||section.title,subtitle:item.subtitle||section.subtitle,imageUrl:item.image_url||item.imageUrl||image(section),mobileImageUrl:item.mobile_image_url||item.mobileImageUrl||item.image_url||item.imageUrl||image(section),ctaLabel:item.cta_label||item.ctaLabel||label(section),ctaHref:item.cta_href||item.ctaHref||href(section)})):[{id:String(section.id),title:section.title,subtitle:section.subtitle,imageUrl:image(section),ctaLabel:label(section),ctaHref:href(section)}];
      body.push(<section className="home-section home-hero-multi home-managed-hero" key={section.id}><HomeHeroCarousel slides={slides}/></section>);
      heroAdded=true;
      if(!trustAdded){body.push(trustStrip());trustAdded=true;}
      continue;
    }

    if(type==='offer'){
      body.push(<ManagedOffer section={section} key={section.id}/>);
      continue;
    }

    if(type==='new_arrivals'||type==='new-arrivals'||type==='latest'||type==='latest-collection'){
      const products=await getProductsForHomeSection('new_arrivals',8);
      if(products.length)body.push(<section className="home-section home-product-section home-managed-products" key={section.id}><div className="home-section-head"><div><span className="home-kicker">{text(section.subtitle)||'FRESH STYLES'}</span><h2>{text(section.title)||'New Arrivals'}</h2></div>{href(section)&&<a className="home-view-all" href={href(section)}>{label(section)} →</a>}</div><HomeProductGrid products={products} initialVisible={8} step={8}/></section>);
      continue;
    }

    if(type==='trending'||type==='products-best'||type==='best-sellers'){
      const products=await getProductsForHomeSection('trending',8);
      if(products.length)body.push(<section className="home-section home-product-section home-managed-products" key={section.id}><div className="home-section-head"><div><span className="home-kicker">{text(section.subtitle)||'MOST LOVED'}</span><h2>{text(section.title)||'Trending Now'}</h2></div>{href(section)&&<a className="home-view-all" href={href(section)}>{label(section)} →</a>}</div><HomeProductGrid products={products} initialVisible={8} step={8}/></section>);
      continue;
    }

    if(type==='banner'){
      body.push(<ManagedBanner section={section} key={section.id}/>);
      continue;
    }

    if(type==='text'){
      const html=section.content?.html;
      body.push(<section className="home-managed-text home-section" key={section.id}><span className="home-kicker">{text(section.title)||'PRIYASA'}</span><p>{text(html)||text(section.subtitle)}</p></section>);
    }
  }

  if(!heroAdded&&latest.length){body.push(<section className="home-section home-hero-multi" key="fallback"><HomeHeroCarousel slides={[{id:'fallback',title:'Priyasa Fashion',subtitle:'New season. New style.',imageUrl:latest[0].image,ctaLabel:'Shop Now',ctaHref:'/shop'}]}/></section>);}
  if(!trustAdded){body.splice(1,0,trustStrip());}

  return <div className="home-reference-v4"><SiteStructuredData/>{body.filter(Boolean)}<PersonalizedRecommendations/></div>;
}
