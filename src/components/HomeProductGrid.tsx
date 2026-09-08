'use client';
import {useState} from 'react';
import type {Product} from '@/lib/catalog';
import {ProductCard} from '@/components/ProductCard';

export default function HomeProductGrid({products,initialVisible=10,step=10}:{products:Product[];initialVisible?:number;step?:number}){
 const [visible,setVisible]=useState(Math.min(initialVisible,products.length));
 const shown=products.slice(0,visible);
 if(!products.length)return null;
 return <>
  <div className="product-grid product-grid-editorial home-product-grid">{shown.map(product=><ProductCard key={product.id} product={product}/>)}</div>
  {visible<products.length&&<div className="home-load-more"><button type="button" className="button button-light" onClick={()=>setVisible(v=>Math.min(v+step,products.length))}>Load More <span>({products.length-visible} more)</span> ↓</button><small>Showing {visible} of {products.length} styles</small></div>}
 </>;
}
