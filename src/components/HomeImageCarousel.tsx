'use client';
import Link from 'next/link';
import {useEffect,useMemo,useRef,useState} from 'react';

type Slide={id:string;title?:string|null;subtitle?:string|null;imageUrl?:string|null;mobileImageUrl?:string|null;ctaLabel?:string|null;ctaHref?:string|null};

export default function HomeImageCarousel({slides}:{slides:Slide[]}){
 const [page,setPage]=useState(0);
 const [perView,setPerView]=useState(4);
 const startX=useRef<number|null>(null);
 const startY=useRef<number|null>(null);
 useEffect(()=>{const update=()=>setPerView(window.innerWidth<=760?2:4);update();window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update)},[]);
 const totalPages=Math.max(1,Math.ceil(slides.length/perView));
 useEffect(()=>{setPage(v=>Math.min(v,totalPages-1))},[totalPages]);
 useEffect(()=>{if(totalPages<2)return;const id=window.setInterval(()=>setPage(v=>(v+1)%totalPages),5000);return()=>window.clearInterval(id)},[totalPages]);
 const visible=useMemo(()=>{if(!slides.length)return [];const start=page*perView;return Array.from({length:perView},(_,i)=>slides[(start+i)%slides.length]).filter(Boolean)},[page,perView,slides]);
 if(!slides.length)return null;
 const next=()=>setPage(v=>(v+1)%totalPages);
 const prev=()=>setPage(v=>(v-1+totalPages)%totalPages);
 const touchStart=(e:React.TouchEvent)=>{const t=e.changedTouches[0];startX.current=t.clientX;startY.current=t.clientY};
 const touchEnd=(e:React.TouchEvent)=>{if(startX.current===null||startY.current===null)return;const t=e.changedTouches[0],dx=t.clientX-startX.current,dy=t.clientY-startY.current;startX.current=null;startY.current=null;if(Math.abs(dx)<40||Math.abs(dx)<Math.abs(dy))return;dx<0?next():prev()};
 const imageError=(e:React.SyntheticEvent<HTMLImageElement>)=>{if(e.currentTarget.dataset.fallback)return;e.currentTarget.dataset.fallback='1';e.currentTarget.src='/images/product-placeholder.svg'};
 return <section className="home-image-carousel home-image-carousel-grid" onTouchStart={touchStart} onTouchEnd={touchEnd} aria-roledescription="carousel" aria-label="Priyasa collection highlights">
   <div className="home-image-carousel-track">
    {visible.map((s,i)=><article className="home-image-carousel-card" key={`${s.id}-${page}-${i}`}>
      <Link href={s.ctaHref||'/shop'} aria-label={s.title||'Explore Priyasa collection'}>
       <picture><source media="(max-width:760px)" srcSet={s.mobileImageUrl||s.imageUrl||'/images/product-placeholder.svg'}/><img src={s.imageUrl||'/images/product-placeholder.svg'} alt={s.title||'Priyasa collection'} onError={imageError}/></picture>
       <div className="home-image-carousel-card-copy"><span>{s.subtitle||'EXCLUSIVE OFFER'}</span><strong>{s.title||'Explore the edit'}</strong>{s.ctaLabel&&<small>{s.ctaLabel} →</small>}</div>
      </Link>
    </article>)}
   </div>
   {totalPages>1&&<>
    <button type="button" className="home-image-carousel-control prev" onClick={prev} aria-label="Previous collection page">‹</button>
    <button type="button" className="home-image-carousel-control next" onClick={next} aria-label="Next collection page">›</button>
   </>}
   <div className="home-image-carousel-dots" role="tablist" aria-label="Collection pages">{Array.from({length:totalPages},(_,i)=><button type="button" key={i} className={i===page?'active':''} onClick={()=>setPage(i)} aria-label={`Show collection page ${i+1}`} aria-selected={i===page} role="tab"/>)}</div>
 </section>
}

