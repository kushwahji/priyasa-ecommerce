import Link from 'next/link';
import {getProductsForHomeSection} from '@/lib/storefront-data';
import {getStorefrontCategories} from '@/lib/storefront-data';
import {ProductCard} from '@/components/ProductCard';
import HomeCarousel from '@/components/HomeCarousel';

type Section={id:string;key?:string;type?:string;title?:string|null;subtitle?:string|null;imageUrl?:string|null;mobileImageUrl?:string|null;ctaLabel?:string|null;ctaHref?:string|null};

export default async function HomeCmsSection({section,carouselSlides}:{section:Section;carouselSlides?:Section[]}){
 const type=String(section.type||'').toLowerCase();
 if(type==='hero-slide'||type==='image-carousel')return carouselSlides?.length&&carouselSlides[0].id===section.id?<HomeCarousel slides={carouselSlides} hero={type==='hero-slide'}/>:null;
 if(type.startsWith('products-')||['latest','latest-collection','best-sellers','trending','sale'].includes(type)){
  const products=await getProductsForHomeSection(type,8);if(!products.length)return null;
  return <section className="section home-dynamic-products"><div className="section-head"><div><span className="eyebrow dark">{section.subtitle||'PRIYASA EDIT'}</span><h2>{section.title||'Curated for you'}</h2></div><Link className="text-link" href={section.ctaHref||'/shop'}>{section.ctaLabel||'View All'} →</Link></div><div className="product-grid product-grid-editorial">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div></section>;
 }
 if(type==='category-grid'){
  const categories=await getStorefrontCategories();if(!categories.length)return null;
  return <section className="section"><div className="section-head"><div><span className="eyebrow dark">{section.subtitle||'DISCOVER YOUR STYLE'}</span><h2>{section.title||'Shop by Category'}</h2></div><Link className="text-link" href={section.ctaHref||'/shop'}>{section.ctaLabel||'View All'} →</Link></div><div className="category-grid category-grid-editorial">{categories.slice(0,8).map(c=><Link className="category-card" key={c.id} href={`/category/${c.slug}`}><div className="category-image" style={{backgroundImage:`url(${c.imageUrl||''})`}}/><div className="category-label"><strong>{c.name}</strong><span>Shop Now →</span></div></Link>)}</div></section>;
 }
 if(['banner','promo','feature'].includes(type))return <section className={`home-editorial-block ${type}`}><div className="home-editorial-copy"><span className="eyebrow dark">{section.subtitle||'PRIYASA EDIT'}</span><h2>{section.title||'Discover the edit'}</h2>{section.ctaHref&&<Link className="button dark-button" href={section.ctaHref}>{section.ctaLabel||'Shop now'} →</Link>}</div>{section.imageUrl&&<picture>{section.mobileImageUrl&&<source media="(max-width: 700px)" srcSet={section.mobileImageUrl}/>}<img src={section.imageUrl} alt={section.title||'Priyasa editorial'}/></picture>}</section>;
 if(type==='text')return <section className="section home-text-block"><span className="eyebrow dark">{section.subtitle||'PRIYASA'}</span><h2>{section.title}</h2>{section.ctaHref&&<Link className="text-link" href={section.ctaHref}>{section.ctaLabel||'Explore'} →</Link>}</section>;
 return null;
}
