'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {money} from '@/lib/catalog';
import {SafeImage} from '@/components/SafeImage';

type Item={variantId:string;productId:string;name:string;price:number;quantity:number;image?:string};
type Product={id:string;name:string;slug:string;price:number;mrp:number;image:string;category?:string;categorySlug?:string;badge?:string};
const CART_KEY='priyasa_cart';
const load=():Item[]=>{try{const x=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}};
export default function SmartCartExtras(){
 const[items,setItems]=useState<Item[]>([]);const[products,setProducts]=useState<Product[]>([]);const[open,setOpen]=useState(false);
 useEffect(()=>{const sync=()=>{setItems(load());setOpen(true)};setItems(load());window.addEventListener('priyasa-cart-updated',sync);return()=>window.removeEventListener('priyasa-cart-updated',sync)},[]);
 useEffect(()=>{fetch('/api/storefront/search?limit=12',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>setProducts(d?.data?.products||[])).catch(()=>{})},[]);
 const count=items.reduce((s,i)=>s+Number(i.quantity||0),0);const subtotal=items.reduce((s,i)=>s+i.price*i.quantity,0);const remaining=Math.max(0,999-subtotal);const progress=Math.min(100,subtotal/999*100);
 const suggestions=useMemo(()=>products.filter(p=>!items.some(i=>i.productId===p.id)).slice(0,3),[products,items]);
 function add(p:Product){const next=[...items];const i=next.findIndex(x=>x.productId===p.id);if(i>=0)next[i]={...next[i],quantity:Math.min(20,next[i].quantity+1)};else next.push({variantId:p.id,productId:p.id,name:p.name,price:p.price,image:p.image,quantity:1});localStorage.setItem(CART_KEY,JSON.stringify(next));setItems(next);window.dispatchEvent(new Event('priyasa-cart-updated'));}
 return <>
  {open&&count>0&&<div className="smart-cart-drawer" role="dialog" aria-label="Shopping bag"><button className="smart-cart-backdrop" aria-label="Close shopping bag" onClick={()=>setOpen(false)}/><aside className="smart-cart-panel"><header><div><span className="eyebrow dark">YOUR EDIT</span><h2>Shopping bag <small>{count}</small></h2></div><button className="smart-cart-close" onClick={()=>setOpen(false)} aria-label="Close">×</button></header><div className="smart-cart-progress"><strong>{remaining>0?<>Add {money(remaining)} more for <b>FREE SHIPPING</b></>:<>🎉 <b>Free shipping unlocked</b></>}</strong><div><span style={{width:`${progress}%`}}/></div></div><div className="smart-cart-items">{items.map(i=><div className="smart-cart-item" key={i.variantId}><SafeImage src={i.image||'/images/placeholder.svg'} alt={i.name} width={82} height={104}/><div><strong>{i.name}</strong><span>{money(i.price)} × {i.quantity}</span></div></div>)}</div>{suggestions.length>0&&<section className="smart-cart-suggestions"><div className="smart-cart-section-title"><strong>Complete your edit</strong><span>Picked for you</span></div>{suggestions.map(p=><article key={p.id}><SafeImage src={p.image} alt={p.name} width={58} height={72}/><div><strong>{p.name}</strong><span>{money(p.price)}</span></div><button onClick={()=>add(p)}>+ Add</button></article>)}</section>}<footer><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><Link href="/cart" onClick={()=>setOpen(false)} className="button">View bag</Link><Link href="/checkout" onClick={()=>setOpen(false)} className="button dark-button">Checkout securely</Link><small>Taxes, shipping and final discounts are validated at checkout.</small></footer></aside></div>}
 </>;
}
