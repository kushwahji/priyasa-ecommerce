import Link from 'next/link';
import Image from 'next/image';

const offers=[
  {title:'Flat 50% OFF',text:'On selected styles',code:'PRIYASA50',href:'/shop',image:'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=82'},
  {title:'Extra 20% OFF',text:'On your first order',code:'WELCOME20',href:'/shop',image:'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=82'},
  {title:'Get ₹200 OFF',text:'On orders above ₹1,499',code:'SAVE200',href:'/shop',image:'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=82'}
];

export default function Offers(){return <div className="offers-page">
  <div className="breadcrumbs"><Link href="/">Home</Link> <span> / </span> Offers</div>
  <section className="offers-hero"><div><span className="eyebrow">SPECIAL OFFERS JUST FOR YOU</span><h1>Save more.<br/>Style more.</h1><p>Exclusive fashion offers curated for your next Priyasa look.</p><Link className="button" href="/shop">Shop Now →</Link></div></section>
  <div className="offer-list">{offers.map(o=><article className="offer-row" key={o.code}><Image src={o.image} alt="Priyasa offer" width={145} height={75}/><div><h3>{o.title}</h3><p>{o.text}</p><span className="offer-code">Use Code: {o.code}</span></div><Link className="button" href={o.href}>Shop Now →</Link></article>)}</div>
</div>}
