'use client';
import {useEffect,useMemo,useState} from 'react';

type Props={image?:string|null;name:string;productId?:string|null;gallery?:string[]|null};
const FALLBACK='/images/product-placeholder.svg';
const API_BASE=(process.env.NEXT_PUBLIC_PRIYASA_API_BASE_URL||process.env.NEXT_PUBLIC_API_BASE_URL||'https://api.priyasa.com').replace(/\/$/,'');
const isVideo=(src:string)=>/\.(mp4|webm|mov)(\?|#|$)/i.test(src);
function mediaSrc(value:string){const src=value.trim();if(!src)return FALLBACK;if(/^https?:\/\//i.test(src)||src.startsWith('data:')||src.startsWith('blob:'))return src;if(src.startsWith('//'))return `https:${src}`;return `${API_BASE}/${src.replace(/^\/+/, '')}`;}
function collectMedia(value:any,out:string[]=[]):string[]{if(typeof value==='string'){const v=value.trim();if(v)out.push(v);return out;}if(Array.isArray(value)){value.forEach(item=>collectMedia(item,out));return out;}if(value&&typeof value==='object'){const preferred=['url','image_url','imageUrl','src','path','original_url','originalUrl','secure_url','secureUrl','media_url','mediaUrl'];let found=false;for(const key of preferred){if(value[key]!=null){found=true;collectMedia(value[key],out);}}if(!found)Object.values(value).forEach(item=>collectMedia(item,out));}return out;}
function MediaImage({src,alt,className}:{src:string;alt:string;className?:string}){const[failed,setFailed]=useState(false);const resolved=mediaSrc(src);return <img src={failed?FALLBACK:resolved} alt={alt} className={className} loading="eager" decoding="async" onError={()=>{setFailed(true);window.dispatchEvent(new CustomEvent('priyasa:pdp-media-failed'))}}/>}

export function ProductGallery({image,name,productId,gallery=[]}:Props){
  const initialImages=useMemo(()=>[...new Set([image||'',...(gallery||[])].filter(Boolean))],[image,gallery]);
  const[remoteImages,setRemoteImages]=useState<string[]>([]);const[active,setActive]=useState(0);const[zoom,setZoom]=useState(false);const[lightbox,setLightbox]=useState(false);const[mediaFailed,setMediaFailed]=useState(false);
  useEffect(()=>{const handler=()=>setMediaFailed(true);window.addEventListener('priyasa:pdp-media-failed',handler);return()=>window.removeEventListener('priyasa:pdp-media-failed',handler)},[]);
  useEffect(()=>{if(!productId||(!mediaFailed&&initialImages.some(src=>src&&src!==FALLBACK)))return;let cancelled=false;(async()=>{try{const r=await fetch(`/api/products/${encodeURIComponent(productId)}`,{cache:'no-store'});if(!r.ok)return;const body=await r.json().catch(()=>null);const data=body?.data?.product??body?.data?.data??body?.data??body?.product??body;const found=collectMedia(data);if(!cancelled)setRemoteImages([...new Set(found)]);}catch{}})();return()=>{cancelled=true}},[productId,initialImages,mediaFailed]);
  const images=useMemo(()=>[...new Set([...initialImages,...remoteImages].filter(Boolean))], [initialImages,remoteImages]);
  const hasMultiple=images.length>1;
  useEffect(()=>{if(active>=images.length)setActive(0)},[active,images.length]);
  const next=()=>setActive(x=>hasMultiple?(x+1)%images.length:0);const prev=()=>setActive(x=>hasMultiple?(x-1+images.length)%images.length:0);
  useEffect(()=>{if(!lightbox)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setLightbox(false);if(e.key==='ArrowRight')next();if(e.key==='ArrowLeft')prev()};document.addEventListener('keydown',onKey);document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow=''}},[lightbox,hasMultiple]);
  const src=images[active]||FALLBACK;const video=isVideo(src);const resolvedSrc=mediaSrc(src);
  return <div className="pdp-gallery premium-pdp-gallery">
    {hasMultiple&&<div className="pdp-thumbs">{images.map((item,i)=><button type="button" key={item+i} className={i===active?'active':''} onClick={()=>setActive(i)} aria-label={`View ${isVideo(item)?'video':'image'} ${i+1}`}><span className="gallery-thumb-media">{isVideo(item)?<video src={mediaSrc(item)} muted playsInline preload="metadata"/>:<MediaImage src={item} alt=""/>}</span>{isVideo(item)&&<span className="gallery-video-mark">▶</span>}</button>)}</div>}
    <div className={`pdp-main-image ${zoom?'is-zoomed':''}`}>
      {video?<video className="pdp-main-video" src={resolvedSrc} controls playsInline preload="metadata" aria-label={`${name} product video`}/>:<button type="button" className="gallery-image-button" onClick={()=>setLightbox(true)} aria-label="Open product image fullscreen"><MediaImage src={src} alt={name} className={zoom?'zoomed-image':''}/></button>}
      {hasMultiple&&<><button type="button" className="gallery-arrow gallery-prev" onClick={prev} aria-label="Previous media">‹</button><button type="button" className="gallery-arrow gallery-next" onClick={next} aria-label="Next media">›</button></>}
      {!video&&<button type="button" className="gallery-zoom-button" onClick={()=>setZoom(x=>!x)} aria-label={zoom?'Reset image zoom':'Zoom image'}>{zoom?'−':'⌕'}</button>}
      <button type="button" className="gallery-fullscreen-button" onClick={()=>setLightbox(true)} aria-label="View product fullscreen">⛶</button>
      <div className="gallery-counter">{active+1} / {images.length}</div>
    </div>
    {hasMultiple&&<div className="pdp-mobile-slider">{images.map((item,i)=><button type="button" key={`m${item}${i}`} onClick={()=>setActive(i)} className={i===active?'active':''}>{isVideo(item)?<video src={mediaSrc(item)} muted playsInline preload="metadata"/>:<MediaImage src={item} alt={i===active?name:''}/>}</button>)}</div>}
    {hasMultiple&&<div className="gallery-dots">{images.map((item,i)=><button type="button" key={i} className={i===active?'active':''} onClick={()=>setActive(i)} aria-label={`Media ${i+1}`}/>)}</div>}
    {lightbox&&<div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Product media viewer" onClick={()=>setLightbox(false)}><button type="button" className="gallery-lightbox-close" onClick={()=>setLightbox(false)} aria-label="Close fullscreen">×</button>{hasMultiple&&<button type="button" className="gallery-lightbox-prev" onClick={e=>{e.stopPropagation();prev()}} aria-label="Previous media">‹</button>}<div className="gallery-lightbox-content" onClick={e=>e.stopPropagation()}>{video?<video src={resolvedSrc} controls autoPlay playsInline/>:<MediaImage src={src} alt={name}/>}</div>{hasMultiple&&<button type="button" className="gallery-lightbox-next" onClick={e=>{e.stopPropagation();next()}} aria-label="Next media">›</button>}<div className="gallery-lightbox-count">{active+1} / {images.length}</div></div>}
  </div>
}
