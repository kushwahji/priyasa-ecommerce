'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';

type Promo={active?:boolean;title?:string;subtitle?:string;code?:string|null;ctaLabel?:string;ctaHref?:string};

export default function HomeOfferStrip(){
 const [promo,setPromo]=useState<Promo|null>(null);
 const [dismissed,setDismissed]=useState(false);
 useEffect(()=>{let alive=true;fetch('/api/storefront/promo',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(alive&&d?.active)setPromo(d)}).catch(()=>{});return()=>{alive=false}},[]);
 if(!promo||dismissed)return null;
 return <section className="home-coupon-campaign" aria-label="Special offer">
   <div className="home-coupon-campaign-inner">
    <div className="home-coupon-copy">
      <span className="home-coupon-kicker">Limited time · Priyasa privilege</span>
      <h2>{promo.title||'20% off your next edit'}</h2>
      <p>{promo.subtitle||'Refresh your wardrobe with thoughtfully designed styles. Apply your exclusive coupon at checkout.'}</p>
      <div className="home-coupon-code-row">
       {promo.code&&<span className="home-coupon-code">CODE <b>{promo.code}</b></span>}
       <Link className="button dark-button" href={promo.ctaHref||'/offers'}>{promo.ctaLabel||'Shop the offer'} <span aria-hidden="true">→</span></Link>
      </div>
      <small className="home-coupon-note">Offer availability, minimum order value and exclusions apply.</small>
    </div>
    <div className="home-coupon-art">
      <button type="button" className="home-coupon-close" aria-label="Dismiss offer" onClick={()=>setDismissed(true)}>×</button>
      <img src="/images/home-coupon-card.svg" alt="Priyasa 20 percent off coupon" />
    </div>
   </div>
 </section>;
}
