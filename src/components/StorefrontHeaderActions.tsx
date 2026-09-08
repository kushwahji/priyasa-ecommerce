'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {SearchIcon,HeartIcon,BagIcon} from '@/components/StorefrontIcons';

type CartItem={quantity?:number};
const KEY='priyasa_cart';
function readCount(){try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value.reduce((sum,item:CartItem)=>sum+Math.max(0,Number(item?.quantity||0)),0):0}catch{return 0}}
export function StorefrontHeaderActions(){
 const[count,setCount]=useState(0);
 useEffect(()=>{const sync=()=>setCount(readCount());sync();window.addEventListener('storage',sync);window.addEventListener('priyasa-cart-updated',sync);return()=>{window.removeEventListener('storage',sync);window.removeEventListener('priyasa-cart-updated',sync)}},[]);
 return <div className="actions"><Link href="/search" aria-label="Search" className="header-icon"><SearchIcon/></Link><Link href="/wishlist" aria-label="Wishlist" className="header-icon"><HeartIcon/></Link><Link href="/cart" aria-label={`Shopping bag${count?`, ${count} items`:''}`} className="header-icon" data-count={count||undefined}><BagIcon/></Link></div>
}
