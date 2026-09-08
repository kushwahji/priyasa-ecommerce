import Link from 'next/link';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import InventoryAdjuster from '@/components/InventoryAdjuster';
import styles from '../admin-modern.module.css';

export default async function Inventory() {
  const s = await getSession();
  if (!s || !['ADMIN', 'STAFF'].includes(s.role)) redirect('/admin/login');

  const rows = await db.productVariant.findMany({ include: { product: true }, orderBy: { stock: 'asc' } });
  const totalStock = rows.reduce((n, v) => n + v.stock, 0);
  const reserved = rows.reduce((n, v) => n + v.reserved, 0);
  const available = rows.reduce((n, v) => n + Math.max(0, v.stock - v.reserved), 0);
  const low = rows.filter(v => Math.max(0, v.stock - v.reserved) <= 5).length;
  const out = rows.filter(v => Math.max(0, v.stock - v.reserved) <= 0).length;

  return (
    <div className={styles.shell}>
      <aside className={styles.side}>
        <Link href="/admin" className={styles.brand}><span className={styles.brandMark}>P</span><span className={styles.brandText}><strong>PRIYASA</strong><small>COMMERCE CONTROL</small></span></Link>
        <div className={styles.navTitle}>Operations</div>
        <nav className={styles.nav}>
          <Link href="/admin">⌂ Dashboard</Link><Link href="/admin/orders">▣ Orders</Link><Link href="/admin/products">◈ Products</Link><Link className={styles.active} href="/admin/inventory">▤ Inventory</Link><Link href="/admin/returns-refunds">↩ Returns</Link>
        </nav>
      </aside>
      <main className={styles.main}>
        <header className={styles.top}><input className={styles.search} placeholder="Search the control center…" aria-label="Search control center"/><span className={styles.topSpacer}/><Link className={styles.topLink} href="/admin/products">Catalog</Link><Link className={styles.topLink} href="/admin/orders">Orders</Link><span className={styles.avatar}>{s.name?.slice(0,1).toUpperCase() || 'A'}</span></header>
        <div className={styles.content}>
          <div className={styles.head}><div><div className={styles.kicker}>Operations / Inventory</div><h1>Stock control</h1><p>Live variant availability, reservations and transactional adjustments.</p></div><div className={styles.headActions}><Link className={styles.secondary} href="/admin/products">Manage catalog</Link><Link className={styles.primary} href="/admin/orders">View orders</Link></div></div>
          <div className={styles.stats}>
            <div className={styles.stat}><div className={styles.statTop}><div><div className={styles.statLabel}>Total units</div><div className={styles.statValue}>{totalStock.toLocaleString('en-IN')}</div><div className={styles.statMeta}>Across {rows.length} variants</div></div><span className={styles.statIcon}>Σ</span></div></div>
            <div className={styles.stat}><div className={styles.statTop}><div><div className={styles.statLabel}>Available</div><div className={styles.statValue}>{available.toLocaleString('en-IN')}</div><div className={styles.statMeta}>Sellable after reservations</div></div><span className={styles.statIcon}>✓</span></div></div>
            <div className={styles.stat}><div className={styles.statTop}><div><div className={styles.statLabel}>Reserved</div><div className={styles.statValue}>{reserved.toLocaleString('en-IN')}</div><div className={styles.statMeta}>Held for active orders</div></div><span className={styles.statIcon}>◷</span></div></div>
            <div className={styles.stat}><div className={styles.statTop}><div><div className={styles.statLabel}>Attention</div><div className={styles.statValue}>{low}</div><div className={styles.statMeta}>{out} currently out of stock</div></div><span className={styles.statIcon}>!</span></div></div>
          </div>
          <section className={styles.section}>
            <div className={styles.panel}>
              <div className={styles.panelHead}><div><h3>Variant inventory</h3><span>Available = stock − reserved</span></div><span className={styles.pill}>{rows.length} variants</span></div>
              <div style={{overflowX:'auto'}}><table className={styles.table}><thead><tr><th>Product</th><th>SKU</th><th>Size</th><th>Color</th><th>Stock</th><th>Reserved</th><th>Available</th><th>Adjustment</th></tr></thead><tbody>{rows.map(v => { const a=Math.max(0,v.stock-v.reserved); return <tr key={v.id}><td><strong>{v.product.name}</strong></td><td>{v.sku}</td><td>{v.size}</td><td>{v.color}</td><td>{v.stock}</td><td>{v.reserved}</td><td><span className={styles.pill}>{a}</span></td><td><InventoryAdjuster variantId={v.id} stock={v.stock} reserved={v.reserved}/></td></tr>})}</tbody></table></div>
              {!rows.length && <div className="empty">No inventory variants found. Add products and variants to begin.</div>}
            </div>
          </section>
          <p className={styles.footerNote}>Inventory adjustments remain transactional and auditable; reserved units are protected from overselling.</p>
        </div>
      </main>
    </div>
  );
}