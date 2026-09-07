'use client';
import {useState} from 'react';
import {AuthOtpModal} from './AuthOtpModal';
export function AuthButton(){const [open,setOpen]=useState(false);return <><button className="header-login" onClick={()=>setOpen(true)} aria-label="Login with mobile">♙</button><AuthOtpModal open={open} onClose={()=>setOpen(false)}/></>}
