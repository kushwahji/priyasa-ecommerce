'use client';
import { useEffect, useState } from 'react';

type Props={weightGrams?:number;cod?:boolean;compact?:boolean};
type Result={serviceable:boolean;etaText?:string;shippingCharge?:number;codAvailable?:boolean;courier?:string;message:string};

export function DeliveryPincode({weightGrams=500,cod=false,compact=false}:Props){
 const [pincode,setPincode]=useState('');
 const [result,setResult]=useState<Result|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const check=async(value=pincode)=>{
  const pin=value.replace(/\D/g,'').slice(0,6); setPincode(pin); setError(''); setResult(null);
  if(pin.length!==6)return;
  setLoading(true);
  try{
   const r=await fetch(`/api/shipping/serviceability?pincode=${pin}&weightGrams=${weightGrams}&cod=${cod?'1':'0'}`,{cache:'no-store'});
   const data=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(data.message||'Unable to check delivery');
   setResult(data);
  }catch(e){setError(e instanceof Error?e.message:'Unable to check delivery');}
  finally{setLoading(false)}
 };
 useEffect(()=>{const saved=localStorage.getItem('priyasa_delivery_pincode');if(saved)setPincode(saved)},[]);
 useEffect(()=>{if(result?.serviceable&&pincode.length===6)localStorage.setItem('priyasa_delivery_pincode',pincode)},[result,pincode]);
 return <div className={`delivery-check ${compact?'delivery-check-compact':''}`} style={{margin:'22px 0',padding:'16px',background:'#f8f5f1',border:'1px solid #e6ded6'}}>
  <div className="delivery-title" style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,fontSize:13}}><span>🚚</span><strong>Check delivery</strong><span style={{color:'#766a68',fontSize:11}}>Enter your pincode</span></div>
  <div className="delivery-input-row" style={{display:'flex',maxWidth:430}}><input style={{flex:1,minWidth:0,padding:'12px 13px',border:'1px solid #d8cec5',background:'#fff',fontSize:14,outline:'none'}} inputMode="numeric" maxLength={6} value={pincode} onChange={e=>{const v=e.target.value.replace(/\D/g,'').slice(0,6);setPincode(v);if(v.length===6)check(v)}} placeholder="Enter pincode" aria-label="Delivery pincode"/><button style={{padding:'0 20px',border:0,background:'#5b1625',color:'#fff',fontWeight:600,cursor:'pointer'}} type="button" onClick={()=>check()} disabled={loading||pincode.length!==6}>{loading?'Checking…':'Check'}</button></div>
  {result&&<div className={result.serviceable?'delivery-result success':'delivery-result unavailable'} style={{display:'grid',gap:4,marginTop:11,fontSize:12,color:result.serviceable?'#27663b':'#9d2534'}}><strong>{result.serviceable?'✓ Delivery available':'× Delivery unavailable'}</strong><span style={{color:'#655955'}}>{result.serviceable?(result.etaText||'Delivery available to this pincode.'):'We currently cannot deliver to this pincode.'}</span>{result.serviceable&&result.codAvailable&&<span style={{color:'#27663b'}}>Cash on Delivery available</span>}</div>}
  {error&&<div className="delivery-error" style={{marginTop:10,color:'#9d2534',fontSize:12}}>{error}</div>}
 </div>;
}
