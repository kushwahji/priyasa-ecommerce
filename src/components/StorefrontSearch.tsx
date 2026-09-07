'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import type {Product} from '@/lib/catalog';
import {ProductCard} from '@/components/ProductCard';
import {SearchIcon} from '@/components/StorefrontIcons';

type Category={name:string;slug:string};
export default function StorefrontSearch({initialQuery=''}:{initialQuery?:string}){
 const [query,setQuery]=useState(initialQuery);const [products,setProducts]=useState<Product[]>([]);const [categories,setCategories]=useState<Category[]>([]);const [loading,setLoading]=useState(true);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 async function run(value:string){setLoading(true);try{const r=await fetch(`/api/storefront/search?q=${encodeURIComponent(value)}&limit=12`,{cache:'no-store'});const d=await r.json();if(r.ok){setProducts(d.data?.products||[]);setCategories(d.data?.categories||[])}}finally{setLoading(false)}}
 useEffect(()=>{run(initialQuery)},[initialQuery]);
 useEffect(()=>{if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{run(query);if(typeof window!=='undefined'){const u=new URL(window.location.href);if(query)u.searchParams.set('q',query);else u.searchParams.delete('q');window.history.replaceState({},'',u)}} ,220);return()=>{if(timer.current)clearTimeout(timer.current)}},[query]);
 return <div className="search-experience"><div className="search-hero"><span className="eyebrow dark">FIND YOUR PRIYASA EDIT</span><h1>What are you looking for?</h1><div className="search-input-wrap"><SearchIcon/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search dresses, nightwear, ethnic wear..." aria-label="Search products" autoComplete="off"/><button type="button" onClick={()=>setQuery('')} aria-label="Clear search">{query?'×':''}</button></div><div className="search-chips"><span>Try</span>{['New arrivals','Festival collection','Ethnic wear','Nightwear','Sale'].map(x=><button key={x} onClick={()=>setQuery(x)}>{x}</button>)}</div></div>{query&&categories.length>0&&<div className="search-category-suggestions"><span>Collections</span>{categories.map(c=><Link key={c.slug} href={`/category/${c.slug}`}>{c.name} →</Link>)}</div>}<section className="section search-results-section"><div className="section-head"><div><span className="eyebrow dark">{query?'SEARCH RESULTS':'LATEST LAUNCHES'}</span><h2>{query?`Results for “${query}”`:'Fresh from Priyasa'}</h2></div>{query&&<span className="search-count">{products.length} shown</span>}</div>{loading?<div className="search-loading">Finding your edit…</div>:products.length?<div className="product-grid product-grid-editorial">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<div className="search-empty"><h3>No exact match yet.</h3><p>Try a category, colour, size or a simpler product name.</p><button className="button" onClick={()=>setQuery('')}>Explore latest launches</button></div>}</section></div>
}
