import Link from 'next/link';
import {getBestSellers,getHomeCms,getStorefrontCategories} from '@/lib/storefront-data';
import {ProductCard} from '@/components/ProductCard';
import {TruckIcon,ShieldIcon,ReturnIcon,GiftIcon} from '@/components/StorefrontIcons';

export default async function Home(){
 const [products,categories,sections]=await Promise.all([getBestSellers(4),getStorefrontCategories(),getHomeCms()]);
 const hero=sections.find(s=>s.type.toLowerCase()==='hero')||sections[0];
 const promo=sections.find(s=>s.type.toLowerCase().includes('promo'));
 const features=sections.filter(s=>['feature','lifestyle','banner'].includes(s.type.toLowerCase())).slice(0,3);
 return <>
  {hero&&<section className="hero hero-editorial" style={{backgroundImage:`linear-gradient(90deg,rgba(255,237,239,.97),rgba(255,235,237,.18)),url(${hero.imageUrl||''})`}}><div className="hero-copy"><span className="eyebrow">{hero.subtitle||'PRIYASA COLLECTIONS'}</span><h1>{hero.title||'Discover your style'}</h1>{hero.subtitle&&<p>{hero.subtitle}</p>}<div className="hero-actions">{hero.ctaHref&&<Link className="button" href={hero.ctaHref}>{hero.ctaLabel||'Shop Now'} →</Link>}</div></div></section>}
  <section className="trust-strip"><span><TruckIcon/><b>Free Shipping</b><small>On eligible orders</small></span><i/><span><GiftIcon/><b>COD Available</b><small>Cash on Delivery</small></span><i/><span><ReturnIcon/><b>Easy Returns</b><small>On eligible styles</small></span><i/><span><ShieldIcon/><b>Secure Payment</b><small>Protected checkout</small></span></section>
  {products.length>0&&<section className="section section-tight home-best-sellers"><div className="section-head"><div><span className="eyebrow dark">MOST LOVED</span><h2>Best Sellers</h2></div><Link className="text-link" href="/shop">View All →</Link></div><div className="product-grid product-grid-editorial">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div></section>}
  {categories.length>0&&<section className="section section-tight home-categories"><div className="section-head"><div><span className="eyebrow dark">DISCOVER YOUR STYLE</span><h2>Shop by Category</h2></div><Link className="text-link" href="/shop">View All →</Link></div><div className="category-grid category-grid-editorial">{categories.slice(0,6).map(c=><Link className="category-card" key={c.id} href={`/category/${c.slug}`}><div className="category-image" style={{backgroundImage:`url(${c.imageUrl||''})`}}/><div className="category-label"><strong>{c.name}</strong><span>Shop Now →</span></div></Link>)}</div></section>}
  {promo&&<section className="split-banner"><div className="split-copy"><span className="eyebrow dark">{promo.type.toUpperCase()}</span><h2>{promo.title}</h2>{promo.subtitle&&<p>{promo.subtitle}</p>}{promo.ctaHref&&<Link className="button dark-button" href={promo.ctaHref}>{promo.ctaLabel||'Shop Now'} →</Link>}</div><div className="split-image" style={{backgroundImage:`url(${promo.imageUrl||''})`}}/></section>}
  {features.length>0&&<section className="section section-tight"><div className="section-head"><div><span className="eyebrow dark">PRIYASA EDIT</span><h2>Style for Every You</h2></div></div><div className="feature-grid feature-grid-editorial">{features.map(f=><Link key={f.id} href={f.ctaHref||'/shop'} className="feature" style={{backgroundImage:`linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.5)),url(${f.imageUrl||''})`}}><span className="eyebrow">{f.type}</span><h3>{f.title}</h3><span>{f.ctaLabel||'Shop Now'} →</span></Link>)}</div></section>}
  <section className="newsletter"><div><span className="eyebrow dark">STAY IN THE LOOP</span><h2>New styles, offers and order updates.</h2><p>Sign in to receive Priyasa updates.</p></div><Link className="button dark-button" href="/account">My Account →</Link></section>
 </>;
}
