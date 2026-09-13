'use client';
import Link from 'next/link';import {useEffect,useState} from 'react';
const money=(n:number)=>`₹${n.toLocaleString('en-IN')}`;const statusLabel=(s:string)=>s.replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());

type ApiError={error?:string;code?:string};

export default function Orders(){
  const [orders,setOrders]=useState<any[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[authenticated,setAuthenticated]=useState<boolean|null>(null);

  useEffect(()=>{
    let cancelled=false;
    const load=async()=>{
      try{
        const sessionResponse=await fetch('/api/auth/session',{cache:'no-store',credentials:'include'});
        const session=await sessionResponse.json().catch(()=>({authenticated:false}));
        if(cancelled)return;
        setAuthenticated(Boolean(session.authenticated));
        if(!session.authenticated){setError('Please sign in with your mobile number to view your orders.');return;}

        const response=await fetch('/api/customer/orders',{cache:'no-store',credentials:'include'});
        const data=await response.json().catch(()=>({} as ApiError));
        if(!response.ok)throw new Error(data.error||'Unable to load orders right now.');
        if(cancelled)return;
        setOrders(Array.isArray(data.data)?data.data:[]);
      }catch(e){if(!cancelled)setError(e instanceof Error?e.message:'Unable to load orders right now.');}
      finally{if(!cancelled)setLoading(false);}
    };
    load();
    return()=>{cancelled=true};
  },[]);

  if(loading)return <div className="account-shell ecomus-orders"><div className="account-orders-loading">Loading your orders…</div></div>;
  if(!authenticated)return <div className="account-shell ecomus-orders"><div className="account-card order-empty"><div className="order-empty-icon">♡</div><h2>Sign in to view your orders</h2><p>{error||'Your account session is not active on this device.'}</p><Link className="button" href="/login">Sign in with mobile</Link></div></div>;
  if(error)return <div className="account-shell ecomus-orders"><div className="account-card order-empty"><div className="order-empty-icon">!</div><h2>We couldn't load your orders</h2><p>{error}</p><button className="button" type="button" onClick={()=>window.location.reload()}>Try Again</button></div></div>;

  return <div className="account-shell ecomus-orders"><div className="breadcrumbs"><Link href="/">Home</Link><span> / </span><Link href="/account">My Account</Link><span> / </span>My Orders</div><div className="account-main-head"><div><span className="eyebrow">MY PRIYASA</span><h1>My Orders</h1><p className="account-lead">Track, pay and manage every Priyasa purchase.</p></div><Link className="button button-light" href="/shop">Continue Shopping</Link></div>{!orders.length?<div className="account-card order-empty"><div className="order-empty-icon">♡</div><h2>No orders yet</h2><p>When you place your first Priyasa order, it will appear here.</p><Link className="button" href="/shop">Start Shopping</Link></div>:<div className="orders-list">{orders.map(o=><article className="order-card" key={o.id}><header><div><strong>Order {o.orderNumber}</strong><small>{new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</small></div><span className={`order-status status-${String(o.status).toLowerCase()}`}>{statusLabel(o.status)}</span></header><div className="order-items">{o.items.map((i:any)=><div className="order-item" key={i.id}><div className="order-item-image">{i.variant?.product?.images?.[0]?.url&&<img src={i.variant.product.images[0].url} alt=""/>}</div><div><strong>{i.productName}</strong><small>{i.color} · {i.size} · Qty {i.quantity}</small><span>{money(i.unitPrice*i.quantity)}</span></div></div>)}</div><footer><div><small>Total</small><strong>{money(o.total)}</strong></div><div className="order-actions">{(o.status==='PAYMENT_PENDING'||o.status==='CREATED')&&<Link className="button" href={`/checkout/payment/${o.id}`}>Pay Now</Link>}<Link className="button button-light" href={`/track-order?order=${encodeURIComponent(o.orderNumber)}`}>Track</Link><Link className="button button-light" href={`/account/orders/${o.id}`}>Details</Link></div></footer></article>)}</div>}</div>;
}
