'use client';
import {useEffect} from 'react';

const CART_KEY='priyasa_cart';
const ADDRESS_KEY='priyasa_checkout_address_id';

export default function CheckoutFlowEnhancer(){
 useEffect(()=>{
  if(!document.querySelector('.priyasa-checkout-v3')) return;
  let cancelled=false;
  const activeStep=()=>{const active=document.querySelector<HTMLElement>('.checkout-v3-step.active');return active?Number(active.textContent?.match(/\d/)?.[0]||1):1};
  const clickBack=(label:string)=>{const button=[...document.querySelectorAll<HTMLElement>('.checkout-v3-back')].find(el=>(el.textContent||'').toLowerCase().includes(label.toLowerCase()));if(button){button.click();return true}return false};
  const clickAction=(label:string)=>{const button=[...document.querySelectorAll<HTMLElement>('button')].find(el=>(el.textContent||'').trim().toLowerCase()===label.toLowerCase());if(button&&!button.hasAttribute('disabled')){button.click();return true}return false};
  const go=(target:number)=>{let current=activeStep();if(current===target)return;if(target<current){if(current===3){clickBack('payment');window.setTimeout(()=>{if(activeStep()===2)clickBack('address')},80)}else clickBack('address');return}if(current===1){if(clickAction('continue to payment'))window.setTimeout(()=>{if(target===3&&activeStep()===2)clickAction('review order')},100);return}if(current===2&&target===3)clickAction('review order')};

  const nativeFetch=window.fetch.bind(window);
  const checkoutFetch=async(input:RequestInfo|URL,init?:RequestInit):Promise<Response>=>{
   const url=typeof input==='string'?input:input instanceof URL?input.toString():input.url;
   if(!url.includes('/api/orders')||init?.method?.toUpperCase()!=='POST') return nativeFetch(input,init);
   try{
    const raw=typeof init?.body==='string'?init.body:await new Request(input,init).text();
    const body=JSON.parse(raw||'{}');
    if(body.addressId) return nativeFetch(input,init);
    const fields=[...document.querySelectorAll<HTMLInputElement>('.checkout-v3-input')];
    const values=fields.map(el=>el.value.trim());
    const [fullName,phone,line1,city,state,pincode]=values;
    if(!(fullName&&phone&&line1&&city&&state&&/^\d{6}$/.test(pincode))) return nativeFetch(input,init);
    const cacheKey=[fullName,phone,line1,city,state,pincode].join('|');
    let addressId=sessionStorage.getItem(ADDRESS_KEY+':'+cacheKey)||'';
    if(!addressId){
      const addressResponse=await nativeFetch('/api/customer/addresses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fullName,phone:phone.replace(/\D/g,''),line1,city,state,pincode,isDefault:false})});
      const address=await addressResponse.json().catch(()=>({}));
      if(!addressResponse.ok) return new Response(JSON.stringify({error:address.error||'Unable to save delivery address.'}),{status:addressResponse.status,headers:{'Content-Type':'application/json'}});
      addressId=String(address?.id||address?.data?.id||'');
      if(addressId) sessionStorage.setItem(ADDRESS_KEY+':'+cacheKey,addressId);
    }
    if(!addressId) return nativeFetch(input,init);
    const nextBody={...body,addressId};
    const nextInit={...(init||{}),body:JSON.stringify(nextBody),headers:new Headers(init?.headers)};
    return nativeFetch(input,nextInit);
   }catch{return nativeFetch(input,init)}
  };
  window.fetch=checkoutFetch;

  const wire=()=>{
   const root=document.querySelector('.checkout-v3-steps');if(!root)return;
   root.querySelectorAll<HTMLElement>('.checkout-v3-step').forEach((el,index)=>{if(el.dataset.enhanced)return;el.dataset.enhanced='1';el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label',`Go to checkout step ${index+1}`);const handler=()=>go(index+1);el.addEventListener('click',handler);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handler()}})});
   document.querySelectorAll<HTMLElement>('.checkout-v3-item').forEach((item,index)=>{if(item.dataset.removeEnhanced)return;item.dataset.removeEnhanced='1';const button=document.createElement('button');button.type='button';button.className='checkout-v3-item-remove';button.textContent='Remove';button.setAttribute('aria-label','Remove item from bag');button.addEventListener('click',()=>{try{const items=JSON.parse(localStorage.getItem(CART_KEY)||'[]');const name=item.querySelector('strong')?.textContent?.trim();const next=Array.isArray(items)?items.filter((x:any,i:number)=>!(i===index&&(!name||x.name===name))):[];localStorage.setItem(CART_KEY,JSON.stringify(next));window.dispatchEvent(new Event('priyasa-cart-updated'));window.location.reload()}catch{}});item.appendChild(button)});
  };
  const observer=new MutationObserver(()=>{if(!cancelled)wire()});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});wire();
  return()=>{cancelled=true;observer.disconnect();window.fetch=nativeFetch};
 },[]);
 return null;
}
