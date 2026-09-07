'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AuthOtpModal } from '@/components/AuthOtpModal';
import { BrandLogo } from '@/components/BrandLogo';

export default function LoginPage(){
  const [open,setOpen]=useState(true);
  return <div className="customer-auth-page">
    <div className="customer-auth-art"><div className="customer-auth-copy"><BrandLogo href="/"/><span className="eyebrow">EVERY YOU, BEAUTIFUL</span><h1>Fashion made<br /><em>for you.</em></h1><p>Discover styles that make every mood, moment and occasion feel beautiful.</p></div></div>
    <div className="customer-auth-panel"><div className="customer-auth-card"><BrandLogo href="/"/><span className="eyebrow">WELCOME BACK</span><h1>Sign in to your account</h1><p>Continue with your mobile number and secure WhatsApp OTP.</p><button className="button" onClick={()=>setOpen(true)}>Login with Mobile Number</button><div className="auth-divider"><span>or continue with</span></div><div className="social-login"><button aria-label="Google">G</button><button aria-label="Facebook">f</button><button aria-label="Apple">●</button></div><small>New to Priyasa? <Link href="/shop">Start Shopping</Link></small></div></div>
    <AuthOtpModal open={open} onClose={()=>setOpen(false)} />
  </div>;
}
