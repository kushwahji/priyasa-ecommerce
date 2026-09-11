'use client';

import { useEffect, useState } from 'react';

export function StorefrontApiStatus() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  if (!offline) return null;
  return <div role="status" aria-live="polite" className="storefront-offline-banner">You’re offline. Your bag is kept on this device; reconnect to continue checkout.</div>;
}
