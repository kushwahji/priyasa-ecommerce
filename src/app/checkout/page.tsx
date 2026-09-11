'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { money } from '@/lib/catalog';
import { DeliveryPincode } from '@/components/DeliveryPincode';
import { AuthOtpModal } from '@/components/AuthOtpModal';
import { CashIcon, CheckIcon, ShieldIcon, UpiIcon } from '@/components/StorefrontIcons';

declare global { interface Window { Razorpay?: any } }

type PaymentMethod = 'razorpay' | 'cod';
type Address = { id:string; fullName:string; phone:string; line1:string; city:string; state:string; pincode:string; isDefault?:boolean };
type CartItem = { variantId:string; name:string; price:number; quantity:number; image?:string };

function normalizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const merged = new Map<string, CartItem>();
  for (const value of raw) {
    if (!value || typeof value !== 'object') continue;
    const item = value as Record<string, unknown>;
    const variantId = String(item.variantId ?? '').trim();
    const quantity = Math.floor(Number(item.quantity));
    if (!variantId || !Number.isFinite(quantity) || quantity < 1) continue;
    const safeQuantity = Math.min(20, quantity);
    const existing = merged.get(variantId);
    merged.set(variantId, {
      variantId,
      name: String(item.name ?? 'Product').slice(0, 240),
      price: Number.isFinite(Number(item.price)) && Number(item.price) >= 0 ? Number(item.price) : 0,
      quantity: Math.min(20, (existing?.quantity ?? 0) + safeQuantity),
      image: typeof item.image === 'string' ? item.image : undefined,
    });
  }
  return [...merged.values()];
}

async function loadRazorpay(){
  if(window.Razorpay) return true;
  await new Promise<void>((resolve,reject)=>{ const existing=document.querySelector('script[data-razorpay-checkout]'); if(existing){existing.addEventListener('load',()=>resolve(),{once:true});existing.addEventListener('error',()=>reject(new Error('Unable to load payment gateway. Please try again.')),{once:true});return;} const script=document.createElement('script'); script.src='https://checkout.razorpay.com/v1/checkout.js'; script.async=true; script.dataset.razorpayCheckout='true'; script.onload=()=>resolve(); script.onerror=()=>reject(new Error('Unable to load payment gateway. Please try again.')); document.body.appendChild(script); });
  return Boolean(window.Razorpay);
}

