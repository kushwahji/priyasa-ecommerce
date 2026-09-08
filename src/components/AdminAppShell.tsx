'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const primary = [
  ['Overview', '/admin', '⌂'],
  ['Orders', '/admin/orders', '▤'],
  ['Products', '/admin/products', '▦'],
  ['Inventory', '/admin/inventory', '▥'],
  ['Customers', '/admin/customers', '♙'],
  ['Marketing', '/admin/marketing', '◉'],
  ['Automation', '/admin/automations', '⚙'],
  ['Analytics', '/admin/analytics', '◒'],
  ['Fulfillment', '/admin/orders', '⇢'],
  ['Returns & Refunds', '/admin/returns-refunds', '↩'],
  ['CMS Studio', '/admin/cms', '▣'],
  ['Settings', '/admin/settings', '⚙'],
] as const;

const tools = [
  ['WooCommerce', '/admin/products/woocommerce'],
  ['Product Import', '/admin/products/import'],
  ['Coupons & Offers', '/admin/coupons-offers'],
  ['Meta Ads', '/admin/meta-ads'],
  ['WhatsApp', '/admin/whatsapp'],
  ['Reviews', '/admin/reviews'],
  ['SEO', '/admin/seo'],
  ['Audit Log', '/admin/audit-log'],
] as const;

function activePath(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // The overview has its own full-screen command-center composition.
  if (pathname === '/admin') return <>{children}</>;

  return (
    <div className="admin-os">
      <aside className="admin-os__sidebar">
        <Link href="/admin" className="admin-os__brand" aria-label="Priyasa Commerce OS">
          <span className="admin-os__mark">P</span>
          <span><strong>PRIYASA</strong><small>COMMERCE OS</small></span>
        </Link>

        <div className="admin-os__label">Command center</div>
        <nav className="admin-os__nav" aria-label="Admin navigation">
          {primary.map(([label, href, icon]) => (
            <Link key={label} href={href} className={activePath(pathname, href) ? 'is-active' : ''}>
              <i aria-hidden="true">{icon}</i><span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-os__label">Commerce tools</div>
        <nav className="admin-os__nav admin-os__nav--tools">
          {tools.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
        </nav>
      </aside>

      <div className="admin-os__main">
        <header className="admin-os__topbar">
          <div className="admin-os__breadcrumb">
            <span>PRIYASA</span><b>/</b><strong>{pathname === '/admin' ? 'Overview' : pathname.split('/').filter(Boolean).slice(-1)[0]?.replaceAll('-', ' ')}</strong>
          </div>
          <div className="admin-os__top-actions">
            <Link href="/" className="admin-os__store-link">View Store ↗</Link>
            <Link href="/admin/settings" className="admin-os__settings-link">Settings</Link>
            <span className="admin-os__avatar">PA</span>
          </div>
        </header>
        <main className="admin-os__content">{children}</main>
      </div>
    </div>
  );
}
