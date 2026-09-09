'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import styles from '../admin-modern.module.css';
import MetaWhatsAppEmbeddedSignup from '@/components/MetaWhatsAppEmbeddedSignup';
import './whatsapp-reference-v1.css';

type MetaStatus = { connected: boolean; configured: boolean; phoneNumberId?: string; phoneNumber?: string; wabaId?: string; businessName?: string };
type Template = { name: string; language?: string; status?: string; category?: string };
const orderStatuses = [['CREATED','Order created'],['PAYMENT_PENDING','Payment pending'],['CONFIRMED','Order confirmed'],['PROCESSING','Processing'],['SHIPPED','Shipped'],['DELIVERED','Delivered'],['CANCELLED','Cancelled'],['RETURN_REQUESTED','Return requested'],['RETURNED','Returned'],['REFUNDED','Refunded']] as const;

export default function WhatsAppCommerce() {
  const [meta, setMeta] = useState<MetaStatus>({ connected: false, configured: false });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const showMessage = useCallback((value: string) => setMessage(value), []);

  async function load() {
    try {
      const r = await fetch('/api/admin/whatsapp/meta/status', { cache: 'no-store' });
      const data = await r.json();
      setMeta(data);
      const params = new URLSearchParams(window.location.search);
      if (params.get('meta') === 'connected') setMessage('Meta WhatsApp connected successfully. Sync approved templates to continue.');
      if (params.get('meta') === 'callback_failed') setMessage(params.get('reason') || 'Meta connection could not be completed.');
    } catch {
      setMessage('Unable to read Meta connection status.');
    }
  }
  useEffect(() => { void load(); }, []);

  async function syncTemplates() {
    setBusy(true); setMessage('');
    try {
      const r = await fetch('/api/admin/whatsapp/meta/templates/sync', { method: 'POST' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Template sync failed');
      const approved = (d.templates || []).filter((t: Template) => t.status === 'APPROVED');
      setTemplates(d.templates || []);
      setMessage(`Synced ${d.templates?.length || 0} templates; ${approved.length} approved and ready for mapping.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Template sync failed');
    } finally { setBusy(false); }
  }

  async function enable(status: string, label: string) {
    const templateKey = mapping[status];
    if (!templateKey) { setMessage(`Select an approved Meta template for ${label} first.`); return; }
    setBusy(true); setMessage('');
    try {
      const r = await fetch('/api/admin/automations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `WhatsApp · ${label}`, trigger: `order.${status.toLowerCase()}`, conditions: { status: status.toLowerCase() }, actions: [{ type: 'SEND_WHATSAPP', templateKey, languageCode: templates.find((t) => t.name === templateKey)?.language || 'en_US' }], enabled: true }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Unable to create workflow');
      setMessage(`${label} WhatsApp workflow is enabled.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to create workflow');
    } finally { setBusy(false); }
  }

  return <div className={styles.shell}>
    <aside className={styles.side}><div className={styles.brand}><div className={styles.brandMark}>P</div><div className={styles.brandText}>PRIYASA<span>Commerce OS</span></div></div><div className={styles.navTitle}>CONVERSATION</div><nav className={styles.nav}><Link href="/admin">Overview</Link><Link href="/admin/marketing">Growth center</Link><Link className={styles.active} href="/admin/whatsapp">WhatsApp Commerce</Link><Link href="/admin/marketing-automation">Automation</Link><Link href="/admin/orders">Orders</Link></nav></aside>
    <main className={styles.main}><header className={styles.top}><div className={styles.topSpacer}/><Link className={styles.topLink} href="/admin">Dashboard</Link><div className={styles.avatar}>P</div></header>
      <div className={styles.content}>
        <div className={styles.head}><div><div className={styles.kicker}>WHATSAPP COMMERCE · META EMBEDDED SIGNUP</div><h1>Conversation command center</h1><p>Connect your WhatsApp Business Account directly through Meta, sync approved templates and automate customer notifications from real Priyasa order-status transitions.</p></div><div className={styles.headActions}><Link className={styles.secondary} href="/admin/orders">Manage orders</Link><MetaWhatsAppEmbeddedSignup onMessage={showMessage} className={styles.primary} /></div></div>
        {message && <div className="wa-notice">{message}</div>}
        <section className={styles.section}><div className={styles.panelHead}><div><h2>One-click Meta connection</h2><p>Admins authorize Priyasa through Meta Embedded Signup. No customer-side API token, WABA ID or phone-number credentials are entered here.</p></div><span className={`${styles.pill} ${meta.connected ? 'wa-good' : ''}`}>{meta.connected ? 'CONNECTED' : 'NOT CONNECTED'}</span></div><div className="wa-connect-grid"><div className="wa-card"><span className={styles.kicker}>BUSINESS ACCOUNT</span><strong>{meta.businessName || meta.wabaId || 'Connect through Meta'}</strong><small>{meta.wabaId ? `WABA ${meta.wabaId}` : 'Discovered after authorization'}</small></div><div className="wa-card"><span className={styles.kicker}>PHONE NUMBER</span><strong>{meta.phoneNumber || meta.phoneNumberId || 'Connect through Meta'}</strong><small>{meta.phoneNumberId ? `Phone ID ${meta.phoneNumberId}` : 'Discovered from WABA'}</small></div><div className="wa-card"><span className={styles.kicker}>WEBHOOK</span><strong>{meta.configured ? 'Connected' : 'Auto setup after onboarding'}</strong><small>Inbound delivery and status events</small></div></div><div className="wa-actions"><MetaWhatsAppEmbeddedSignup onMessage={showMessage} className={styles.primary} /><span>Meta hosts the authorization screen. Priyasa exchanges the temporary authorization code server-side and keeps the resulting token encrypted.</span></div></section>
        <section className={styles.section}><div className={styles.panelHead}><div><h2>Meta template sync</h2><p>Read the live template catalogue from the connected WABA and use only APPROVED templates for customer messaging.</p></div><button className={styles.secondary} disabled={!meta.connected || busy} onClick={() => void syncTemplates()}>↻ Sync templates</button></div>{templates.length ? <div className="wa-template-grid">{templates.map(t => <div className="wa-template" key={`${t.name}-${t.language}`}><div><strong>{t.name}</strong><span>{t.language || 'default language'}</span></div><b>{t.status || 'UNKNOWN'}</b><small>{t.category || 'WhatsApp template'}</small></div>)}</div> : <div className="wa-empty">Connect Meta first, then sync to fetch the live approved template catalogue.</div>}</section>
        <section className={styles.section}><div className={styles.panelHead}><div><h2>Manage order-status messages</h2><p>Map each real commerce status to a synced Meta template, then create the corresponding automation rule.</p></div><span className={styles.pill}>{orderStatuses.length} STATUS FLOWS</span></div><div className="wa-status-list">{orderStatuses.map(([status, label]) => <div className="wa-status-row" key={status}><div><strong>{label}</strong><span>order.{status.toLowerCase()} → WhatsApp</span></div><select value={mapping[status] || ''} onChange={e => setMapping(m => ({ ...m, [status]: e.target.value }))} disabled={!templates.length || busy}><option value="">Select approved template…</option>{templates.filter(t => t.status === 'APPROVED').map(t => <option key={`${t.name}-${t.language}`} value={t.name}>{t.name} · {t.language || 'default'}</option>)}</select><button className={styles.secondary} disabled={!meta.connected || busy || !mapping[status]} onClick={() => void enable(status, label)}>Enable</button></div>)}</div></section>
        <div className={styles.footerNote}>Meta Embedded Signup is hosted by Meta. Priyasa uses the Facebook JavaScript SDK to launch the authorization dialog, receives a short-lived authorization code, and completes the server-side exchange; the connected store never needs to enter a Meta API token.</div>
      </div>
    </main>
  </div>;
}
