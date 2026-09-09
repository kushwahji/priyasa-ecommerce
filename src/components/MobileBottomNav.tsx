'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {GiftIcon,GridIcon,HomeIcon,UserIcon} from '@/components/StorefrontIcons';

const items=[
  ['Home','/',HomeIcon],
  ['Categories','/shop',GridIcon],
  ['Offers','/offers',GiftIcon],
  ['Account','/account',UserIcon],
] as const;

function activeFor(pathname:string,href:string){
  if(href==='/') return pathname==='/';
  if(href==='/shop') return pathname==='/shop'||pathname.startsWith('/category/')||pathname==='/new-arrivals'||pathname==='/collections';
  if(href==='/offers') return pathname==='/offers'||pathname.startsWith('/offers/');
  return pathname==='/account'||pathname.startsWith('/account/')||pathname==='/login';
}

export default function MobileBottomNav(){
  const pathname=usePathname()||'/';
  return <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
    {items.map(([label,href,Icon])=>{
      const active=activeFor(pathname,href);
      return <Link key={href} href={href} className={active?'is-active':''} aria-current={active?'page':undefined}>
        <Icon/><small>{label}</small>
      </Link>;
    })}
  </nav>;
}
