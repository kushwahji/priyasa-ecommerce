'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import type {Product} from '@/lib/catalog';
import {ProductCard} from '@/components/ProductCard';
import {SearchIcon} from '@/components/StorefrontIcons';

type Category={name:string;slug:string};
const TRENDING=['Kurtis','Anarkali','Kurta Set','Cotton Kurti','Festive Wear'];
const RECENT_KEY='priyasa_recent_searches';

export default function StorefrontSearch({initialQuery=''}:{initialQuery?:string}){
 const [query,setQuery]=useState(initialQuery);
 const [products,setProducts]=useState<Product[]>([]);
 const [categories,setCategories]=useState<Category[]>([]);
 const [loading,setLoading]=useState(true);
 const [focused,setFocused]=useState(false);
 const [recent,setRecent]=useState<string[]>([]);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);

 useEffect(()=>{try{setRecent(JSON.parse(localStorage.getItem(RECENT_KEY)||'[]').slice(0,6))}catch{}},[]);
 async function run(value:string){setLoading(true);try{const r=await fetch(`/api/storefront/search?q=${encodeURIComponent(value)}&limit=12`,{cache:'no-store'});const d=await r.json();if(r.ok){setProducts(d.data?.products||[]);setCategories(d.data?.categories||[])}}catch{}finally{setLoading(false)}}
 function remember(value:string){const q=value.trim();if(!q)return;setRecent(prev=>{const next=[q,...prev.filter(x=>x.toLowerCase()!==q.toLowerCase())].slice(0,6);try{localStorage.setItem(RECENT_KEY,JSON.stringify(next))}catch{}return next})}
 useEffect(()=>{run(initialQuery)},[initialQuery]);
 useEffect(()=>{if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{run(query);if(typeof window!=='undefined'){const u=new URL(window.location.href);if(query)u.searchParams.set('q',query);else u.searchParams.delete('q');window.history.replaceState({},'',u)}},220);return()=>{if(timer.current)clearTimeout(timer.current)}},[query]);
 const liveCategories=categories.filter(c=>c.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0,5);
 const liveProducts=products.slice(0,4);
 return <div className="search-experience">
  <div className="search-hero"><span className="eyebrow dark">FIND YOUR PRIYASA EDIT</span><h1>What are you looking for?</h1>
   <div className="search-input-wrap"><SearchIcon/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setTimeout(()=>setFocused(false),150)} placeholder="Search kurtis, dresses, ethnic wear..." aria-label="Search products" autoComplete="off"/><button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>{setQuery('');setFocused(true)}} aria-label="Clear search">{query?'×':''}</button>
    {focused&&!query&&<div className="search-suggestion-panel"><div><b>Trending searches</b>{TRENDING.map(x=><button key={x} onMouseDown={()=>{setQuery(x);remember(x)}}>⌕ {x}</button>)}</div>{recent.length>0&&<div><b>Recent searches</b>{recent.map(x=><button key={x} onMouseDown={()=>setQuery(x)}>↻ {x}</button>)}</div>}</div>}
    {focused&&query&&(!loading)&&(liveCategories.length>0||liveProducts.length>0)&&<div className="search-suggestion-panel live"><b>Suggestions</b>{liveCategories.map(c=><Link key={c.slug} href={`/category/${c.slug}`} onMouseDown={()=>remember(query)}>Category · {c.name} →</Link>)}{liveProducts.map(p=><Link key={p.id} href={`/product/${p.slug}`} onMouseDown={()=>remember(query)}><img src={p.image||'/images/product-placeholder.svg'} alt=""/><span>{p.name}<small>{p.category}</small></span></Link>)}<button className="search-see-all" onMouseDown={()=>remember(query)}>Search all results →</button></div>}
   </div>
   <div className="search-chips"><span>Try</span>{TRENDING.map(x=><button key={x} onClick={()=>{setQuery(x);remember(x)}}>{x}</button>)}</div>
  </div>
  {query&&categories.length>0&&<div className="search-category-suggestions"><span>Collections</span>{categories.map(c=><Link key={c.slug} href={`/category/${c.slug}`}>{c.name} →</Link>)}</div>}
  <section className="section search-results-section"><div className="section-head"><div><span className="eyebrow dark">{query?'SEARCH RESULTS':'LATEST LAUNCHES'}</span><h2>{query?`Results for “${query}”`:'Fresh from Priyasa'}</h2></div>{query&&<span className="search-count">{products.length} shown</span>}</div>{loading?<div className="search-loading">Finding your edit…</div>:products.length?<div className="product-grid product-grid-editorial">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<div className="search-empty"><h3>No exact match yet.</h3><p>Try a category, colour, size or a simpler product name.</p><button className="button" onClick={()=>setQuery('')}>Explore latest launches</button></div>}</section>
 </div>
}
