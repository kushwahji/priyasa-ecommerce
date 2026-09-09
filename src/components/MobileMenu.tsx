'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ChevronIcon,CloseIcon,MenuIcon,SearchIcon,UserIcon,WalletIcon,TruckIcon,HelpIcon,HeartIcon,GiftIcon} from '@/components/StorefrontIcons';

type MenuItem=[string,string];
type MenuGroup={title:string;items:MenuItem[]};

const groups:MenuGroup[]=[
  {title:'Shop',items:[['Shop All','/shop'],['New Arrivals','/new-arrivals'],['Women','/category/women'],['Men','/category/men'],['Kids','/category/kids'],['Sale & Offers','/offers']]},
  {title:'Categories',items:[['Lingerie','/category/lingerie'],['Nightwear','/category/nightwear'],['Ethnic Wear','/category/ethnic-wear'],['Activewear','/category/activewear'],['Loungewear','/category/loungewear'],['Accessories','/category/accessories']]},
  {title:'Discover',items:[['Collections','/collections'],['Best Sellers','/shop?sort=best-selling'],['Under ₹999','/shop?sort=price-low'],['Trending Now','/shop?sort=trending']]},
];

export function MobileMenu(){
  const [open,setOpen]=useState(false);
  useEffect(()=>{document.body.classList.toggle('menu-open',open);return()=>document.body.classList.remove('menu-open')},[open]);
  const close=()=>setOpen(false);
  return <>
    <button className="mobile-menu" aria-label="Open menu" aria-expanded={open} onClick={()=>setOpen(true)}><MenuIcon/></button>
    {open&&<div className="mobile-menu-backdrop" onClick={close}/>} 
    <aside className={`mobile-drawer ${open?'is-open':''}`} aria-hidden={!open} aria-label="Priyasa shop menu">
      <div className="mobile-drawer-head">
        <Link href="/" className="mobile-drawer-brand" onClick={close} aria-label="PRIYASA home"><img src="/images/priyasa-logo.svg" alt="PRIYASA"/><span>Every You, Beautiful.</span></Link>
        <button type="button" aria-label="Close menu" onClick={close}><CloseIcon/></button>
      </div>
      <div className="mobile-drawer-account">
        <div><UserIcon/><div><strong>Hello, beautiful!</strong><span>Sign in for a more personalised Priyasa experience</span></div></div>
        <Link href="/account" onClick={close}>Login / Sign up <ChevronIcon/></Link>
      </div>
      <div className="mobile-drawer-search"><Link href="/search" onClick={close}><SearchIcon/><span>Search products, styles &amp; categories</span></Link></div>
      <nav className="mobile-drawer-nav" aria-label="Shop menu">
        {groups.map(group=><section key={group.title} className="mobile-drawer-group">
          <h3>{group.title}</h3>
          {group.items.map(([label,href])=><Link key={href} href={href} onClick={close}><span>{label}</span><ChevronIcon/></Link>)}
        </section>)}
      </nav>
      <div className="mobile-drawer-foot">
        <Link href="/account/wishlist" onClick={close}><HeartIcon/><span>My Wishlist</span></Link>
        <Link href="/account/orders" onClick={close}><TruckIcon/><span>My Orders</span></Link>
        <Link href="/account/wallet" onClick={close}><WalletIcon/><span>Priyasa Wallet</span></Link>
        <Link href="/offers" onClick={close}><GiftIcon/><span>Coupons &amp; Offers</span></Link>
        <Link href="/help" onClick={close}><HelpIcon/><span>Help Centre</span></Link>
      </div>
    </aside>
  </>;
}
