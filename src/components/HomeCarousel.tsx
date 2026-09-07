'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';

type Slide={id:string;title?:string|null;subtitle?:string|null;imageUrl?:string|null;mobileImageUrl?:string|null;ctaLabel?:string|null;ctaHref?:string|null};
export default function HomeCarousel({slides,hero=false}:{slides:Slide[];hero?:boolean}){
 const [index,setIndex]=useState(0);
 useEffect(()=>{if(slides.length<2)return;const t=window.setInterval(()=>setIndex(i=>(i+1)%slides.length),6000);return()=>window.clearInterval(t)},[slides.length]);
 if(!slides.length)return null;
 return <section className={hero?'home-slider home-hero-slider':'home-slider'} aria-label={hero?'Featured Priyasa collections':'Priyasa campaign carousel'}>
  {slides.map((s,i)=><article key={s.id} className={`home-slide ${i===index?'is-active':''}`} aria-hidden={i!==index}>
   <picture>{s.mobileImageUrl&&<source media="(max-width: 700px)" srcSet={s.mobileImageUrl}/>}<img src={s.imageUrl||'/images/product-placeholder.svg'} alt={s.title||'Priyasa collection'} loading={i===0?'eager':'lazy'}/></picture>
   <div className="home-slide-overlay"><span className="eyebrow">{s.subtitle||'PRIYASA COLLECTIONS'}</span>{s.title&&<h2>{s.title}</h2>}{s.ctaHref&&<Link className="button" href={s.ctaHref}>{s.ctaLabel||'Shop now'} →</Link>}</div>
  </article>)}
  {slides.length>1&&<><div className="home-slider-controls"><button type="button" onClick={()=>setIndex(i=>(i-1+slides.length)%slides.length)} aria-label="Previous slide">←</button><div>{slides.map((s,i)=><button key={s.id} className={i===index?'active':''} type="button" onClick={()=>setIndex(i)} aria-label={`Go to slide ${i+1}`}/>)}</div><button type="button" onClick={()=>setIndex(i=>(i+1)%slides.length)} aria-label="Next slide">→</button></div></>}
 </section>;
}
