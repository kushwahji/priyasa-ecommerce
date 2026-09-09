'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {HeartIcon,HomeIcon,SearchIcon,UserIcon} from '@/components/StorefrontIcons';

const items=[
  ['Home','/',HomeIcon],
  ['Shop','/shop',SearchIcon],
  ['Wishlist','/wishlist',HeartIcon],
  ['Account','/account',UserIcon],
] as const;

function activeFor(pathname:string,href:string){
  if(href==='/') return pathname==='/';
  if(href==='/shop') return pathname==='/shop'||pathname.startsWith('/category/')||pathname==='/new-arrivals'||pathname==='/collections'||pathname==='/offers';
  if(href==='/wishlist') return pathname==='/wishlist'||pathname.startsWith('/wishlist/');
  return pathname==='/account'||pathname.startsWith('/account/')||pathname==='/login';
}

export default function MobileBottomNav(){
  const pathname=usePathname()||'/';
  return <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
    {items.map(([label,href,Icon])=><Link key={href} href={href} className={activeFor(pathname,href)?'is-active':''} aria-current={activeFor(pathname,href)?'page':undefined}>
      <Icon/><small>{label}</small>
    </Link>)}
  </nav>;
}
