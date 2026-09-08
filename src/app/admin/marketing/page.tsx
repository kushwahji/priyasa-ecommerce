import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import styles from '../admin-modern.module.css';

const modules = [
  { title: 'Meta Ads & acquisition', label: 'PAID GROWTH', text: 'Connect ad assets, product feeds and conversion signals; keep campaign operations separated from commerce data.', href: '/admin/ads', action: 'Open Ads workspace', icon: '↗' },
  { title: 'WhatsApp Commerce', label: 'CONVERSATION', text: 'Manage WhatsApp ordering, lifecycle messaging, webhook health and customer recovery flows.', href: '/admin/whatsapp', action: 'Open WhatsApp', icon: '◌' },
  { title: 'Lifecycle automation', label: 'RETENTION', text: 'Build abandoned-cart, first-order, repeat-buyer and win-back journeys from live customer segments.', href: '/admin/marketing-automation', action: 'Open automation', icon: '⚡' },
  { title: 'Offers & coupons', label: 'PRICING', text: 'Create timed discount rules, usage limits and storefront offer campaigns with server-side safeguards.', href: '/admin/coupons-offers', action: 'Manage promotions', icon: '◇' },
  { title: 'Merchandising CMS', label: 'STOREFRONT', text: 'Control hero campaigns, banners, collections, product rails and scheduled storefront content.', href: '/admin/cms', action: 'Open CMS', icon: '▧' },
  { title: 'Commerce analytics', label: 'MEASUREMENT', text: 'Read revenue, orders, products and customer performance to decide where the next campaign should focus.', href: '/admin/analytics', action: 'View analytics', icon: '◒' },
];

export default async function Marketing() {
  const s = await getSession();
  if (!s || !['ADMIN', 'STAFF'].includes(s.role)) redirect('/admin/login');

  return <div className={styles.shell}>
    <aside className={styles.side}>
      <Link href="/admin" className={styles.brand}><span className={styles.brandMark}>P</span><span className={styles.brandText}><strong>PRIYASA</strong><small>COMMERCE CONTROL</small></span></Link>
      <div className={styles.navTitle}>Growth</div>
      <nav className={styles.nav}>
        <Link href="/admin">⌂ Dashboard</Link>
        <Link className={styles.active} href="/admin/marketing">◈ Growth center</Link>
        <Link href="/admin/customers">◎ Customer 360</Link>
        <Link href="/admin/coupons-offers">◇ Offers & Coupons</Link>
        <Link href="/admin/marketing-automation">⚡ Automation</Link>
        <Link href="/admin/analytics">◒ Analytics</Link>
      </nav>
    </aside>
    <main className={styles.main}>
      <header className={styles.top}><div className={styles.topSpacer}/><Link className={styles.topLink} href="/admin">Dashboard</Link><span className={styles.avatar}>P</span></header>
      <div className={styles.content}>
        <div className={styles.head}>
          <div><div className={styles.kicker}>GROWTH OPERATING SYSTEM</div><h1>Marketing & AI command center</h1><p>One workspace for acquisition, retention, offers, conversations, merchandising and measurement.</p></div>
          <div className={styles.headActions}><Link className={styles.secondary} href="/admin/customers">Customer 360</Link><Link className={styles.primary} href="/admin/marketing-automation">Launch automation →</Link></div>
        </div>

        <section className={styles.section}>
          <div className={styles.panelHead}><div><h2>Growth stack</h2><p>Each surface is connected to the existing Priyasa commerce engines rather than being a decorative dashboard.</p></div><span className={styles.pill}>{modules.length} modules</span></div>
          <div className={styles.quick}>{modules.map(m => <article key={m.title} className={styles.panel} style={{flex:'1 1 300px',padding:22}}><div className={styles.statTop}><span className={styles.kicker}>{m.label}</span><span className={styles.statIcon}>{m.icon}</span></div><h3 style={{margin:'12px 0 8px'}}>{m.title}</h3><p className="muted" style={{minHeight:58}}>{m.text}</p><Link className={styles.secondary} href={m.href}>{m.action} →</Link></article>)}</div>
        </section>

        <section className={styles.section}>
          <div className={styles.panelHead}><div><h2>Campaign operating loop</h2><p>Use the system in this order for controlled growth.</p></div></div>
          <div className={styles.stats}>
            {[
              ['01','Discover','Customer segments, product performance and demand signals'],
              ['02','Create','Offer, content, creative and lifecycle playbook'],
              ['03','Activate','Meta, WhatsApp, email and storefront surfaces'],
              ['04','Measure','Orders, revenue, redemptions and retention outcomes'],
            ].map(([n,t,d]) => <div className={styles.stat} key={n}><div className={styles.statTop}><span className={styles.statLabel}>{n}</span><span className={styles.statIcon}>→</span></div><strong className={styles.statValue} style={{fontSize:20}}>{t}</strong><span className={styles.statMeta}>{d}</span></div>)}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.panelHead}><div><h2>AI-assisted marketing</h2><p>AI is positioned as an approval-gated copilot, not an uncontrolled publisher.</p></div><span className={styles.pill}>HUMAN APPROVAL</span></div>
          <div className={styles.quick}>
            {['Product copy & SEO metadata','Ad copy and creative briefs','Campaign ideas from commerce signals','Personalized recommendation concepts'].map((x,i) => <div className={styles.panel} key={x} style={{flex:'1 1 220px',padding:18}}><span className={styles.statIcon}>✦</span><h3>{x}</h3><p className="muted">Generate → review → approve → publish through the appropriate commerce surface.</p><span className={styles.pill}>COPILOT {i+1}</span></div>)}
          </div>
        </section>

        <div className={styles.footerNote}>Provider credentials, delivery adapters and publishing actions remain isolated behind authenticated server APIs. This page is the control surface, not a replacement for those integrations.</div>
      </div>
    </main>
  </div>;
}
