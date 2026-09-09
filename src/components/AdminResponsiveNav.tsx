'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/BrandLogo';

const primary = [
  ['Dashboard', '/admin', '⌂'],
  ['Orders', '/admin/orders', '▤'],
  ['Products', '/admin/products', '▦'],
  ['Categories', '/admin/categories', '◇'],
  ['Inventory', '/admin/inventory', '▥'],
  ['Customers', '/admin/customers', '♙'],
  ['Reviews', '/admin/reviews', '☆'],
] as const;

const growth = [
  ['Homepage / Banners', '/admin/cms', '▣'],
  ['Offers & Coupons', '/admin/coupons-offers', '◇'],
  ['WhatsApp Commerce', '/admin/whatsapp', '◉'],
  ['Marketing Automation', '/admin/marketing-automation', '⚙'],
  ['Meta Ads', '/admin/meta-ads', '◎'],
  ['Analytics', '/admin/analytics', '◒'],
] as const;

const operations = [
  ['Fulfillment', '/admin/orders', '⇢'],
  ['Returns & Refunds', '/admin/returns-refunds', '↩'],
  ['Payment & Shipping', '/admin/settings', '₹'],
  ['WooCommerce', '/admin/products/woocommerce', '↻'],
  ['Settings', '/admin/settings', '⚙'],
] as const;

export default function AdminResponsiveNav({ name }: { name: string }) {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`));
  const groups = [
    { title: 'Command Center', items: primary },
    { title: 'Growth & Merchandising', items: growth },
    { title: 'Operations & Integrations', items: operations },
  ];

  return (
    <>
      <aside className="adminResponsiveSide">
        <div className="adminResponsiveBrand"><BrandLogo href="/admin" compact /></div>
        {groups.map((group) => (
          <div className="adminResponsiveGroup" key={group.title}>
            <div className="adminResponsiveTitle">{group.title}</div>
            <nav className="adminResponsiveLinks">
              {group.items.map(([label, href, icon]) => (
                <Link key={href} href={href} className={active(href) ? 'isActive' : ''}>
                  <span className="adminResponsiveIcon">{icon}</span>
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>
        ))}
        <div className="adminResponsiveAccount">
          <Link href="/admin/settings"><span className="adminResponsiveAvatar">{name.slice(0, 1).toUpperCase()}</span><span><strong>{name}</strong><small>Admin account</small></span></Link>
          <Link href="/api/auth/logout" className="adminResponsiveLogout">Logout</Link>
        </div>
      </aside>

      <nav className="adminMobileBottom" aria-label="Mobile admin navigation">
        {primary.slice(0, 5).map(([label, href, icon]) => (
          <Link key={href} href={href} className={active(href) ? 'isActive' : ''}>
            <span>{icon}</span><small>{label}</small>
          </Link>
        ))}
        <Link href="/admin/cms" className={active('/admin/cms') ? 'isActive' : ''}><span>＋</span><small>More</small></Link>
      </nav>
    </>
  );
}
