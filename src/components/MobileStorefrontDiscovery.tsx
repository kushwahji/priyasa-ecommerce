'use client';

import {usePathname} from 'next/navigation';

/**
 * The mobile home page no longer renders the legacy ALL / WOMEN / MEN / KIDS
 * discovery rail. Category discovery belongs inside Shop/search, not between
 * the app header and the home merchandising experience.
 */
export default function MobileStorefrontDiscovery(){
  const pathname=usePathname();
  if(pathname!=='/') return null;
  return null;
}
