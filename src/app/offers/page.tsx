import Link from 'next/link';
import SafeImage from '@/components/SafeImage';

const offers = [
  { title: 'Flat 50% OFF', text: 'On selected styles', code: 'PRIYASA50', href: '/shop', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=82' },
  { title: 'Extra 20% OFF', text: 'On your first order', code: 'WELCOME20', href: '/shop', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=82' },
  { title: 'Get ₹200 OFF', text: 'On orders above ₹1,499', code: 'SAVE200', href: '/shop', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=82' }
];

export default function Offers() {
  return <div className="offers-page">
    <div className="breadcrumbs"><Link href="/">Home</Link><span> / </span> Offers</div>
    <section className="offers-hero"><div><span className="eyebrow">SPECIAL OFFERS JUST FOR YOU</span><h1>Special Offers<br />Just for You</h1><p>Fresh fashion, beautiful prices and limited-time savings.</p><Link className="button" href="/shop">Shop Now →</Link></div><div className="offers-hero-art" /></section>
    <div className="offer-tabs"><Link className="active" href="/offers">All Offers</Link><Link href="/new-arrivals">New Arrivals</Link><Link href="/category/women">Women</Link><Link href="/category/kids">Kids</Link><Link href="/category/ethnic-wear">Ethnic</Link><Link href="/category/loungewear">Western</Link></div>
    <section className="offer-list">{offers.map(o => <article className="offer-row" key={o.code}><div className="offer-row-image"><SafeImage src={o.image} alt="Priyasa offer" width={145} height={75} /></div><div><span className="eyebrow">LIMITED OFFER</span><h2>{o.title}</h2><p>{o.text}</p><span className="offer-code">Use Code: {o.code}</span></div><Link className="button" href={o.href}>Shop Now →</Link></article>)}</section>
    <section className="offer-benefits"><div><b>✓</b><span><strong>Easy Returns</strong><small>Hassle-free returns</small></span></div><div><b>✓</b><span><strong>Secure Payment</strong><small>100% protected checkout</small></span></div><div><b>✓</b><span><strong>Fast Delivery</strong><small>Across India</small></span></div></section>
  </div>;
}
