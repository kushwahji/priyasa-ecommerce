'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
  placement?: 'header' | 'footer';
};

type Settings = {
  headerDesktopLogo: string;
  headerMobileLogo: string;
  footerDesktopLogo: string;
  footerMobileLogo: string;
};

const defaults: Settings = {
  headerDesktopLogo: '/images/priyasa-logo.svg',
  headerMobileLogo: '/images/priyasa-icon.svg',
  footerDesktopLogo: '/images/priyasa-logo.svg',
  footerMobileLogo: '/images/priyasa-icon.svg',
};

/** Admin-managed brand lockup. Desktop and mobile assets can be controlled independently. */
export function BrandLogo({ href = '/', compact = false, className = '', placement = 'header' }: BrandLogoProps) {
  const [settings, setSettings] = useState<Settings>(defaults);

  useEffect(() => {
    fetch('/api/storefront/settings', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => {
        if (payload?.data) setSettings((current) => ({ ...current, ...payload.data }));
      })
      .catch(() => undefined);
  }, []);

  const desktop = placement === 'footer' ? settings.footerDesktopLogo : settings.headerDesktopLogo;
  const mobile = placement === 'footer' ? settings.footerMobileLogo : settings.headerMobileLogo;
  const content = (
    <span className={`brand-lockup ${compact ? 'brand-lockup--compact' : ''} brand-lockup--${placement} ${className}`}>
      <img className="brand-logo-full" src={desktop || defaults.headerDesktopLogo} alt="PRIYASA" width={184} height={48} />
      <img className="brand-logo-mobile" src={mobile || defaults.headerMobileLogo} alt="PRIYASA" width={42} height={42} />
    </span>
  );

  return href ? <Link href={href} className="brand-logo-link" aria-label="PRIYASA home">{content}</Link> : content;
}
