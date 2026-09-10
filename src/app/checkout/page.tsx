'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { money } from '@/lib/catalog';
import { DeliveryPincode } from '@/components/DeliveryPincode';
import { AuthOtpModal } from '@/components/AuthOtpModal';
import { CashIcon, CheckIcon, CreditCardIcon, ShieldIcon, UpiIcon, WalletIcon } from '@/components/StorefrontIcons';

declare global { interface Window { Razorpay?: any } }

type PaymentMethod = 'razorpay' | 'cod' | 'wallet';
type Address = { id:string; fullName:string; phone:string; line1:string; city:string; state:string; pincode:string; isDefault?:boolean };
type CartItem = { variantId:string; name:string; price:number; quantity:number; image?:string };

async function loadRazorpay(){
  if(window.Razorpay) return true;
  await new Promise<void>((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://checkout.razorpay.com/v1/checkout.js';
    script.async=true;
    script.onload=()=>resolve();
    script.onerror=()=>reject(new Error('Unable to load payment gateway. Please try again.'));
    document.body.appendChild(script);
  });
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
  const [walletBalance,setWalletBalance]=useState(0);
  const [step,setStep]=useState(1);
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState('');

  useEffect(()=>{
    try{setItems(JSON.parse(window.localStorage.getItem('priyasa_cart')||'[]'));}catch{setItems([])}
    void fetch('/api/customer/session',{cache:'no-store'}).then(r=>r.json()).then(async data=>{
      setAuthenticated(Boolean(data.authenticated));
      if(!data.user) return;
      setForm(current=>({...current,fullName:data.user.name||current.fullName,phone:data.user.phone||current.phone}));
      const addressData=await fetch('/api/customer/addresses',{cache:'no-store'}).then(r=>r.json()).catch(()=>({}));
      const list:Address[]=addressData.data||[];
      setAddresses(list);
      const preferred=list.find(address=>address.isDefault)||list[0];
      if(preferred) selectAddress(preferred);
      const walletData=await fetch('/api/account/wallet',{cache:'no-store'}).then(r=>r.json()).catch(()=>({}));
      setWalletBalance(Number(walletData.wallet?.balance||0));
    }).catch(()=>setAuthenticated(false));
  },[]);

  const clientSubtotal=useMemo(()=>items.reduce((sum,item)=>sum+Number(item.price||0)*Number(item.quantity||0),0),[items]);

  useEffect(()=>{
    let cancelled=false;
    const timer=window.setTimeout(async()=>{
      if(!items.length){setQuote(null);return;}
      const response=await fetch('/api/checkout/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:items.map(item=>({variantId:item.variantId,quantity:item.quantity})),coupon:form.coupon||undefined})});
      const data=await response.json().catch(()=>({}));
      if(cancelled) return;
      if(response.ok) setQuote(data); else {setQuote(null);setStatus(data.error||'Unable to calculate your order.');}
    },220);
    return()=>{cancelled=true;window.clearTimeout(timer)};
  },[items,form.coupon]);

  function selectAddress(address:Address){
    setSelectedAddressId(address.id);
    setForm(current=>({...current,fullName:address.fullName,phone:address.phone,line1:address.line1,city:address.city,state:address.state,pincode:address.pincode}));
  }
  function updateField(field:string,value:string){setForm(current=>({...current,[field]:value}));if(field!=='phone')setSelectedAddressId('');}
  function fillPincode(address:{pincode:string;city:string;state:string;area?:string}){
    setForm(current=>({...current,pincode:address.pincode,city:address.city||current.city,state:address.state||current.state,line1:!current.line1&&address.area?address.area:current.line1}));
    setSelectedAddressId('');
  }

  const displayTotal=quote?.total??clientSubtotal;
  const subtotal=quote?.subtotal??clientSubtotal;
  const discount=quote?.discount??0;
  const shipping=quote?.shipping??(subtotal-discount>=999?0:99);
  const total=quote?.total??Math.max(0,subtotal+shipping-discount);
  const itemCount=items.reduce((sum,item)=>sum+Number(item.quantity||0),0);
  const addressReady=Boolean(form.fullName.trim()&&/^\+?\d{10,15}$/.test(form.phone)&&form.line1.trim()&&form.city.trim()&&form.state.trim()&&/^\d{6}$/.test(form.pincode)&&items.length);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!authenticated){setLoginOpen(true);return;}
    if(!items.length){setStatus('Your bag is empty.');return;}
    if(!addressReady){setStatus('Please complete your delivery address.');setStep(1);return;}
    if(!quote){setStatus('Please wait while we validate your order.');setStep(1);return;}
    if(paymentMethod==='wallet'&&walletBalance<Number(displayTotal)){setStatus('Your Priyasa Wallet balance is insufficient.');setStep(2);return;}
    setBusy(true);setStatus('Rechecking price, stock and offer…');
    try{
      const quoteResponse=await fetch('/api/checkout/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:items.map(item=>({variantId:item.variantId,quantity:item.quantity})),coupon:form.coupon||undefined})});
      const freshQuote=await quoteResponse.json().catch(()=>({}));
      if(!quoteResponse.ok) throw new Error(freshQuote.error||'Your bag changed. Please refresh.');
      setQuote(freshQuote);
      const orderResponse=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({...form,addressId:selectedAddressId||undefined,items:items.map(item=>({variantId:item.variantId,quantity:item.quantity})),paymentMethod})});
      const order=await orderResponse.json().catch(()=>({}));
      if(!orderResponse.ok) throw new Error(order.error||'Unable to create order.');
      if(paymentMethod==='cod'||paymentMethod==='wallet'){
        window.localStorage.removeItem('priyasa_cart');
        window.location.href=`/checkout/success?order=${encodeURIComponent(order.orderNumber)}&method=${paymentMethod}`;
        return;
      }
      setStatus('Opening secure payment…');
      const paymentResponse=await fetch('/api/payments/razorpay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:order.orderId})});
      const payment=await paymentResponse.json().catch(()=>({}));
      if(!paymentResponse.ok) throw new Error(payment.error||'Unable to start payment.');
      await loadRazorpay();
      if(!window.Razorpay) throw new Error('Payment gateway unavailable.');
      const razorpay=new window.Razorpay({key:payment.keyId,amount:payment.amount,currency:payment.currency,name:'PRIYASA',description:`Order ${payment.orderNumber}`,order_id:payment.razorpayOrderId,theme:{color:'#a81132'},handler:async(gatewayResponse:any)=>{
        try{
          setStatus('Verifying payment securely…');
          const verification=await fetch('/api/payments/razorpay/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:order.orderId,...gatewayResponse})});
          const result=await verification.json().catch(()=>({}));
          if(!verification.ok) throw new Error(result.error||'Payment verification failed.');
          window.localStorage.removeItem('priyasa_cart');
          window.location.href=`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`;
        }catch(error){setBusy(false);setStatus(error instanceof Error?error.message:'Payment verification failed. Please contact support.');}
      },modal:{ondismiss:()=>{setBusy(false);setStatus('Payment was not completed. Your order remains available in My Orders so you can retry.');}}});
      razorpay.on('payment.failed',(failure:any)=>{setBusy(false);setStatus(failure?.error?.description||'Payment failed. Please retry.');});
      razorpay.open();
    }catch(error){setBusy(false);setStatus(error instanceof Error?error.message:'Checkout failed.');}
  }

  const paymentOptions=[
    {id:'razorpay' as const,label:'Online payment',caption:'UPI · Cards · Net Banking · Wallets',icon:<UpiIcon/>},
    {id:'wallet' as const,label:'Priyasa Wallet',caption:`Available balance · ${money(walletBalance)}`,icon:<WalletIcon/>},
    {id:'cod' as const,label:'Cash on Delivery',caption:'Pay when your order arrives',icon:<CashIcon/>},
  ];

  if(authenticated===false&&!loginOpen){
    return <div className="storefront-page priyasa-checkout-v3"><div className="checkout-v3-login"><span className="checkout-v3-kicker">PRIYASA CHECKOUT</span><h1>Sign in to continue</h1><p>Use your mobile number to securely place the order and receive delivery updates.</p><button className="button dark-button" type="button" onClick={()=>setLoginOpen(true)}>Continue with Mobile</button><Link className="button button-light" href="/cart">Back to Bag</Link></div><AuthOtpModal open={loginOpen} onClose={()=>setLoginOpen(false)}/></div>;
  }

  return <div className="storefront-page priyasa-checkout-v3">
    <div className="checkout-v3-head"><div><div className="breadcrumbs"><Link href="/cart">Bag</Link> / Checkout</div><h1 className="checkout-v3-title">Complete your order</h1></div><span className="checkout-v3-secure"><ShieldIcon/> Secure checkout</span></div>
    <div className="checkout-v3-steps" aria-label="Checkout progress">
      {[['1','Address'],['2','Payment'],['3','Confirm']].map(([number,label],index)=><div key={number} className={`checkout-v3-step ${step===index+1?'active':''}`}><b>{number}</b><span>{label}</span></div>)}
    </div>

    <div className="checkout-v3-layout">
      <main className="checkout-v3-main">
        <section className="checkout-v3-summary">
          <div className="checkout-v3-summary-head"><h2>Order summary <span>({itemCount})</span></h2><Link href="/cart">Edit bag</Link></div>
          <div className="checkout-v3-items">{items.slice(0,4).map(item=><div className="checkout-v3-item" key={item.variantId}>{item.image?<img src={item.image} alt=""/>:<div/>}<div><strong>{item.name}</strong><span>Qty {item.quantity}</span></div><span className="checkout-v3-item-price">{money(Number(item.price||0)*Number(item.quantity||0))}</span></div>)}{items.length>4&&<div className="checkout-v3-more">+ {items.length-4} more item{items.length-4===1?'':'s'} in your bag</div>}</div>
          <div className="checkout-v3-totals"><div className="checkout-v3-line"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="checkout-v3-line discount"><span>Discount</span><strong>{discount?`−${money(discount)}`:money(0)}</strong></div><div className="checkout-v3-line"><span>Delivery</span><strong>{shipping?'₹99':'Free'}</strong></div><div className="checkout-v3-total"><span>Total</span><strong>{money(total)}</strong></div></div>
          <label className="checkout-v3-coupon"><input value={form.coupon} maxLength={40} placeholder="Coupon / offer code" onChange={event=>updateField('coupon',event.target.value.toUpperCase())}/><button type="button" onClick={()=>setForm(current=>({...current,coupon:current.coupon.trim().toUpperCase()}))}>Apply</button></label>
          {quote?.coupon&&<div className="checkout-v3-more">✓ {quote.coupon} applied successfully</div>}
        </section>

        {step===1&&<section className="checkout-v3-card"><span className="checkout-v3-kicker">01 · DELIVERY</span><h2>Where should we deliver?</h2><p className="checkout-v3-sub">Choose a saved address or enter a new delivery address.</p>
          {addresses.length>0&&<div className="checkout-v3-saved"><div className="checkout-v3-saved-head"><span>Saved addresses</span><Link href="/account/addresses">Manage</Link></div>{addresses.map(address=><button type="button" key={address.id} className={`checkout-v3-address ${selectedAddressId===address.id?'active':''}`} onClick={()=>selectAddress(address)}><strong>{address.fullName}{address.isDefault?' · Default':''}</strong><small>{address.line1}, {address.city}, {address.state} - {address.pincode} · {address.phone}</small></button>)}</div>}
          <div className="checkout-v3-form-grid">
            {([['fullName','Full name'],['phone','Mobile number'],['line1','Address'],['city','City'],['state','State'],['pincode','Pincode']] as const).map(([field,label])=><label className={field==='line1'?'full':''} key={field}>{label}<input className="checkout-v3-input" required value={form[field]} inputMode={field==='phone'||field==='pincode'?'numeric':undefined} maxLength={field==='pincode'?6:120} onChange={event=>updateField(field,field==='pincode'?event.target.value.replace(/\D/g,'').slice(0,6):event.target.value)}/></label>)}
          </div>
          <DeliveryPincode weightGrams={Math.max(500,itemCount*500)} cod={paymentMethod==='cod'} onAddress={fillPincode}/>
          {status&&<div className="checkout-v3-status" role="status">{status}</div>}
          <div className="checkout-v3-actions"><Link className="checkout-v3-back" href="/cart">← Back to bag</Link><button type="button" className="button dark-button" disabled={!addressReady} onClick={()=>{setStatus('');setStep(2);window.scrollTo({top:0,behavior:'smooth'})}}>Continue to payment</button></div>
        </section>}

        {step===2&&<section className="checkout-v3-card"><span className="checkout-v3-kicker">02 · PAYMENT</span><h2>How would you like to pay?</h2><p className="checkout-v3-sub">All payment methods are protected. You will only be charged after final confirmation.</p>
          <div className="checkout-v3-payment-grid">{paymentOptions.map(option=><button type="button" key={option.id} className={`checkout-v3-payment ${paymentMethod===option.id?'active':''}`} onClick={()=>{setPaymentMethod(option.id);setStatus('')}}><span className="checkout-v3-payment-icon">{option.icon}</span><span><strong>{option.label}</strong><small>{option.caption}</small></span><span className="checkout-v3-radio"/></button>)}</div>
          {paymentMethod==='razorpay'&&<div className="checkout-v3-offer"><CheckIcon/><div><b>Online payment benefits</b><span>Fast confirmation, no cash handling, and eligible bank/UPI offers can be applied inside the secure payment gateway.</span></div></div>}
          {paymentMethod==='wallet'&&walletBalance<Number(total)&&<div className="checkout-v3-status">Wallet balance is {money(walletBalance)}. Please choose another payment method or add wallet balance.</div>}
          {status&&<div className="checkout-v3-status" role="status">{status}</div>}
          <div className="checkout-v3-actions"><button type="button" className="checkout-v3-back" onClick={()=>{setStatus('');setStep(1);window.scrollTo({top:0,behavior:'smooth'})}}>← Address</button><button type="button" className="button dark-button" onClick={()=>{if(paymentMethod==='wallet'&&walletBalance<Number(total)){setStatus('Your Priyasa Wallet balance is insufficient.');return}setStatus('');setStep(3);window.scrollTo({top:0,behavior:'smooth'})}}>Review order</button></div>
        </section>}

        {step===3&&<section className="checkout-v3-card"><span className="checkout-v3-kicker">03 · CONFIRMATION</span><h2>Review & place order</h2><p className="checkout-v3-sub">Check your delivery details and payment method before placing the order.</p>
          <div className="checkout-v3-review"><div className="checkout-v3-review-row"><div>Deliver to</div><strong>{form.fullName}<br/>{form.line1}, {form.city}, {form.state} - {form.pincode}<br/>{form.phone}</strong></div><div className="checkout-v3-review-row"><div>Payment</div><strong>{paymentOptions.find(option=>option.id===paymentMethod)?.label}</strong></div><div className="checkout-v3-review-row"><div>Order total</div><strong>{money(total)}</strong></div></div>
          {status&&<div className="checkout-v3-status" role="status">{status}</div>}
          <button className="button dark-button checkout-v3-place" type="submit" disabled={busy||!quote||!items.length}>{busy?'Processing securely…':paymentMethod==='razorpay'?'Continue to secure payment':`Place order · ${money(total)}`}</button>
          <p className="checkout-v3-note"><ShieldIcon/> By placing your order, you agree to Priyasa terms and the applicable return policy.</p>
          <div className="checkout-v3-actions"><button type="button" className="checkout-v3-back" onClick={()=>{setStatus('');setStep(2);window.scrollTo({top:0,behavior:'smooth'})}}>← Payment</button><Link href="/cart" className="checkout-v3-back">Edit bag</Link></div>
        </section>}
      </main>

      <aside className="checkout-v3-side"><div className="checkout-v3-card"><span className="checkout-v3-kicker">SECURE SHOPPING</span><h2>You're almost there</h2><div className="checkout-v3-trust"><div><strong>Secure payment</strong>Protected checkout</div><div><strong>Pan-India delivery</strong>Serviceability checked</div><div><strong>Easy returns</strong>Eligible products</div><div><strong>Order validation</strong>Price & stock checked</div></div></div></aside>
    </div>
    <AuthOtpModal open={loginOpen} onClose={()=>setLoginOpen(false)}/>
  </div>;
}