export default function Checkout(){
  const [form,setForm]=useState({fullName:'',phone:'',line1:'',city:'',state:'',pincode:'',coupon:''});
  const [addresses,setAddresses]=useState<Address[]>([]);
  const [selectedAddressId,setSelectedAddressId]=useState('');
  const [items,setItems]=useState<CartItem[]>([]);
  const [authenticated,setAuthenticated]=useState<boolean|null>(null);
  const [loginOpen,setLoginOpen]=useState(false);
  const [quote,setQuote]=useState<any>(null);
  const [paymentMethod,setPaymentMethod]=useState<PaymentMethod>('razorpay');
  const [step,setStep]=useState(1);
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState('');

  useEffect(()=>{
    try {
      const normalized=normalizeCart(JSON.parse(window.localStorage.getItem('priyasa_cart')||'[]'));
      setItems(normalized);
      window.localStorage.setItem('priyasa_cart',JSON.stringify(normalized));
    } catch { setItems([]); }
    void fetch('/api/customer/session',{cache:'no-store'}).then(r=>r.json()).then(async data=>{
      setAuthenticated(Boolean(data.authenticated));
      if(!data.user)return;
      setForm(current=>({...current,fullName:data.user.name||current.fullName,phone:data.user.phone||current.phone}));
      const response=await fetch('/api/customer/addresses',{cache:'no-store'}).then(r=>r.json()).catch(()=>({}));
      const list:Address[]=response.data||[]; setAddresses(list);
      const preferred=list.find(a=>a.isDefault)||list[0]; if(preferred)selectAddress(preferred);
    }).catch(()=>setAuthenticated(false));
  },[]);

  const clientSubtotal=useMemo(()=>items.reduce((sum,item)=>sum+Number(item.price||0)*Number(item.quantity||0),0),[items]);

  async function syncCartToCore(){
    if(authenticated!==true)return;
    const canonicalItems=normalizeCart(items);
    if(canonicalItems.length!==items.length) setItems(canonicalItems);
    const response=await fetch('/api/cart',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:canonicalItems.map(item=>({variantId:String(item.variantId),quantity:Number(item.quantity)})),couponCode:form.coupon.trim().toUpperCase()||undefined})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Unable to sync your bag. Please refresh and try again.');
  }

  async function getFreshQuote(){
    await syncCartToCore();
    const response=await fetch('/api/checkout/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:normalizeCart(items).map(item=>({variantId:String(item.variantId),quantity:Number(item.quantity)})),coupon:form.coupon.trim().toUpperCase()||undefined,pincode:form.pincode||undefined})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Unable to validate your bag.');
    return data;
  }

  useEffect(()=>{
    let cancelled=false;
    const timer=window.setTimeout(async()=>{
      if(!items.length){setQuote(null);return;}
      if(authenticated!==true)return;
      try{
        const data=await getFreshQuote();
        if(cancelled)return;
        setQuote(data);
        if(data.codAvailable===false && paymentMethod==='cod')setPaymentMethod('razorpay');
        setStatus('');
      }catch(error){
        if(cancelled)return;
        setQuote(null);
        setStatus(error instanceof Error?error.message:'Unable to calculate your order.');
      }
    },220);
    return()=>{cancelled=true;window.clearTimeout(timer)};
  },[items,form.coupon,authenticated,form.pincode]);

  function selectAddress(address:Address){setSelectedAddressId(address.id);setForm(current=>({...current,fullName:address.fullName,phone:address.phone,line1:address.line1,city:address.city,state:address.state,pincode:address.pincode}));}
  function updateField(field:string,value:string){setForm(current=>({...current,[field]:value}));if(field!=='phone')setSelectedAddressId('');}
  function fillPincode(address:{pincode:string;city:string;state:string;area?:string}){setForm(current=>({...current,pincode:address.pincode,city:address.city||current.city,state:address.state||current.state,line1:!current.line1&&address.area?address.area:current.line1}));setSelectedAddressId('');}

  const subtotal=Number(quote?.subtotal??clientSubtotal);
  const discount=Number(quote?.discount??0);
  const shipping=Number(quote?.shipping??0);
  const total=Number(quote?.total??Math.max(0,subtotal-discount+shipping));
  const itemCount=items.reduce((sum,item)=>sum+Number(item.quantity||0),0);
  const addressReady=Boolean(form.fullName.trim()&&/^\+?\d{10,15}$/.test(form.phone)&&form.line1.trim()&&form.city.trim()&&form.state.trim()&&/^\d{6}$/.test(form.pincode)&&items.length);
  const codAvailable=quote?.codAvailable!==false;

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy)return;
    if(!authenticated){setLoginOpen(true);return;}
    if(!items.length){setStatus('Your bag is empty.');return;}
    if(!addressReady){setStatus('Please complete your delivery address.');setStep(1);return;}
    if(!quote){setStatus('Please wait while we validate your order.');setStep(1);return;}
    if(paymentMethod==='cod'&&!codAvailable){setStatus('Cash on Delivery is not available for this order.');setStep(2);return;}
    setBusy(true);setStatus('Rechecking price, stock and offer…');
    try{
      const freshQuote=await getFreshQuote();
      setQuote(freshQuote);
      if(freshQuote.codAvailable===false && paymentMethod==='cod')throw new Error('Cash on Delivery is not available for this order.');
      const orderResponse=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({addressId:selectedAddressId||undefined,coupon:form.coupon.trim().toUpperCase()||undefined,paymentMethod})});
      const order=await orderResponse.json().catch(()=>({}));
      if(!orderResponse.ok)throw new Error(order.error||'Unable to create order.');
      if(paymentMethod==='cod'){
        window.localStorage.removeItem('priyasa_cart');
        window.location.href=`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`;
        return;
      }
      setStatus('Opening secure payment…');
      const paymentResponse=await fetch('/api/payments/razorpay',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({orderId:order.orderId})});
      const payment=await paymentResponse.json().catch(()=>({}));
      if(!paymentResponse.ok)throw new Error(payment.error||'Unable to start payment.');
      if(!payment.keyId||!payment.razorpayOrderId||Number(payment.amount)<=0)throw new Error('Payment gateway returned an invalid order. Please retry.');
      await loadRazorpay();
      if(!window.Razorpay)throw new Error('Payment gateway unavailable.');
      const razorpay=new window.Razorpay({key:payment.keyId,amount:payment.amount,currency:payment.currency||'INR',name:'PRIYASA',description:`Order ${payment.orderNumber||order.orderNumber}`,order_id:payment.razorpayOrderId,theme:{color:'#a81132'},handler:async(gatewayResponse:any)=>{
        try{
          setStatus('Verifying payment securely…');
          const verification=await fetch('/api/payments/razorpay/verify',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({orderId:order.orderId,razorpay_order_id:gatewayResponse?.razorpay_order_id,razorpay_payment_id:gatewayResponse?.razorpay_payment_id,razorpay_signature:gatewayResponse?.razorpay_signature})});
          const result=await verification.json().catch(()=>({}));
          if(!verification.ok)throw new Error(result.error||'Payment verification failed.');
          window.localStorage.removeItem('priyasa_cart');
          window.location.href=`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`;
        }catch(error){setBusy(false);setStatus(error instanceof Error?error.message:'Payment verification failed. Please contact support.');}
      },modal:{ondismiss:()=>{setBusy(false);setStatus('Payment was not completed. Your order remains available in My Orders so you can retry.');}}});
      razorpay.on('payment.failed',(failure:any)=>{setBusy(false);setStatus(failure?.error?.description||'Payment failed. Please retry.');});
      razorpay.open();
    }catch(error){setBusy(false);setStatus(error instanceof Error?error.message:'Checkout failed.');}
  }

  const paymentOptions=[
    {id:'razorpay' as const,label:'Online payment',caption:'UPI · Cards · Net Banking',icon:<UpiIcon/>,disabled:false},
    {id:'cod' as const,label:'Cash on Delivery',caption:'Pay when your order arrives',icon:<CashIcon/>,disabled:!codAvailable},
  ];

  if(authenticated===false&&!loginOpen)return <div className="storefront-page priyasa-checkout-v3"><div className="checkout-v3-login"><span className="checkout-v3-kicker">PRIYASA CHECKOUT</span><h1>Sign in to continue</h1><p>Use your mobile number to securely place the order and receive delivery updates.</p><button className="button dark-button" type="button" onClick={()=>setLoginOpen(true)}>Continue with Mobile</button><Link className="button button-light" href="/cart">Back to Bag</Link></div><AuthOtpModal open={loginOpen} onClose={()=>setLoginOpen(false)}/></div>;

  return <div className="storefront-page priyasa-checkout-v3">
    <div className="checkout-v3-head"><div><div className="breadcrumbs"><Link href="/cart">Bag</Link> / Checkout</div><h1 className="checkout-v3-title">Complete your order</h1></div><span className="checkout-v3-secure"><ShieldIcon/> Secure checkout</span></div>
    <div className="checkout-v3-steps" aria-label="Checkout progress">{[['1','Address'],['2','Payment'],['3','Confirm']].map(([number,label],index)=><div key={number} className={`checkout-v3-step ${step===index+1?'active':''}`}><b>{number}</b><span>{label}</span></div>)}</div>
    <form className="checkout-v3-layout" onSubmit={submit}>
      <main className="checkout-v3-main">
        <section className="checkout-v3-summary"><div className="checkout-v3-summary-head"><h2>Order summary <span>({itemCount})</span></h2><Link href="/cart">Edit bag</Link></div><div className="checkout-v3-items">{items.slice(0,4).map(item=><div className="checkout-v3-item" key={item.variantId}>{item.image?<img src={item.image} alt=""/>:<div/>}<div><strong>{item.name}</strong><span>Qty {item.quantity}</span></div><span className="checkout-v3-item-price">{money(Number(item.price||0)*Number(item.quantity||0))}</span></div>)}{items.length>4&&<div className="checkout-v3-more">+ {items.length-4} more item{items.length-4===1?'':'s'} in your bag</div>}</div><div className="checkout-v3-totals"><div className="checkout-v3-line"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="checkout-v3-line discount"><span>Discount</span><strong>{discount?`−${money(discount)}`:money(0)}</strong></div><div className="checkout-v3-line"><span>Delivery</span><strong>{quote ? (shipping?'₹'+shipping.toFixed(2):'Free') : 'Calculating…'}</strong></div><div className="checkout-v3-total"><span>Total</span><strong>{quote?money(total):'Calculating…'}</strong></div></div><label className="checkout-v3-coupon"><input value={form.coupon} maxLength={40} placeholder="Coupon / offer code" onChange={e=>updateField('coupon',e.target.value.toUpperCase())}/><button type="button" onClick={()=>setForm(current=>({...current,coupon:current.coupon.trim().toUpperCase()}))}>Apply</button></label>{quote?.coupon&&<div className="checkout-v3-more">✓ {quote.coupon} applied successfully</div>}</section>

        {step===1&&<section className="checkout-v3-card"><span className="checkout-v3-kicker">01 · DELIVERY</span><h2>Where should we deliver?</h2><p className="checkout-v3-sub">Choose a saved address or enter a new delivery address.</p>{addresses.length>0&&<div className="checkout-v3-saved"><div className="checkout-v3-saved-head"><span>Saved addresses</span><Link href="/account/addresses">Manage</Link></div>{addresses.map(address=><button type="button" key={address.id} className={`checkout-v3-address ${selectedAddressId===address.id?'active':''}`} onClick={()=>selectAddress(address)}><strong>{address.fullName}{address.isDefault?' · Default':''}</strong><small>{address.line1}, {address.city}, {address.state} - {address.pincode} · {address.phone}</small></button>)}</div>}<div className="checkout-v3-form-grid">{([['fullName','Full name'],['phone','Mobile number'],['line1','Address'],['city','City'],['state','State'],['pincode','Pincode']] as const).map(([field,label])=><label className={field==='line1'?'full':''} key={field}>{label}<input className="checkout-v3-input" required value={form[field]} inputMode={field==='phone'||field==='pincode'?'numeric':undefined} maxLength={field==='pincode'?6:120} onChange={e=>updateField(field,field==='pincode'?e.target.value.replace(/\D/g,'').slice(0,6):e.target.value)}/></label>)}</div><DeliveryPincode weightGrams={Math.max(500,itemCount*500)} cod={paymentMethod==='cod'} onAddress={fillPincode}/>{status&&<div className="checkout-v3-status" role="status">{status}</div>}<div className="checkout-v3-actions"><Link className="checkout-v3-back" href="/cart">← Back to bag</Link><button type="button" className="button dark-button" disabled={!addressReady} onClick={()=>{setStatus('');setStep(2);window.scrollTo({top:0,behavior:'smooth'})}}>Continue to payment</button></div></section>}

        {step===2&&<section className="checkout-v3-card"><span className="checkout-v3-kicker">02 · PAYMENT</span><h2>How would you like to pay?</h2><p className="checkout-v3-sub">All payment methods are protected. You will only be charged after final confirmation.</p><div className="checkout-v3-payment-grid">{paymentOptions.map(option=><button type="button" key={option.id} disabled={option.disabled} className={`checkout-v3-payment ${paymentMethod===option.id?'active':''}`} onClick={()=>{setPaymentMethod(option.id);setStatus('')}}><span className="checkout-v3-payment-icon">{option.icon}</span><span><strong>{option.label}</strong><small>{option.caption}</small></span><span className="checkout-v3-radio"/></button>)}</div>{paymentMethod==='razorpay'&&<div className="checkout-v3-offer"><CheckIcon/><div><b>Online payment benefits</b><span>Fast confirmation, no cash handling, and eligible bank/UPI offers can be applied inside the secure payment gateway.</span></div></div>}{status&&<div className="checkout-v3-status" role="status">{status}</div>}<div className="checkout-v3-actions"><button type="button" className="checkout-v3-back" onClick={()=>setStep(1)}>← Delivery address</button><button className="button dark-button" type="submit" disabled={busy||!quote}>{busy?'Processing…':paymentMethod==='cod'?`Place COD order · ${quote?money(total):'…'}`:`Pay ${quote?money(total):'…'} securely`}</button></div></section>}
      </main>
    </form>
    <AuthOtpModal open={loginOpen} onClose={()=>setLoginOpen(false)}/>
  </div>;
}
