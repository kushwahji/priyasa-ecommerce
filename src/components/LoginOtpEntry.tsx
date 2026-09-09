'use client';

import { useState } from 'react';
import { AuthOtpModal } from '@/components/AuthOtpModal';

export function LoginOtpEntry() {
  const [open, setOpen] = useState(true);
  return <>
    <button className="button full-button" type="button" onClick={() => setOpen(true)}>Continue with Mobile</button>
    <AuthOtpModal open={open} onClose={() => setOpen(false)} />
  </>;
}
