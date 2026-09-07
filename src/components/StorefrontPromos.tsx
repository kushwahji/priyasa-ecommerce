'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BellIcon, CloseIcon } from './StorefrontIcons';

export function StorefrontPromos(){
  const [offer,setOffer]=useState(false);
  const [notify,setNotify]=useState(false);
  const [permission,setPermission]=useState<NotificationPermission>('default');
  useEffect(()=>{
    const offerSeen=localStorage.getItem('priyasa_offer_popup_seen');
    const notifySeen=localStorage.getItem('priyasa_notification_prompt_seen');
    const offerTimer=window.setTimeout(()=>{if(!offerSeen)setOffer(true)},5000);
    const notifyTimer=window.setTimeout(()=>{if(!notifySeen&&!offerSeen)setNotify(true)},12000);
    if('Notification' in window)setPermission(Notification.permission);
    return()=>{clearTimeout(offerTimer);clearTimeout(notifyTimer)};
  },[]);
  const closeOffer=()=>{localStorage.setItem('priyasa_offer_popup_seen','1');setOffer(false)};
  const closeNotify=()=>{localStorage.setItem('priyasa_notification_prompt_seen','1');setNotify(false)};
  const allow=async()=>{try{if('Notification' in window){const p=await Notification.requestPermission();setPermission(p)} }finally{closeNotify()}};
  if(!offer&&!notify)return null;
  return <>
    {offer&&<div className="promo-modal-backdrop" role="dialog" aria-modal="true" aria-label="Priyasa special offer"><div className="promo-offer-modal"><button className="promo-close" onClick={closeOffer} aria-label="Close"><CloseIcon/></button><div className="promo-offer-image"/><div className="promo-offer-copy"><span className="eyebrow">SPECIAL OFFER</span><h2>FLAT<br/><strong>50% OFF</strong></h2><p>On selected styles</p><span className="promo-code">Use Code: PRIYASA50</span><Link className="button" href="/offers" onClick={closeOffer}>Shop Now →</Link></div></div></div>}
    {notify&&!offer&&<div className="promo-modal-backdrop" role="dialog" aria-modal="true" aria-label="Priyasa notifications"><div className="notification-modal"><button className="promo-close" onClick={closeNotify} aria-label="Close"><CloseIcon/></button><div className="notification-icon"><BellIcon/></div><h2>Allow PRIYASA to send you notifications?</h2><p>Get updates on new arrivals, offers, order tracking and more.</p><button className="button" onClick={allow}>{permission==='granted'?'Notifications enabled':'Allow'}</button><button className="button button-light" onClick={closeNotify}>Not Now</button></div></div>}
  </>;
}
