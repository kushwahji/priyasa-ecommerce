'use client';
import {useState}from'react';
import type {Product}from'@/lib/catalog';
import {ProductCard}from'@/components/ProductCard';

export default function HomeProductGrid({products,initialVisible=10,step=10}:{products:Product[];initialVisible?:number;step?:number}){
 const gridMode=products.length>=18;
 const effectiveInitial=gridMode?Math.min(6,products.length):Math.min(initialVisible,products.length);
 const effectiveStep=gridMode?6:step;
 const [visible,setVisible]=useState(effectiveInitial);
 const shown=products.slice(0,visible);
 if(!products.length)return null;
 return <>
  <div className={`product-grid product-grid-editorial home-product-grid ${gridMode?'home-product-grid--grid':'home-product-grid--rail'}`}>{shown.map(product=><ProductCard key={product.id} product={product}/>)}</div>
  {visible<products.length&&<div className="home-load-more"><button type="button" className="button button-light" onClick={()=>setVisible(v=>Math.min(v+effectiveStep,products.length))}>Load More <span>({products.length-visible} more)</span> ↓</button><small>Showing {visible} of {products.length} styles</small></div>}
 </>;
}
