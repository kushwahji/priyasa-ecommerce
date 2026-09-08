'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import type {Product} from '@/lib/catalog';
import {ProductCard} from '@/components/ProductCard';

type Props={productId?:string;seedIds?:string[];title?:string;eyebrow?:string;subtitle?:string;limit?:number;excludeIds?:string[]};
export default function RecommendationRail({productId,seedIds=[],title='You may also like',eyebrow='CURATED FOR YOU',subtitle,limit=8,excludeIds=[]}:Props){
 const[products,setProducts]=useState<Product[]>([]);const[loading,setLoading]=useState(true);
 useEffect(()=>{let dead=false;const ids=[...new Set([...(productId?[productId]:[]),...seedIds])].filter(Boolean);const p=new URLSearchParams({limit:String(limit)});if(ids.length)p.set('seedIds',ids.join(','));if(excludeIds.length)p.set('excludeIds',excludeIds.join(','));fetch('/api/storefront/search?'+p.toString(),{cache:'no-store'}).then(r=>r.json()).then(d=>{if(!dead)setProducts(d.data?.recommendations||[])}).catch(()=>{}).finally(()=>{if(!dead)setLoading(false)});return()=>{dead=true}},[productId,seedIds.join(','),excludeIds.join(','),limit]);
 if(loading||!products.length)return null;
 return <section className="section recommendation-rail"><div className="section-head"><div><span className="eyebrow dark">{eyebrow}</span><h2>{title}</h2>{subtitle&&<p className="section-subtitle">{subtitle}</p>}</div><Link className="text-link" href="/shop">Explore all →</Link></div><div className="product-grid product-grid-editorial">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div></section>
}
