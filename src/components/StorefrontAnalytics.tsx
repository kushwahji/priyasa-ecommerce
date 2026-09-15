'use client';

import { useEffect } from 'react';

const CONSENT_KEY='priyasa_ads_consent';
const SESSION_KEY='priyasa_analytics_session';

function sessionId(){try{let id=localStorage.getItem(SESSION_KEY);if(!id){id=crypto.randomUUID();localStorage.setItem(SESSION_KEY,id)}return id}catch{return undefined}}
function consented(){try{return localStorage.getItem(CONSENT_KEY)==='granted'}catch{return false}}
function send(event:string,metadata:Record<string,unknown>={}){if(!consented())return;const sid=sessionId();fetch('/api/storefront/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,session_id:sid,metadata})}).catch(()=>undefined)}

export default function StorefrontAnalytics(){
 useEffect(()=>{
  const path=window.location.pathname;
  send('page_view',{path});
  const product=path.match(/^\/product\/([^/]+)/)?.[1];
  if(product) send('product_view',{slug:product});
  if(path==='/cart')send('cart_view');
  if(path.startsWith('/checkout'))send('begin_checkout');
  const onCart=()=>send('cart_updated');
  window.addEventListener('priyasa-cart-updated',onCart);
  return()=>window.removeEventListener('priyasa-cart-updated',onCart);
 },[]);
 return null;
}

export function grantAdsConsent(){try{localStorage.setItem(CONSENT_KEY,'granted')}catch{}}
export function revokeAdsConsent(){try{localStorage.setItem(CONSENT_KEY,'denied')}catch{}}
