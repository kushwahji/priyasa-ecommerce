'use client';
import { useState } from 'react';

export function AddToCart({ variantId, productId, name, price, image }: {variantId:string;productId:string;name:string;price:number;image?:string}) {
  const [busy,setBusy]=useState(false); const [done,setDone]=useState(false);
  async function add(){ setBusy(true); try { const key='priyasa_cart'; const cart=JSON.parse(localStorage.getItem(key)||'[]'); const i=cart.findIndex((x:any)=>x.variantId===variantId); if(i>=0) cart[i].quantity++; else cart.push({variantId,productId,name,price,image,quantity:1}); localStorage.setItem(key,JSON.stringify(cart)); window.dispatchEvent(new Event('priyasa-cart-updated')); setDone(true); } finally { setBusy(false); } }
  return <button className="button" onClick={add} disabled={busy}>{done?'Added to Cart':busy?'Adding…':'Add to Cart'}</button>;
}
