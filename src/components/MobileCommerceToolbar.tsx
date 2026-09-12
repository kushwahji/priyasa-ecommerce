'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MapPinIcon, SearchIcon, ChevronDownIcon } from '@/components/StorefrontIcons';

type Address = { id?: string; line1?: string; city?: string; state?: string; pincode?: string; isDefault?: boolean };

export default function MobileCommerceToolbar(){
  const [address,setAddress]=useState<Address|null>(null);
  useEffect(()=>{
    let active=true;
    fetch('/api/customer/addresses',{cache:'no-store'}).then(r=>r.json()).then(payload=>{
      if(!active)return;
      const list=Array.isArray(payload?.data)?payload.data:[];
      const preferred=list.find((item:Address)=>item?.isDefault)||list[0];
      if(preferred)setAddress(preferred);
    }).catch(()=>{});
    return()=>{active=false};
  },[]);
  const location=address?.city||address?.pincode||'Select delivery location';
  return <div className="mobile-commerce-toolbar" aria-label="Mobile shopping tools">
    <Link className="mobile-delivery-bar" href="/account/addresses" aria-label="Change delivery address">
      <MapPinIcon/><span><small>Deliver to</small><strong>{location}</strong></span><ChevronDownIcon/>
    </Link>
    <form className="mobile-store-search" action="/search">
      <SearchIcon/><input name="q" placeholder="Search for brands and products" aria-label="Search for brands and products"/><button type="submit">Search</button>
    </form>
  </div>;
}
