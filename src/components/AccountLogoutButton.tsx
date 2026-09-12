'use client';
import {useState} from 'react';

export default function AccountLogoutButton(){
  const [busy,setBusy]=useState(false);
  async function logout(){
    if(busy)return;
    setBusy(true);
    try{
      await fetch('/api/auth/logout',{method:'POST',headers:{Accept:'application/json'}});
      window.location.href='/';
    }catch{
      setBusy(false);
    }
  }
  return <button type="button" className="account-logout-button" onClick={logout} disabled={busy}>{busy?'Signing out…':'Logout'}</button>;
}
