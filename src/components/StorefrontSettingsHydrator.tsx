'use client';

import { useEffect } from 'react';

export default function StorefrontSettingsHydrator() {
  useEffect(() => {
    fetch('/api/storefront/settings', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => {
        const title = payload?.data?.siteTitle;
        if (typeof title === 'string' && title.trim()) document.title = title.trim();
      })
      .catch(() => undefined);
  }, []);
  return null;
}
