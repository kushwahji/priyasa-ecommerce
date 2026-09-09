'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';

type Promo={active?:boolean;title?:string;subtitle?:string;code?:string|null;ctaLabel?:string;ctaHref?:string};

export default function HomeOfferStrip(){
 const [promo,setPromo]=useState<Promo|null>(null);
 useEffect(()=>{let alive=true;fetch('/api/storefront/promo',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(alive&&d?.active)setPromo(d)}).catch(()=>{});return()=>{alive=false}},[]);
 if(!promo)return null;
 return <section className="home-offer-strip" aria-label="Special offer">
   <div className="home-offer-strip-inner">
    <span className="home-offer-label">LIMITED TIME</span>
    <div className="home-offer-copy"><strong>{promo.title||'Special Offer'}</strong>{promo.subtitle&&<span>{promo.subtitle}</span>}</div>
    {promo.code&&<span className="home-offer-code">CODE <b>{promo.code}</b></span>}
    <Link className="home-offer-cta" href={promo.ctaHref||'/offers'}>{promo.ctaLabel||'Shop Now'} <span>→</span></Link>
   </div>
 </section>;
}
