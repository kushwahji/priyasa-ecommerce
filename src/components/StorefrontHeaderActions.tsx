'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {CloseIcon,HeartIcon,BagIcon,SearchIcon,UserIcon} from '@/components/StorefrontIcons';

type CartItem={quantity?:number;name?:string;price?:number;image?:string;color?:string;size?:string};
const KEY='priyasa_cart';
function readCart():CartItem[]{try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value:[]}catch{return []}}
function readCount(items:CartItem[]){return items.reduce((sum,item)=>sum+Math.max(0,Number(item?.quantity||0)),0)}
export function StorefrontHeaderActions(){
 const[items,setItems]=useState<CartItem[]>([]);const[panel,setPanel]=useState<'search'|'cart'|'account'|null>(null);const[query,setQuery]=useState('');
 useEffect(()=>{const sync=()=>setItems(readCart());sync();window.addEventListener('storage',sync);window.addEventListener('priyasa-cart-updated',sync);return()=>{window.removeEventListener('storage',sync);window.removeEventListener('priyasa-cart-updated',sync)}},[]);
 useEffect(()=>{document.body.classList.toggle('e2-panel-open',!!panel);return()=>document.body.classList.remove('e2-panel-open')},[panel]);
 const close=()=>setPanel(null);const count=readCount(items);const subtotal=items.reduce((sum,item)=>sum+(Number(item.price)||0)*(Number(item.quantity)||0),0);
 return <>
  <div className="actions">
   <button type="button" className="header-icon" aria-label="Search" onClick={()=>setPanel('search')}><SearchIcon/></button>
   <button type="button" className="header-icon" aria-label="Account / Login" onClick={()=>setPanel('account')}><UserIcon/></button>
   <Link href="/wishlist" aria-label="Wishlist" className="header-icon"><HeartIcon/></Link>
   <button type="button" className="header-icon" aria-label={`Shopping bag${count?`, ${count} items`:''}`} data-count={count||undefined} onClick={()=>setPanel('cart')}><BagIcon/></button>
  </div>
  {panel&&<><button className="e2-panel-backdrop" aria-label="Close panel" onClick={close}/>
   {panel==='search'&&<section className="e2-panel e2-panel--search" role="dialog" aria-modal="true" aria-label="Search">
    <div className="e2-panel-head"><span className="e2-panel-title">Search Priyasa</span><button className="e2-panel-close" onClick={close} aria-label="Close search"><CloseIcon/></button></div>
    <div className="e2-search-body"><form className="e2-search-form" action="/search" onSubmit={e=>{if(!query.trim())e.preventDefault()}}><SearchIcon/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} name="q" placeholder="Search products, styles & categories" aria-label="Search products"/><button type="submit">Search</button></form><div className="e2-search-label">Trending</div><div className="e2-search-links"><Link href="/new-arrivals" onClick={close}>New Arrivals</Link><Link href="/offers" onClick={close}>Best Offers</Link><Link href="/category/lingerie" onClick={close}>Lingerie</Link><Link href="/category/nightwear" onClick={close}>Nightwear</Link><Link href="/category/ethnic-wear" onClick={close}>Ethnic Wear</Link><Link href="/category/activewear" onClick={close}>Activewear</Link></div></div>
   </section>}
   {panel==='account'&&<aside className="e2-panel" role="dialog" aria-modal="true" aria-label="Account"><div className="e2-panel-head"><span className="e2-panel-title">My Priyasa Account</span><button className="e2-panel-close" onClick={close} aria-label="Close account"><CloseIcon/></button></div><div className="e2-account-body"><div className="e2-account-grid"><Link className="e2-account-link" href="/account" onClick={close}><span>Account overview</span><span>→</span></Link><Link className="e2-account-link" href="/account/orders" onClick={close}><span>My orders</span><span>→</span></Link><Link className="e2-account-link" href="/wishlist" onClick={close}><span>Wishlist</span><span>→</span></Link><Link className="e2-account-link" href="/account/returns" onClick={close}><span>Returns & exchanges</span><span>→</span></Link><Link className="e2-account-link" href="/help" onClick={close}><span>Help Centre</span><span>→</span></Link></div><Link className="e2-account-login" href="/login" onClick={close}>Sign in / Create account</Link></div></aside>}
   {panel==='cart'&&<aside className="e2-panel" role="dialog" aria-modal="true" aria-label="Shopping cart"><div className="e2-panel-head"><span className="e2-panel-title">Shopping Cart ({count})</span><button className="e2-panel-close" onClick={close} aria-label="Close shopping cart"><CloseIcon/></button></div>{items.length?<div className="e2-cart-body"><div className="e2-cart-items">{items.slice(0,8).map((item,index)=><div className="e2-cart-item" key={`${item.name||'item'}-${index}`}>{item.image?<img src={item.image} alt=""/>:<div/>}<div><strong>{item.name||'Product'}</strong><span>{[item.color,item.size].filter(Boolean).join(' · ')||'Selected variant'}</span><span>Qty {Number(item.quantity)||1}</span></div><b>₹{((Number(item.price)||0)*(Number(item.quantity)||0)).toLocaleString('en-IN')}</b></div>)}</div></div>:<div className="e2-cart-body"><div className="e2-cart-empty"><strong>Your cart is empty</strong><span>Discover the latest Priyasa styles.</span></div></div>}<div className="e2-panel-foot"><div className="e2-panel-foot-row"><span>Subtotal</span><strong>₹{subtotal.toLocaleString('en-IN')}</strong></div><Link className="e2-panel-button e2-panel-button--dark" href="/checkout" onClick={close}>Checkout</Link><Link className="e2-panel-button e2-panel-button--light" href="/cart" onClick={close}>View Cart</Link></div></aside>}
  </>}
 </>
}
