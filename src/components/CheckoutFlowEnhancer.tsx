'use client';
import {useEffect} from 'react';

const CART_KEY='priyasa_cart';
const ONLINE_SAVING=70;

export default function CheckoutFlowEnhancer(){
 useEffect(()=>{
  if(!document.querySelector('.priyasa-checkout-v3')) return;
  let cancelled=false;
  const activeStep=()=>{const active=document.querySelector<HTMLElement>('.checkout-v3-step.active');return active?Number(active.textContent?.match(/\d/)?.[0]||1):1};
  const clickBack=(label:string)=>{const button=[...document.querySelectorAll<HTMLElement>('.checkout-v3-back')].find(el=>(el.textContent||'').toLowerCase().includes(label.toLowerCase()));if(button){button.click();return true}return false};
  const clickAction=(label:string)=>{const button=[...document.querySelectorAll<HTMLElement>('button')].find(el=>(el.textContent||'').trim().toLowerCase()===label.toLowerCase());if(button&&!button.hasAttribute('disabled')){button.click();return true}return false};
  const go=(target:number)=>{let current=activeStep();if(current===target)return;if(target<current){if(current===3){clickBack('payment');window.setTimeout(()=>{if(activeStep()===2)clickBack('address')},80)}else clickBack('address');return}if(current===1){if(clickAction('continue to payment'))window.setTimeout(()=>{if(target===3&&activeStep()===2)clickAction('review order')},100);return}if(current===2&&target===3)clickAction('review order')};
  const wire=()=>{
   const root=document.querySelector('.checkout-v3-steps');if(!root)return;
   root.querySelectorAll<HTMLElement>('.checkout-v3-step').forEach((el,index)=>{if(el.dataset.enhanced)return;el.dataset.enhanced='1';el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label',`Go to checkout step ${index+1}`);const handler=()=>go(index+1);el.addEventListener('click',handler);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handler()}})});
   document.querySelectorAll<HTMLElement>('.checkout-v3-item').forEach((item,index)=>{if(item.dataset.removeEnhanced)return;item.dataset.removeEnhanced='1';const button=document.createElement('button');button.type='button';button.className='checkout-v3-item-remove';button.textContent='Remove';button.setAttribute('aria-label','Remove item from bag');button.addEventListener('click',()=>{try{const items=JSON.parse(localStorage.getItem(CART_KEY)||'[]');const name=item.querySelector('strong')?.textContent?.trim();const next=Array.isArray(items)?items.filter((x:any,i:number)=>!(i===index&&(!name||x.name===name))):[];localStorage.setItem(CART_KEY,JSON.stringify(next));window.dispatchEvent(new Event('priyasa-cart-updated'));window.location.reload()}catch{}});item.appendChild(button)});
   const payment=[...document.querySelectorAll<HTMLElement>('.checkout-v3-payment')].find(el=>(el.textContent||'').toLowerCase().includes('online payment'));
   if(payment&&!payment.querySelector('.checkout-v3-online-saving')){const badge=document.createElement('small');badge.className='checkout-v3-online-saving';badge.textContent='PAY ONLINE · SAVE ₹70';payment.appendChild(badge)}
   const selectedOnline=payment?.classList.contains('active');
   document.querySelectorAll<HTMLElement>('.checkout-v3-total strong').forEach(total=>{const base=Number(total.dataset.baseTotal||'');if(!Number.isFinite(base)||base<=0){const value=(total.textContent||'').replace(/[^0-9.]/g,'');const parsed=Number(value);if(Number.isFinite(parsed)&&parsed>0)total.dataset.baseTotal=String(parsed)}const original=Number(total.dataset.baseTotal||'0');if(original>0)total.textContent=`₹${(selectedOnline?Math.max(0,original-ONLINE_SAVING):original).toLocaleString('en-IN')}`});
  };
  const observer=new MutationObserver(()=>{if(!cancelled)wire()});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});wire();
  return()=>{cancelled=true;observer.disconnect()};
 },[]);
 return null;
}
