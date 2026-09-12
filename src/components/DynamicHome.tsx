'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import HomeHeroCarousel from '@/components/HomeHeroCarousel';
import HomeImageCarousel from '@/components/HomeImageCarousel';
import HomeProductGrid from '@/components/HomeProductGrid';
import {getStorefrontCategories,getStorefrontProducts,getProductsForHomeSection} from '@/lib/storefront-data';
import type {HomeCmsSection,StorefrontCategory} from '@/lib/storefront-data';
import type {Product} from '@/lib/catalog';

const clean=(v:any)=>String(v??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const typeOf=(s:HomeCmsSection)=>String(s.type||'').toLowerCase();
const img=(s:any)=>s.imageUrl||s.image_url||'';
const href=(s:any)=>s.ctaHref||s.cta_href||'/shop';
const label=(s:any)=>s.ctaLabel||s.cta_label||'Shop Now';
const itemsOf=(s:any)=>Array.isArray(s?.content?.items)?s.content.items:[];

function Heading({s}:{s:HomeCmsSection}){return <div className="home-section-head"><div>{s.subtitle&&<span className="home-kicker">{clean(s.subtitle)}</span>}<h2>{clean(s.title||'Priyasa')}</h2></div>{(s.ctaHref||s.cta_href)&&<Link className="home-view-all" href={href(s)}>{label(s)} →</Link>}</div>}
function GenericCards({items}:{items:any[]}){if(!items.length)return null;return <div className="home-cms-card-grid">{items.map((x:any,i:number)=><Link href={x.cta_href||x.ctaHref||x.href||'/shop'} className="home-cms-card" key={x.id||i}>{(x.image_url||x.imageUrl)&&<img src={x.image_url||x.imageUrl} alt={clean(x.title||'Priyasa')} loading={i<2?'eager':'lazy'}/>}<div><span>{clean(x.subtitle||'PRIYASA EDIT')}</span><strong>{clean(x.title||'Explore')}</strong>{(x.cta_label||x.ctaLabel)&&<small>{x.cta_label||x.ctaLabel} →</small>}</div></Link>)}</div>}
function CategoryGrid({categories,items}:{categories:StorefrontCategory[];items:any[]}){const cards=items.length?items:categories.map(c=>({id:c.id,title:c.name,image_url:c.imageUrl,cta_href:`/shop?category=${encodeURIComponent(c.slug)}`}));return <GenericCards items={cards}/>}
function CmsVideo({s}:{s:HomeCmsSection}){const url=s.imageUrl||s.image_url||s.content?.video_url||s.content?.videoUrl;if(!url)return null;return <section className="home-cms-video home-section"><video src={url} poster={img(s)||undefined} controls muted playsInline preload="metadata"/><div><span className="home-kicker">{clean(s.subtitle||'PRIYASA')}</span><h2>{clean(s.title||'Watch the latest edit')}</h2>{(s.ctaHref||s.cta_href)&&<Link className="button dark-button" href={href(s)}>{label(s)} →</Link>}</div></section>}
function TextBlock({s}:{s:HomeCmsSection}){return <section className="home-managed-text home-section"><span className="home-kicker">{clean(s.title||'PRIYASA')}</span><div className="home-rich-copy">{clean(s.content?.html||s.subtitle||'')}</div>{(s.ctaHref||s.cta_href)&&<Link className="button" href={href(s)}>{label(s)} →</Link>}</section>}
function Banner({s}:{s:HomeCmsSection}){return <section className="home-managed-banner"><div className="home-managed-banner-copy"><span className="home-kicker">{clean(s.type||'PRIYASA')}</span><h2>{clean(s.title||'The Priyasa Edit')}</h2>{s.subtitle&&<p>{clean(s.subtitle)}</p>}{(s.ctaHref||s.cta_href)&&<Link className="button dark-button" href={href(s)}>{label(s)} →</Link>}</div>{img(s)&&<div className="home-managed-banner-image" style={{backgroundImage:`url(${img(s)})`}}/>}</section>}

export default function DynamicHome({initialSections=[]}:{initialSections?:HomeCmsSection[]}){
 const[sections,setSections]=useState<HomeCmsSection[]>(initialSections);const[categories,setCategories]=useState<StorefrontCategory[]>([]);const[products,setProducts]=useState<Product[]>([]);
 useEffect(()=>{if(initialSections.length)return;fetch('/api/v1/storefront/home').then(r=>r.json()).then(r=>Array.isArray(r?.data?.sections)&&setSections(r.data.sections)).catch(()=>{});},[initialSections.length]);
 useEffect(()=>{getStorefrontCategories().then(setCategories).catch(()=>{});getStorefrontProducts({limit:100}).then(setProducts).catch(()=>{});},[]);
 const ordered=useMemo(()=>[...sections].sort((a,b)=>Number(a.sortOrder??a.sort_order??0)-Number(b.sortOrder??b.sort_order??0)),[sections]);
 const selected=(s:any):Product[]=>{const ids=Array.isArray(s?.content?.product_ids)?s.content.product_ids.map(String):[];if(ids.length)return ids.map((id:string)=>products.find(p=>String(p.id)===id)).filter(Boolean) as Product[];const q=String(s?.content?.query||typeOf(s));return productsForQuery(q,products);};
 function productsForQuery(q:string,all:Product[]){if(q.includes('sale'))return all.filter(p=>p.mrp>p.price).slice(0,12);if(q.includes('new')||q.includes('latest'))return all.slice(0,12);return all.slice(0,12);}
 return <div className="home-reference-v4">{ordered.map((s:any)=>{const t=typeOf(s);const items=itemsOf(s);if(!s.isActive&&s.is_active===false)return null;
  if(t==='hero_slider')return <section className="home-section home-hero-multi home-managed-hero" key={s.id}><HomeHeroCarousel slides={items.length?items.map((x:any,i:number)=>({id:String(x.id||`${s.id}-${i}`),title:x.title||s.title,subtitle:x.subtitle||s.subtitle,imageUrl:x.image_url||x.imageUrl||img(s),mobileImageUrl:x.mobile_image_url||x.mobileImageUrl||x.image_url||x.imageUrl||img(s),ctaLabel:x.cta_label||x.ctaLabel||label(s),ctaHref:x.cta_href||x.ctaHref||href(s)})):[{id:String(s.id),title:s.title,subtitle:s.subtitle,imageUrl:img(s),mobileImageUrl:s.mobileImageUrl||s.mobile_image_url,ctaLabel:label(s),ctaHref:href(s)}]}/></section>;
  if(t==='image_carousel')return <section className="home-section" key={s.id}><Heading s={s}/><HomeImageCarousel slides={items.map((x:any,i:number)=>({id:String(x.id||`${s.id}-${i}`),title:x.title,subtitle:x.subtitle,imageUrl:x.image_url||x.imageUrl,mobileImageUrl:x.mobile_image_url||x.mobileImageUrl,ctaLabel:x.cta_label||x.ctaLabel,ctaHref:x.cta_href||x.ctaHref||'/shop'}))}/></section>;
  if(t==='category_grid')return <section className="home-section" key={s.id}><Heading s={s}/><CategoryGrid categories={categories} items={items}/></section>;
  if(['product_carousel','product_grid','flash_sale','trending','new_arrivals','best_sellers'].includes(t)){const p=selected(s);return <section className="home-section home-product-section" key={s.id}><Heading s={s}/>{p.length?<HomeProductGrid products={p} initialVisible={Math.min(8,p.length)} step={8}/>:<div className="home-cms-empty">Products are being updated.</div>}</section>}
  if(t==='offer'||t==='banner'||t==='collection_showcase'||t==='brand_grid')return <section className="home-section" key={s.id}>{t==='banner'||t==='offer'?<Banner s={s}/>:<><Heading s={s}/><GenericCards items={items}/></>}</section>;
  if(t==='video')return <CmsVideo s={s} key={s.id}/>;
  if(t==='text')return <TextBlock s={s} key={s.id}/>;
  return <section className="home-section" key={s.id}><Heading s={s}/><GenericCards items={items}/></section>;
 })}</div>;
}
