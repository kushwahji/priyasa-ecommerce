import Link from 'next/link';
import { db } from '@/lib/db';
import { BrandLogo } from '@/components/BrandLogo';
import AdminResponsiveNav from '@/components/AdminResponsiveNav';

function money(value: number) { return `₹${Math.round(value).toLocaleString('en-IN')}`; }
function initials(name: string) { return name.split(/\s+/).filter(Boolean).map((x) => x[0]).slice(0, 2).join('').toUpperCase() || 'P'; }

const quickCards = [
  ['＋', 'Add product', 'Create product, variants & media', '/admin/products/new'],
  ['▣', 'Homepage studio', 'Banners, carousel & sections', '/admin/cms'],
  ['◇', 'Offers', 'Coupons and promotions', '/admin/coupons-offers'],
  ['◉', 'WhatsApp', 'Connect, templates & automation', '/admin/whatsapp'],
  ['▥', 'Inventory', 'Variant stock & adjustments', '/admin/inventory'],
  ['↻', 'Bulk variants', 'Price and stock operations', '/admin/products/bulk'],
] as const;

export default async function AdminDashboardV4({ name, email }: { name: string; email?: string | null }) {
  const [orders, customers, products, variants, lowStock, activeSections, revenue, recentOrders, topProducts, pendingReturns, failedPayments] = await Promise.all([
    db.order.count(),
    db.user.count({ where: { role: 'CUSTOMER' } }),
    db.product.count(),
    db.productVariant.count(),
    db.productVariant.count({ where: { stock: { lte: 5 } } }),
    db.cmsSection.count({ where: { active: true } }),
    db.order.aggregate({ where: { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } }, _sum: { total: true } }),
    db.order.findMany({ take: 7, orderBy: { createdAt: 'desc' }, select: { id: true, orderNumber: true, total: true, status: true, createdAt: true, user: { select: { name: true, phone: true } } } }),
    db.product.findMany({ take: 5, where: { active: true }, orderBy: { updatedAt: 'desc' }, select: { id: true, name: true, salePrice: true, variants: { select: { stock: true, reserved: true } }, images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } } } }),
    db.return.count({ where: { status: { in: ['REQUESTED', 'APPROVED', 'PICKUP_SCHEDULED'] } } }),
    db.payment.count({ where: { status: 'FAILED' } }),
  ]);

  const availableUnits = await db.productVariant.aggregate({ _sum: { stock: true } });
  const navStats = [
    ['Orders', orders.toLocaleString('en-IN'), 'All orders', '/admin/orders'],
    ['Revenue', money(revenue._sum.total || 0), 'Confirmed → delivered', '/admin/analytics'],
    ['Customers', customers.toLocaleString('en-IN'), 'Registered customers', '/admin/customers'],
    ['Products', products.toLocaleString('en-IN'), `${variants.toLocaleString('en-IN')} variants`, '/admin/products'],
    ['Available stock', (availableUnits._sum.stock || 0).toLocaleString('en-IN'), `${lowStock} variants need attention`, '/admin/inventory'],
  ] as const;

  return (
    <div className="adminDashboardV4">
      <AdminResponsiveNav name={name} />
      <section className="adminDashboardMain">
        <header className="adminDashboardTopbar">
          <div className="adminDashboardSearch"><span>⌕</span><input placeholder="Search products, orders, customers…" aria-label="Search admin"/><kbd>Ctrl K</kbd></div>
          <div className="adminDashboardTopActions"><Link href="/" className="adminTopButton">View store ↗</Link><Link href="/admin/settings" className="adminTopAvatar" title={email || name}>{initials(name)}</Link></div>
        </header>

        <main className="adminDashboardContent">
          <div className="adminDashboardHero">
            <div><span className="adminDashboardEyebrow">PRIYASA COMMERCE OS · LIVE CONTROL CENTER</span><h1>Good morning, {name.split(' ')[0]}.</h1><p>Manage your storefront, catalog, customers, orders and growth from one place.</p></div>
            <div className="adminDashboardHeroActions"><Link href="/admin/cms" className="adminLightButton">Homepage Studio</Link><Link href="/admin/products/new" className="adminPrimaryButton">＋ Add product</Link></div>
          </div>

          <div className="adminDashboardStats">{navStats.map(([label, value, meta, href]) => <Link href={href} className="adminDashboardStat" key={label}><span>{label}</span><strong>{value}</strong><small>{meta}</small><i>→</i></Link>)}</div>

          <section className="adminDashboardFeatureGrid">
            <div className="adminDashboardPanel adminSalesPanel"><div className="adminPanelHeader"><div><span>BUSINESS SNAPSHOT</span><h2>Store performance</h2></div><Link href="/admin/analytics">Open analytics →</Link></div><div className="adminSalesMetrics"><div><small>Revenue</small><strong>{money(revenue._sum.total || 0)}</strong><span>Paid order lifecycle</span></div><div><small>Orders</small><strong>{orders.toLocaleString('en-IN')}</strong><span>All order records</span></div><div><small>Low stock</small><strong>{lowStock}</strong><span>Variants ≤ 5 units</span></div></div><div className="adminMiniChart"><div className="chartLine"><span/><span/><span/><span/><span/><span/><span/></div><div className="chartLabels"><small>Mon</small><small>Tue</small><small>Wed</small><small>Thu</small><small>Fri</small><small>Sat</small><small>Sun</small></div></div></div>
            <div className="adminDashboardPanel adminAttentionPanel"><div className="adminPanelHeader"><div><span>ATTENTION</span><h2>Needs action</h2></div></div><Link href="/admin/inventory" className="adminAttentionRow"><b className="warn">{lowStock}</b><span><strong>Low-stock variants</strong><small>Review stock before orders are affected.</small></span><em>→</em></Link><Link href="/admin/returns-refunds" className="adminAttentionRow"><b>{pendingReturns}</b><span><strong>Returns awaiting action</strong><small>Requests ready for operations review.</small></span><em>→</em></Link><Link href="/admin/analytics" className="adminAttentionRow"><b>{failedPayments}</b><span><strong>Failed payments</strong><small>Review payment exceptions.</small></span><em>→</em></Link></div>
          </section>

          <section className="adminDashboardPanel adminQuickPanel"><div className="adminPanelHeader"><div><span>FAST OPERATIONS</span><h2>Quick actions</h2></div><Link href="/admin/settings">All settings →</Link></div><div className="adminQuickGrid">{quickCards.map(([icon, title, desc, href]) => <Link href={href} key={href}><b>{icon}</b><span><strong>{title}</strong><small>{desc}</small></span><i>→</i></Link>)}</div></section>

          <section className="adminDashboardColumns">
            <div className="adminDashboardPanel"><div className="adminPanelHeader"><div><span>COMMERCE</span><h2>Recent orders</h2></div><Link href="/admin/orders">View all →</Link></div><div className="adminOrderList">{recentOrders.map((order) => <Link href={`/admin/orders/${order.id}`} key={order.id}><span className="adminOrderNumber">#{order.orderNumber}</span><span className="adminOrderCustomer"><strong>{order.user?.name || 'Customer'}</strong><small>{order.user?.phone || 'Guest'}</small></span><span className="adminOrderAmount">{money(order.total)}</span><span className="adminStatus">{String(order.status).replaceAll('_', ' ')}</span></Link>)}{!recentOrders.length && <div className="adminEmpty">No orders yet.</div>}</div></div>
            <div className="adminDashboardPanel"><div className="adminPanelHeader"><div><span>CATALOG</span><h2>Recently updated</h2></div><Link href="/admin/products">Catalog →</Link></div><div className="adminProductList">{topProducts.map((product) => { const stock = product.variants.reduce((n, v) => n + Math.max(0, v.stock - v.reserved), 0); return <Link href={`/admin/products/${product.id}/edit`} key={product.id}><img src={product.images[0]?.url || '/images/product-placeholder.svg'} alt=""/><span><strong>{product.name}</strong><small>{money(product.salePrice)} · {stock} sellable</small></span><i>→</i></Link>; })}</div></div>
          </section>

          <section className="adminDashboardPanel adminHomeStudio"><div className="adminHomeStudioCopy"><span>MERCHANDISING</span><h2>Control the storefront without code.</h2><p>Add or update banners, build image carousels, create feature sections and redirect every creative to a category or product.</p><div><Link href="/admin/cms" className="adminPrimaryButton">Open Homepage Studio</Link><Link href="/admin/products/bulk" className="adminLightButton">Bulk catalog tools</Link></div></div><div className="adminHomeStudioTiles"><Link href="/admin/cms"><strong>Banner</strong><small>Upload or image URL</small></Link><Link href="/admin/cms"><strong>Carousel</strong><small>Multiple creatives</small></Link><Link href="/admin/cms"><strong>Sections</strong><small>Reorder & schedule</small></Link></div></section>

          <div className="adminDashboardFooter"><BrandLogo compact /><span>Live operational data · Priyasa Commerce OS</span></div>
        </main>
      </section>
    </div>
  );
}
