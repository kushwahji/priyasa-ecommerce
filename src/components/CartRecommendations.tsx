'use client';
import {useEffect,useState} from 'react';
import type {Product} from '@/lib/catalog';
import {ProductCard} from '@/components/ProductCard';
export default function CartRecommendations(){const [products,setProducts]=useState<Product[]>([]);useEffect(()=>{fetch('/api/storefront/search?limit=8',{cache:'no-store'}).then(r=>r.json()).then(d=>setProducts(d.data?.products||[])).catch(()=>{})},[]);if(!products.length)return null;return <section className="section cart-recommendations"><div className="section-head"><div><span className="eyebrow dark">JUST DROPPED</span><h2>Latest launches</h2><p className="section-subtitle">Complete your Priyasa edit with something new.</p></div><a className="text-link" href="/new-arrivals">View all →</a></div><div className="product-grid product-grid-editorial">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div></section>}
