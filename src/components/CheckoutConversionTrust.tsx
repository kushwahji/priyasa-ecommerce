'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckIcon, HelpIcon, ShieldIcon, TruckIcon, ReturnIcon } from '@/components/StorefrontIcons';

export default function CheckoutConversionTrust() {
  const [checkout, setCheckout] = useState(false);

  useEffect(() => {
    const update = () => setCheckout(window.location.pathname === '/checkout');
    update();
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);

  if (!checkout) return null;

  return (
    <aside className="checkout-conversion-trust" aria-label="Checkout assurance">
      <div className="checkout-conversion-inner">
        <div className="checkout-conversion-item"><ShieldIcon /><span><strong>Secure checkout</strong><small>Your payment details are protected.</small></span></div>
        <div className="checkout-conversion-item"><TruckIcon /><span><strong>Pan-India delivery</strong><small>Delivery and COD depend on pincode serviceability.</small></span></div>
        <div className="checkout-conversion-item"><ReturnIcon /><span><strong>Easy returns</strong><small>Eligible products follow the current return policy.</small></span></div>
        <div className="checkout-conversion-item"><CheckIcon /><span><strong>Order validation</strong><small>Price, stock and offers are checked before order placement.</small></span></div>
        <Link className="checkout-conversion-help" href="/help"><HelpIcon /><span>Need help?</span></Link>
      </div>
    </aside>
  );
}
