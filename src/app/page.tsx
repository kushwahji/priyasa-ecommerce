import Link from 'next/link';
import { categories, products } from '@/lib/catalog';
import { ProductCard } from '@/components/ProductCard';
import { TruckIcon, ShieldIcon, ReturnIcon, GiftIcon } from '@/components/StorefrontIcons';

const categoryImages=[
  'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=700&q=82',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=700&q=82',
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=82',
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=700&q=82',
  'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=700&q=82',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=82'
];

const categoryLabels=['Women','Nightwear','Ethnic Wear','Activewear','Loungewear','Accessories'];
const categoryHrefs=['/category/women','/category/nightwear','/category/ethnic-wear','/category/activewear','/category/loungewear','/category/accessories'];

export default function Home(){
  return <>
    <section className="hero hero-editorial">
      <div className="hero-copy">
        <span className="eyebrow">TRENDY · COMFORTABLE · YOU</span>
        <h1>New Season<br/><em>New Styles</em></h1>
        <p>Elegant fashion for every occasion. Discover styles designed to make you feel confident, comfortable and beautiful.</p>
        <div className="hero-actions"><Link className="button" href="/shop">Shop Now →</Link><Link className="button button-light" href="/offers">View Offers</Link></div>
      </div>
    </section>

    <section className="trust-strip">
      <span><TruckIcon/> Free Shipping <small>On Orders Above ₹999</small></span><i/>
      <span><GiftIcon/> COD Available <small>Cash on Delivery</small></span><i/>
      <span><ReturnIcon/> Easy Returns <small>Hassle Free Returns</small></span><i/>
      <span><ShieldIcon/> Secure Payment <small>100% Secure</small></span>
    </section>

    <section className="section section-tight">
      <div className="section-head"><div><span className="eyebrow dark">DISCOVER YOUR STYLE</span><h2>Shop by Category</h2></div><Link className="text-link" href="/shop">View All →</Link></div>
      <div className="category-grid category-grid-editorial">{categoryLabels.map((c,i)=><Link className="category-card" key={c} href={categoryHrefs[i]}><div className="category-image" style={{backgroundImage:`url(${categoryImages[i]})`}}/><div className="category-label"><strong>{c}</strong><span>Shop Now →</span></div></Link>)}</div>
    </section>

    <section className="section section-tight" style={{paddingTop:10}}>
      <div className="section-head"><div><span className="eyebrow dark">MOST LOVED</span><h2>Best Sellers</h2></div><Link className="text-link" href="/shop">View All →</Link></div>
      <div className="product-grid product-grid-editorial">{products.slice(0,4).map(p=><ProductCard key={p.id} product={p}/>)}</div>
    </section>

    <section className="split-banner"><div className="split-copy"><span className="eyebrow dark">SPECIAL OFFER</span><h2>Flat<br/><em>50% OFF</em></h2><p>Fresh styles, feminine details and everyday essentials selected just for you.</p><Link className="button dark-button" href="/offers">Shop Now →</Link></div><div className="split-image split-image-ethnic"/></section>

    <section className="section section-tight">
      <div className="section-head"><div><span className="eyebrow dark">EVERYDAY LUXURY</span><h2>Style for Every You</h2></div></div>
      <div className="feature-grid feature-grid-editorial"><Link href="/category/lingerie" className="feature feature-one"><span className="eyebrow">WOMEN</span><h3>Confidence<br/>starts within.</h3><span>Shop Now →</span></Link><Link href="/category/nightwear" className="feature feature-two"><span className="eyebrow">COMFORT</span><h3>Your softest<br/>side.</h3><span>Shop Nightwear →</span></Link><Link href="/offers" className="feature feature-three"><span className="eyebrow">SALE</span><h3>Good style.<br/>Better value.</h3><span>Shop Offers →</span></Link></div>
    </section>

    <section className="newsletter"><div><span className="eyebrow dark">STAY IN THE LOOP</span><h2>Get first access to new styles.</h2><p>Sign in to receive order updates, launches and exclusive Priyasa offers.</p></div><Link className="button dark-button" href="/account">Join Priyasa →</Link></section>
  </>;
}
