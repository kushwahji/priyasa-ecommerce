import Link from 'next/link';
import { categories, products } from '@/lib/catalog';
import { ProductCard } from '@/components/ProductCard';

const categoryImages=[
  'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=700&q=82',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=82',
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=82',
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=700&q=82',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=82',
  'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=700&q=82'
];

export default function Home(){
  return <>
    <section className="hero hero-editorial">
      <div className="hero-copy">
        <span className="eyebrow">PRIYASA · THE FESTIVE EDIT</span>
        <h1>Designed for<br/><em>every you.</em></h1>
        <p>Contemporary Indian fashion, intimate essentials and everyday comfort — thoughtfully made for the way you live.</p>
        <div className="hero-actions"><Link className="button" href="/shop">Shop New Arrivals</Link><Link className="button button-light" href="/category/ethnic-wear">Explore Ethnic</Link></div>
      </div>
      <div className="hero-scroll">SCROLL TO EXPLORE <span>↓</span></div>
    </section>

    <section className="trust-strip"><span>FREE SHIPPING ON ELIGIBLE ORDERS</span><i/> <span>SECURE CHECKOUT</span><i/> <span>EASY RETURNS</span><i/> <span>WHATSAPP SUPPORT</span></section>

    <section className="section section-tight">
      <div className="section-head"><div><span className="eyebrow dark">CURATED FOR YOU</span><h2>Shop by category</h2></div><Link className="text-link" href="/shop">View all <span>→</span></Link></div>
      <div className="category-grid category-grid-editorial">{categories.slice(0,6).map((c,i)=><Link className="category-card" key={c} href={`/category/${c.toLowerCase().replaceAll(' ','-')}`}><div className="category-image" style={{backgroundImage:`url(${categoryImages[i]})`}}/><div className="category-label"><strong>{c}</strong><span>Explore →</span></div></Link>)}</div>
    </section>

    <section className="split-banner"><div className="split-copy"><span className="eyebrow dark">THE OCCASION EDIT</span><h2>Tradition,<br/><em>reimagined.</em></h2><p>Elegant silhouettes and rich details for celebrations that deserve a little more.</p><Link className="button dark-button" href="/category/ethnic-wear">Shop the collection</Link></div><div className="split-image split-image-ethnic"/></section>

    <section className="section">
      <div className="section-head"><div><span className="eyebrow dark">MOST LOVED</span><h2>Best sellers</h2></div><Link className="text-link" href="/shop">Shop all <span>→</span></Link></div>
      <div className="product-grid product-grid-editorial">{products.slice(0,4).map(p=><ProductCard key={p.id} product={p}/>)}</div>
    </section>

    <section className="statement"><span className="eyebrow">PRIYASA</span><h2>Feel good.<br/><em>Look beautiful.</em></h2><p>Quality fabrics. Considered fits. Indian fashion made for real life.</p><Link className="button button-light" href="/shop">Discover Priyasa</Link></section>

    <section className="section section-tight"><div className="section-head"><div><span className="eyebrow dark">EVERYDAY LUXURY</span><h2>Made for your moments</h2></div></div><div className="feature-grid feature-grid-editorial"><Link href="/category/lingerie" className="feature feature-one"><span className="eyebrow">ESSENTIALS</span><h3>Confidence<br/>starts within.</h3><span>Shop lingerie →</span></Link><Link href="/category/nightwear" className="feature feature-two"><span className="eyebrow">COMFORT</span><h3>Your softest<br/>side.</h3><span>Shop nightwear →</span></Link><Link href="/offers" className="feature feature-three"><span className="eyebrow">OFFERS</span><h3>Good style.<br/>Better value.</h3><span>Shop offers →</span></Link></div></section>

    <section className="newsletter"><div><span className="eyebrow dark">STAY IN THE LOOP</span><h2>First access to new drops.</h2><p>Sign in with WhatsApp to receive order updates, launches and selected offers.</p></div><Link className="button dark-button" href="/account">Sign in</Link></section>
  </>;
}
