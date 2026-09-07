import Link from 'next/link';
import {getBestSellers,getHomeCms,getProductsForHomeSection,getStorefrontCategories} from '@/lib/storefront-data';
import {ProductCard} from '@/components/ProductCard';
import HomeHeroCarousel from '@/components/HomeHeroCarousel';
import HomeImageCarousel from '@/components/HomeImageCarousel';
import {TruckIcon,ShieldIcon,ReturnIcon,GiftIcon} from '@/components/StorefrontIcons';

const productSectionType=(type:string)=>{const t=type.toLowerCase();return t.startsWith('products-')||['latest','latest-collection','best-sellers','trending','sale'].includes(t)};

export default async function Home(){
 const [fallbackBest,categories,sections]=await Promise.all([getBestSellers(4),getStorefrontCategories(),getHomeCms()]);
 const heroSlides=sections.filter(s=>['hero','hero-slide'].includes(s.type.toLowerCase())&&s.key.startsWith('home.hero'));
 const imageSlides=sections.filter(s=>['image-carousel','image-slide','carousel'].includes(s.type.toLowerCase())&&s.key.startsWith('home.carousel'));
 const productSections=sections.filter(s=>productSectionType(s.type));
 const sectionProducts=await Promise.all(productSections.map(s=>getProductsForHomeSection(s.type,8)));
 const promos=sections.filter(s=>['promo','banner','collection-banner'].includes(s.type.toLowerCase()));
 const features=sections.filter(s=>['feature','lifestyle'].includes(s.type.toLowerCase()));
 return <>
  {heroSlides.length>0?<HomeHeroCarousel slides={heroSlides}/>:<section className="hero hero-editorial hero-fallback"><div className="hero-copy"><span className="eyebrow">PRIYASA COLLECTIONS</span><h1>Every you, beautifully.</h1><p>Discover fashion made for every mood, moment and occasion.</p><Link className="button" href="/new-arrivals">Shop New Arrivals →</Link></div></section>}
  <section className="trust-strip"><span><TruckIcon/><b>Free Shipping</b><small>On eligible orders</small></span><i/><span><GiftIcon/><b>COD Available</b><small>Cash on Delivery</small></span><i/><span><ReturnIcon/><b>Easy Returns</b><small>On eligible styles</small></span><i/><span><ShieldIcon/><b>Secure Payment</b><small>Protected checkout</small></span></section>
  {productSections.map((s,index)=>{const products=sectionProducts[index]||[];if(!products.length)return null;return <section className="section section-tight home-product-section" key={s.id}><div className="section-head"><div><span className="eyebrow dark">{s.subtitle||'PRIYASA EDIT'}</span><h2>{s.title||'Curated for you'}</h2></div>{s.ctaHref&&<Link className="text-link" href={s.ctaHref}>{s.ctaLabel||'View All'} →</Link>}</div><div className="product-grid product-grid-editorial">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div></section>})}
  {!productSections.length&&fallbackBest.length>0&&<section className="section section-tight home-best-sellers"><div className="section-head"><div><span className="eyebrow dark">MOST LOVED</span><h2>Best Sellers</h2></div><Link className="text-link" href="/shop">View All →</Link></div><div className="product-grid product-grid-editorial">{fallbackBest.map(p=><ProductCard key={p.id} product={p}/>)}</div></section>}
  {categories.length>0&&<section className="section section-tight home-categories"><div className="section-head"><div><span className="eyebrow dark">DISCOVER YOUR STYLE</span><h2>Shop by Category</h2></div><Link className="text-link" href="/shop">View All →</Link></div><div className="category-grid category-grid-editorial">{categories.slice(0,6).map(c=><Link className="category-card" key={c.id} href={`/category/${c.slug}`}><div className="category-image" style={{backgroundImage:`url(${c.imageUrl||''})`}}/><div className="category-label"><strong>{c.name}</strong><span>Shop Now →</span></div></Link>)}</div></section>}
  {imageSlides.length>0&&<HomeImageCarousel slides={imageSlides}/>} 
  {promos.map(p=><section className="split-banner" key={p.id}><div className="split-copy"><span className="eyebrow dark">{p.type.replaceAll('-',' ').toUpperCase()}</span><h2>{p.title||'The Priyasa edit'}</h2>{p.subtitle&&<p>{p.subtitle}</p>}{p.ctaHref&&<Link className="button dark-button" href={p.ctaHref}>{p.ctaLabel||'Shop Now'} →</Link>}</div><div className="split-image" style={{backgroundImage:`url(${p.imageUrl||''})`}}/></section>)}
  {features.length>0&&<section className="section section-tight"><div className="section-head"><div><span className="eyebrow dark">PRIYASA EDIT</span><h2>Style for Every You</h2></div></div><div className="feature-grid feature-grid-editorial">{features.map(f=><Link key={f.id} href={f.ctaHref||'/shop'} className="feature" style={{backgroundImage:`linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.5)),url(${f.imageUrl||''})`}}><span className="eyebrow">{f.type.replaceAll('-',' ')}</span><h3>{f.title||'Explore the edit'}</h3><span>{f.ctaLabel||'Shop Now'} →</span></Link>)}</div></section>}
  <section className="newsletter"><div><span className="eyebrow dark">STAY IN THE LOOP</span><h2>New styles, offers and order updates.</h2><p>Sign in to receive Priyasa updates.</p></div><Link className="button dark-button" href="/account">My Account →</Link></section>
 </>;
}
