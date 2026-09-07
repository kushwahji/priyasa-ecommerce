'use client';
import {useState} from 'react';
import {AuthOtpModal} from './AuthOtpModal';
import {UserIcon} from './StorefrontIcons';
export function AuthButton(){const [open,setOpen]=useState(false);return <><button className="header-login" onClick={()=>setOpen(true)} aria-label="Login with mobile"><UserIcon/></button><AuthOtpModal open={open} onClose={()=>setOpen(false)}/></>}
