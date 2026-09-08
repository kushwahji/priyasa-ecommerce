import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { money } from '@/lib/catalog';
import AdminReturnActions from '@/components/AdminReturnActions';
import styles from '../admin-modern.module.css';

export default async function ReturnsRefunds() {
  const s = await getSession();
  if (!s || !['ADMIN', 'STAFF'].includes(s.role)) redirect('/admin/login');

  const returns = await db.return.findMany({ include: { order: { include: { user: true, payment: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
  const refunds = await db.refund.findMany({ include: { payment: { include: { order: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
  const pending = returns.filter(r => !['REFUNDED', 'REJECTED'].includes(r.status)).length;
  const requested = returns.filter(r => r.status === 'REQUESTED').length;
  const refunded = refunds.filter(r => r.status === 'SUCCESS' || r.status === 'REFUNDED').reduce((n,r) => n + r.amount, 0);

  return (
    <div className={styles.shell}>
      <aside className={styles.side}>
        <Link href="/admin" className={styles.brand}><span className={styles.brandMark}>P</span><span className={styles.brandText}><strong>PRIYASA</strong><small>COMMERCE CONTROL</small></span></Link>
        <div className={styles.navTitle}>Operations</div>
        <nav className={styles.nav}><Link href="/admin">⌂ Dashboard</Link><Link href="/admin/orders">▣ Orders</Link><Link href="/admin/inventory">▤ Inventory</Link><Link className={styles.active} href="/admin/returns-refunds">↩ Returns & refunds</Link><Link href="/admin/customers">♙ Customers</Link></nav>
      </aside>
      <main className={styles.main}>
        <header className={styles.top}><input className={styles.search} placeholder="Search the control center…" aria-label="Search control center"/><span className={styles.topSpacer}/><Link className={styles.topLink} href="/admin/orders">Orders</Link><Link className={styles.topLink} href="/admin/customers">Customers</Link><span className={styles.avatar}>{s.name?.slice(0,1).toUpperCase() || 'A'}</span></header>
        <div className={styles.content}>
          <div className={styles.head}><div><div className={styles.kicker}>Operations / After sales</div><h1>Returns & refunds</h1><p>Control the return lifecycle and keep customer refunds traceable.</p></div><div className={styles.headActions}><Link className={styles.secondary} href="/admin/orders">Order queue</Link></div></div>
          <div className={styles.stats}>
            <div className={styles.stat}><div className={styles.statTop}><div><div className={styles.statLabel}>Open returns</div><div className={styles.statValue}>{pending}</div><div className={styles.statMeta}>Requests still in workflow</div></div><span className={styles.statIcon}>↩</span></div></div>
            <div className={styles.stat}><div className={styles.statTop}><div><div className={styles.statLabel}>New requests</div><div className={styles.statValue}>{requested}</div><div className={styles.statMeta}>Awaiting first action</div></div><span className={styles.statIcon}>!</span></div></div>
            <div className={styles.stat}><div className={styles.statTop}><div><div className={styles.statLabel}>Return records</div><div className={styles.statValue}>{returns.length}</div><div className={styles.statMeta}>Latest 100 shown</div></div><span className={styles.statIcon}>#</span></div></div>
            <div className={styles.stat}><div className={styles.statTop}><div><div className={styles.statLabel}>Refunded value</div><div className={styles.statValue}>{money(refunded)}</div><div className={styles.statMeta}>Successful refund records</div></div><span className={styles.statIcon}>₹</span></div></div>
          </div>
          <section className={styles.section}>
            <div className={styles.panel}>
              <div className={styles.panelHead}><div><h3>Return requests</h3><span>Approve, schedule, inspect and progress each request.</span></div><span className={styles.pill}>{returns.length} records</span></div>
              <div style={{overflowX:'auto'}}><table className={styles.table}><thead><tr><th>Order</th><th>Customer</th><th>Reason</th><th>Status</th><th>Amount</th><th>Action</th></tr></thead><tbody>{returns.map(r => <tr key={r.id}><td><Link href={`/admin/orders/${r.orderId}`}><strong>{r.order.orderNumber}</strong></Link></td><td>{r.order.user?.name || r.order.user?.phone || 'Guest'}</td><td style={{maxWidth:280,whiteSpace:'normal'}}>{r.reason}</td><td><span className={styles.pill}>{r.status}</span></td><td>{money(r.amount)}</td><td><AdminReturnActions id={r.id} status={r.status} amount={r.amount} total={r.order.total}/></td></tr>)}</tbody></table></div>
              {!returns.length && <div className="empty">No return requests yet. Customer return requests will appear here.</div>}
            </div>
          </section>
          <section className={styles.section}>
            <div className={styles.panel}>
              <div className={styles.panelHead}><div><h3>Refund ledger</h3><span>Provider references and refund status for financial traceability.</span></div><span className={styles.pill}>{refunds.length} records</span></div>
              <div style={{overflowX:'auto'}}><table className={styles.table}><thead><tr><th>Order</th><th>Amount</th><th>Provider refund</th><th>Status</th><th>Created</th></tr></thead><tbody>{refunds.map(r => <tr key={r.id}><td>{r.payment.order.orderNumber}</td><td>{money(r.amount)}</td><td>{r.providerRefundId || '—'}</td><td><span className={styles.pill}>{r.status}</span></td><td>{r.createdAt.toLocaleDateString('en-IN')}</td></tr>)}</tbody></table></div>
              {!refunds.length && <div className="empty">No refunds recorded yet.</div>}
            </div>
          </section>
          <p className={styles.footerNote}>Return actions use the existing audited workflow; refund operations remain provider-backed and idempotent.</p>
        </div>
      </main>
    </div>
  );
}