import Link from 'next/link';
import {SearchIcon} from '@/components/StorefrontIcons';

const tabs=[
  ['ALL','/shop'],
  ['WOMEN','/category/women'],
  ['MEN','/category/men'],
  ['KIDS','/category/kids'],
  ['NEW IN','/new-arrivals'],
  ['SALE','/offers'],
] as const;

export default function MobileStorefrontDiscovery(){
  return <section className="mobile-storefront-discovery" aria-label="Store discovery">
    <Link className="mobile-storefront-search" href="/search" aria-label="Search products, styles and categories">
      <SearchIcon/>
      <span>Search products, styles &amp; categories</span>
    </Link>
    <nav className="mobile-storefront-tabs" aria-label="Shop categories">
      {tabs.map(([label,href],index)=><Link key={href} href={href} className={index===0?'is-active':''}>{label}</Link>)}
    </nav>
  </section>;
}
