'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {ChevronIcon,CloseIcon,MenuIcon,SearchIcon,UserIcon,TruckIcon,HelpIcon,HeartIcon,GiftIcon} from '@/components/StorefrontIcons';

type MenuItem=[string,string];
type MenuGroup={title:string;items:MenuItem[]};
const groups:MenuGroup[]=[
 {title:'Shop',items:[['Shop All','/shop'],['New Arrivals','/new-arrivals'],['Women','/category/women'],['Men','/category/men'],['Kids','/category/kids'],['Sale & Offers','/offers']]},
 {title:'Discover',items:[['Collections','/collections'],['Best Sellers','/shop?sort=best-selling'],['Under ₹999','/shop?sort=price-low'],['Trending Now','/shop?sort=trending']]},
];
export function MobileMenu(){
 const router=useRouter();const[open,setOpen]=useState(false);
 useEffect(()=>{document.body.classList.toggle('menu-open',open);return()=>document.body.classList.remove('menu-open')},[open]);
 const close=()=>setOpen(false);const navigate=(href:string)=>{close();router.push(href)};
 return <>
  <button className="mobile-menu" aria-label="Open menu" aria-expanded={open} onClick={()=>setOpen(true)}><MenuIcon/></button>
  {open&&<button className="mobile-menu-backdrop" aria-label="Close menu" onClick={close}/>} 
  <aside className={`mobile-drawer ${open?'is-open':''}`} aria-hidden={!open} aria-label="PRIYASA shop menu">
   <div className="mobile-drawer-head"><button type="button" className="mobile-drawer-brand" onClick={()=>navigate('/')} aria-label="PRIYASA home"><img src="/images/priyasa-logo.svg" alt="PRIYASA"/><span>Every You, Beautiful.</span></button><button type="button" aria-label="Close menu" onClick={close}><CloseIcon/></button></div>
   <div className="mobile-drawer-account"><div><UserIcon/><div><strong>Hello, beautiful!</strong><span>Sign in for a more personalised Priyasa experience</span></div></div><button type="button" onClick={()=>navigate('/login')}>Login / Sign up <ChevronIcon/></button></div>
   <div className="mobile-drawer-search"><button type="button" onClick={()=>navigate('/search')}><SearchIcon/><span>Search products, styles &amp; categories</span></button></div>
   <nav className="mobile-drawer-nav" aria-label="Shop menu">{groups.map(group=><section key={group.title} className="mobile-drawer-group"><h3>{group.title}</h3>{group.items.map(([label,href])=><Link href={href} key={href} onClick={close}><span>{label}</span><ChevronIcon/></Link>)}</section>)}</nav>
   <div className="mobile-drawer-foot"><Link href="/wishlist" onClick={close}><HeartIcon/><span>Wishlist</span></Link><Link href="/account/orders" onClick={close}><TruckIcon/><span>Orders</span></Link><Link href="/offers" onClick={close}><GiftIcon/><span>Offers</span></Link><Link href="/help" onClick={close}><HelpIcon/><span>Help</span></Link></div>
  </aside>
 </>;
}
