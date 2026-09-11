'use client';

import Link from 'next/link';
import { SearchIcon } from '@/components/StorefrontIcons';

/** Mobile home discovery is a search affordance only; category tabs are removed. */
export default function MobileStorefrontDiscovery(){
  return <section className="mobile-storefront-discovery mobile-storefront-discovery--search" aria-label="Store search">
    <Link className="mobile-home-search" href="/search" aria-label="Search for products, brands and more">
      <SearchIcon />
      <span>Search for products, brands and more...</span>
    </Link>
  </section>;
}
