'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {AuthOtpModal} from '@/components/AuthOtpModal';
import {BrandLogo} from '@/components/BrandLogo';

export default function LoginPage(){
  const [open,setOpen]=useState(false);
  const [checking,setChecking]=useState(true);
  const router=useRouter();

  useEffect(()=>{
    let active=true;
    fetch('/api/auth/session',{cache:'no-store'})
      .then(r=>r.json())
      .then(d=>{
        if(!active)return;
        if(d?.authenticated){router.replace('/account');return;}
        setChecking(false);
        setOpen(true);
      })
      .catch(()=>{
        if(active){setChecking(false);setOpen(true);}
      });
    return()=>{active=false;};
  },[router]);

  if(checking)return <div className="page" style={{padding:'80px 20px',textAlign:'center'}}>Checking your Priyasa account…</div>;

  return <div className="customer-auth-page">
    <div className="customer-auth-art">
      <div className="customer-auth-copy"><BrandLogo href="/"/><span className="eyebrow">EVERY YOU, BEAUTIFUL</span><h1>Fashion made<br/><em>for you.</em></h1><p>Discover styles that make every mood, moment and occasion feel beautiful.</p></div>
    </div>
    <div className="customer-auth-panel">
      <div className="customer-auth-card"><BrandLogo href="/"/><span className="eyebrow">WELCOME TO PRIYASA</span><h1>Sign in with mobile</h1><p>Use your mobile number and verify with a secure WhatsApp OTP. No password required.</p><button className="button full-button" onClick={()=>setOpen(true)}>Continue with Mobile</button><div className="auth-benefits"><span>✓ Secure OTP login</span><span>✓ Order tracking</span><span>✓ Saved preferences</span></div><small>New to Priyasa? <Link href="/shop">Start Shopping</Link></small></div>
    </div>
    <AuthOtpModal open={open} onClose={()=>setOpen(false)}/>
  </div>;
}
