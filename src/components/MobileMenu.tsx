'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const groups = [
  ['New In', '/new-arrivals'],
  ['Lingerie', '/category/lingerie'],
  ['Nightwear', '/category/nightwear'],
  ['Ethnic Wear', '/category/ethnic-wear'],
  ['Activewear', '/category/activewear'],
  ['Loungewear', '/category/loungewear'],
  ['Accessories', '/category/accessories'],
  ['Collections', '/collections'],
  ['Offers', '/offers'],
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    return () => document.body.classList.remove('menu-open');
  }, [open]);

  return (
    <>
      <button className="mobile-menu" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>☰</button>
      {open && <div className="mobile-menu-backdrop" onClick={() => setOpen(false)} />}
      <aside className={`mobile-drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="mobile-drawer-head">
          <strong>SHOP PRIYASA</strong>
          <button aria-label="Close menu" onClick={() => setOpen(false)}>×</button>
        </div>
        <div className="mobile-drawer-search"><Link href="/search" onClick={() => setOpen(false)}>⌕ <span>Search products</span></Link></div>
        <nav>
          {groups.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}<span>→</span></Link>)}
        </nav>
        <div className="mobile-drawer-foot">
          <Link href="/account" onClick={() => setOpen(false)}>My Account</Link>
          <Link href="/track-order" onClick={() => setOpen(false)}>Track Order</Link>
          <Link href="/contact" onClick={() => setOpen(false)}>Help & Support</Link>
        </div>
      </aside>
    </>
  );
}
