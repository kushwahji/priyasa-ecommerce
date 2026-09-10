import Link from 'next/link';

const tabs=[
  ['ALL','/shop'],
  ['WOMEN','/category/women'],
  ['MEN','/category/men'],
  ['KIDS','/category/kids'],
  ['NEW IN','/new-arrivals'],
  ['SALE','/offers'],
] as const;

export default function MobileStorefrontDiscovery(){
  return <section className="mobile-storefront-discovery mobile-storefront-discovery--tabs-only" aria-label="Shop categories">
    <nav className="mobile-storefront-tabs" aria-label="Shop categories">
      {tabs.map(([label,href],index)=><Link key={href} href={href} className={index===0?'is-active':''}>{label}</Link>)}
    </nav>
  </section>;
}
