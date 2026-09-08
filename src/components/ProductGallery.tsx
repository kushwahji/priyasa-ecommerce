'use client';
import {useEffect,useState} from 'react';
import {SafeImage} from '@/components/SafeImage';

type Props={image:string;name:string;gallery?:string[]};
const isVideo=(src:string)=>/\.(mp4|webm|mov)(\?|#|$)/i.test(src);

export function ProductGallery({image,name,gallery=[]}:Props){
  const images=[...new Set([image,...gallery].filter(Boolean))];
  const[active,setActive]=useState(0);const[zoom,setZoom]=useState(false);const[lightbox,setLightbox]=useState(false);
  const next=()=>setActive(x=>(x+1)%images.length);const prev=()=>setActive(x=>(x-1+images.length)%images.length);
  useEffect(()=>{if(!lightbox)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setLightbox(false);if(e.key==='ArrowRight')next();if(e.key==='ArrowLeft')prev()};document.addEventListener('keydown',onKey);document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow=''}},[lightbox]);
  const src=images[active]||image;const video=isVideo(src);
  return <div className="pdp-gallery premium-pdp-gallery">
    <div className="pdp-thumbs">{images.map((item,i)=><button type="button" key={item+i} className={i===active?'active':''} onClick={()=>setActive(i)} aria-label={`View ${isVideo(item)?'video':'image'} ${i+1}`}><span className="gallery-thumb-media">{isVideo(item)?<video src={item} muted playsInline preload="metadata"/>:<SafeImage src={item} alt="" width={120} height={150}/>}</span>{isVideo(item)&&<span className="gallery-video-mark">▶</span>}</button>)}</div>
    <div className={`pdp-main-image ${zoom?'is-zoomed':''}`}>
      {video?<video className="pdp-main-video" src={src} controls playsInline preload="metadata" aria-label={`${name} product video`}/>:<button type="button" className="gallery-image-button" onClick={()=>setLightbox(true)} aria-label="Open product image fullscreen"><SafeImage src={src} alt={name} width={1000} height={1250} priority className={zoom?'zoomed-image':''}/></button>}
      <button type="button" className="gallery-arrow gallery-prev" onClick={prev} aria-label="Previous media">‹</button><button type="button" className="gallery-arrow gallery-next" onClick={next} aria-label="Next media">›</button>
      {!video&&<button type="button" className="gallery-zoom-button" onClick={()=>setZoom(x=>!x)} aria-label={zoom?'Reset image zoom':'Zoom image'}>{zoom?'−':'⌕'}</button>}
      <button type="button" className="gallery-fullscreen-button" onClick={()=>setLightbox(true)} aria-label="View product fullscreen">⛶</button>
      <div className="gallery-counter">{active+1} / {images.length}</div>
    </div>
    <div className="pdp-mobile-slider">{images.map((item,i)=><button type="button" key={`m${item}${i}`} onClick={()=>setActive(i)} className={i===active?'active':''}>{isVideo(item)?<video src={item} muted playsInline preload="metadata"/>:<SafeImage src={item} alt={i===active?name:''} width={800} height={1000}/>}</button>)}</div>
    <div className="gallery-dots">{images.map((item,i)=><button type="button" key={i} className={i===active?'active':''} onClick={()=>setActive(i)} aria-label={`Media ${i+1}`}/>)}</div>
    {lightbox&&<div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Product media viewer" onClick={()=>setLightbox(false)}><button type="button" className="gallery-lightbox-close" onClick={()=>setLightbox(false)} aria-label="Close fullscreen">×</button><button type="button" className="gallery-lightbox-prev" onClick={e=>{e.stopPropagation();prev()}} aria-label="Previous media">‹</button><div className="gallery-lightbox-content" onClick={e=>e.stopPropagation()}>{video?<video src={src} controls autoPlay playsInline/>:<SafeImage src={src} alt={name} width={1600} height={2000} priority/>}</div><button type="button" className="gallery-lightbox-next" onClick={e=>{e.stopPropagation();next()}} aria-label="Next media">›</button><div className="gallery-lightbox-count">{active+1} / {images.length}</div></div>}
  </div>
}