<style jsx global>{`
.home-image-carousel-grid{position:relative!important;width:100%!important;margin:0!important;padding:0!important;overflow:hidden!important}
.home-image-carousel-grid .home-image-carousel-track{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important;width:100%!important}
.home-image-carousel-grid .home-image-carousel-card{position:relative!important;min-width:0!important;aspect-ratio:0.72!important;overflow:hidden!important;background:#f6f1f1!important}
.home-image-carousel-grid .home-image-carousel-card>a{display:block!important;position:relative!important;width:100%!important;height:100%!important;color:inherit!important;text-decoration:none!important}
.home-image-carousel-grid .home-image-carousel-card picture,.home-image-carousel-grid .home-image-carousel-card img{display:block!important;width:100%!important;height:100%!important}
.home-image-carousel-grid .home-image-carousel-card img{object-fit:cover!important;transition:transform .45s ease!important}
.home-image-carousel-grid .home-image-carousel-card:hover img{transform:scale(1.025)!important}
.home-image-carousel-grid .home-image-carousel-card-copy{position:absolute!important;left:0!important;right:0!important;bottom:0!important;padding:34px 18px 18px!important;color:#fff!important;background:linear-gradient(180deg,transparent,rgba(18,10,13,.78))!important;text-shadow:0 1px 8px rgba(0,0,0,.22)!important}
.home-image-carousel-grid .home-image-carousel-card-copy span{display:block!important;margin-bottom:5px!important;font-size:8px!important;letter-spacing:1.8px!important;font-weight:700!important}
.home-image-carousel-grid .home-image-carousel-card-copy strong{display:block!important;font-size:18px!important;line-height:1.08!important;font-weight:500!important}
.home-image-carousel-grid .home-image-carousel-card-copy small{display:block!important;margin-top:8px!important;font-size:9px!important;letter-spacing:1.2px!important;font-weight:700!important}
.home-image-carousel-grid .home-image-carousel-control{position:absolute!important;top:50%!important;z-index:5!important;width:40px!important;height:40px!important;padding:0!important;border:1px solid rgba(0,0,0,.1)!important;border-radius:50%!important;background:rgba(255,255,255,.95)!important;color:#111!important;transform:translateY(-50%)!important;font-size:26px!important;line-height:1!important;cursor:pointer!important;box-shadow:0 4px 16px rgba(0,0,0,.1)!important}
.home-image-carousel-grid .home-image-carousel-control.prev{left:10px!important}.home-image-carousel-grid .home-image-carousel-control.next{right:10px!important}
.home-image-carousel-grid .home-image-carousel-dots{display:flex!important;justify-content:center!important;gap:6px!important;padding:12px 0 2px!important}
.home-image-carousel-grid .home-image-carousel-dots button{width:22px!important;height:2px!important;padding:0!important;border:0!important;background:#cfc6c6!important;cursor:pointer!important}.home-image-carousel-grid .home-image-carousel-dots button.active{width:38px!important;background:#a81132!important}
@media(max-width:760px){.home-image-carousel-grid .home-image-carousel-track{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.home-image-carousel-grid .home-image-carousel-card{aspect-ratio:.67!important}.home-image-carousel-grid .home-image-carousel-card-copy{padding:28px 10px 11px!important}.home-image-carousel-grid .home-image-carousel-card-copy span{font-size:6px!important;letter-spacing:1px!important}.home-image-carousel-grid .home-image-carousel-card-copy strong{font-size:13px!important}.home-image-carousel-grid .home-image-carousel-card-copy small{font-size:7px!important;margin-top:5px!important}.home-image-carousel-grid .home-image-carousel-control{width:32px!important;height:32px!important;font-size:21px!important}.home-image-carousel-grid .home-image-carousel-control.prev{left:5px!important}.home-image-carousel-grid .home-image-carousel-control.next{right:5px!important}.home-image-carousel-grid .home-image-carousel-dots{padding-top:9px!important}}
`}</style>
