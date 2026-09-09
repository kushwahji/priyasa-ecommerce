'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import styles from '../admin-modern.module.css';
import MetaWhatsAppEmbeddedSignup from '@/components/MetaWhatsAppEmbeddedSignup';
import './whatsapp-reference-v1.css';

type MetaStatus = { connected: boolean; configured: boolean; phoneNumberId?: string; phoneNumber?: string; wabaId?: string; businessName?: string };
type Template = { name: string; language?: string; status?: string; category?: string; components?: Array<{ type?: string; text?: string; parameters?: number }> };
type Delivery = { providerMessageId: string; orderId?: string; recipient: string; templateName: string; status: string; error?: string; updatedAt?: string };
type FlowConfig = { template?: string; language?: string; freeText?: string; parameters?: string[] };
const orderStatuses = [['CREATED','Order created'],['PAYMENT_PENDING','Payment pending'],['CONFIRMED','Order confirmed'],['PROCESSING','Processing'],['SHIPPED','Shipped'],['DELIVERED','Delivered'],['CANCELLED','Cancelled'],['RETURN_REQUESTED','Return requested'],['RETURNED','Returned'],['REFUNDED','Refunded']] as const;
const variables = ['orderNumber','status','customerName','total','trackingNumber','trackingUrl','previousStatus'];
const defaultText = (label: string) => `Hi {{customerName}}, your Priyasa order #{{orderNumber}} is now ${label.toLowerCase()}.{{trackingNumber}}`;

export default function WhatsAppCommerce() {
  const [meta, setMeta] = useState<MetaStatus>({ connected: false, configured: false });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [flows, setFlows] = useState<Record<string, FlowConfig>>({});
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const showMessage = useCallback((value: string) => setMessage(value), []);

  async function load() {
    try {
      const r = await fetch('/api/admin/whatsapp/meta/status', { cache: 'no-store' });
      setMeta(await r.json());
      const params = new URLSearchParams(window.location.search);
      if (params.get('meta') === 'connected') setMessage('Meta WhatsApp connected successfully. Sync approved templates to continue.');
      if (params.get('meta') === 'callback_failed') setMessage(params.get('reason') || 'Meta connection could not be completed.');
      const ar = await fetch('/api/admin/automations', { cache: 'no-store' });
      if (ar.ok) {
        const data = await ar.json();
        const rules = Array.isArray(data.automations) ? data.automations : [];
        const next: Record<string, boolean> = {};
        for (const rule of rules) if (typeof rule.trigger === 'string' && rule.trigger.startsWith('order.')) next[rule.trigger.replace('order.','').toUpperCase()] = !!rule.enabled;
        setEnabled(next);
      }
    } catch { setMessage('Unable to read Meta connection status.'); }
  }
  async function loadDeliveries() {
    try { const r = await fetch('/api/admin/whatsapp/meta/messages', { cache: 'no-store' }); if (r.ok) setDeliveries((await r.json()).messages || []); } catch { /* monitoring must not block commerce controls */ }
  }
  useEffect(() => { void load(); void loadDeliveries(); const timer = window.setInterval(() => void loadDeliveries(), 15000); return () => window.clearInterval(timer); }, []);

  async function syncTemplates() {
    setBusy(true); setMessage('');
    try {
      const r = await fetch('/api/admin/whatsapp/meta/templates/sync', { method: 'POST' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Template sync failed');
      setTemplates(d.templates || []);
      const approved = (d.templates || []).filter((t: Template) => t.status === 'APPROVED');
      setMessage(`Synced ${d.templates?.length || 0} templates; ${approved.length} approved and ready for mapping.`);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Template sync failed'); }
    finally { setBusy(false); }
  }

  function setFlow(status: string, patch: Partial<FlowConfig>) {
    setFlows(current => ({ ...current, [status]: { ...current[status], ...patch } }));
  }

  async function enable(status: string, label: string) {
    const flow = flows[status] || {};
    const templateKey = flow.template;
    if (!templateKey) { setMessage(`Select an approved Utility template for ${label} first. It is the fallback outside the 24-hour window.`); return; }
    const selected = templates.find(t => t.name === templateKey && t.status === 'APPROVED');
    if (selected?.category && selected.category.toUpperCase() !== 'UTILITY') { setMessage(`${templateKey} is ${selected.category}, not Utility. Choose an approved Utility template for order-status notifications.`); return; }
    setBusy(true); setMessage('');
    try {
      const r = await fetch('/api/admin/automations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `WhatsApp · ${label}`, trigger: `order.${status.toLowerCase()}`, conditions: { status: status.toLowerCase() }, actions: [{ type: 'SEND_WHATSAPP', templateKey, languageCode: flow.language || selected?.language || 'en_US', parameters: flow.parameters?.length ? flow.parameters : ['orderNumber','status'], freeTextMessage: flow.freeText || defaultText(label) }], enabled: true }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Unable to create workflow');
      setEnabled(current => ({ ...current, [status]: true }));
      setMessage(`${label} workflow is enabled. Inside 24h it sends the free-form message; after 24h it falls back to the approved Utility template.`);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to create workflow'); }
    finally { setBusy(false); }
  }

  const deliveryStats = deliveries.reduce((a, d) => { a[d.status] = (a[d.status] || 0) + 1; return a; }, {} as Record<string, number>);
  const approvedUtility = templates.filter(t => t.status === 'APPROVED' && (!t.category || t.category.toUpperCase() === 'UTILITY'));

  return <div className={styles.shell}>
    <aside className={styles.side}><div className={styles.brand}><div className={styles.brandMark}>P</div><div className={styles.brandText}>PRIYASA<span>Commerce OS</span></div></div><div className={styles.navTitle}>CONVERSATION</div><nav className={styles.nav}><Link href="/admin">Overview</Link><Link href="/admin/marketing">Growth center</Link><Link className={styles.active} href="/admin/whatsapp">WhatsApp Commerce</Link><Link href="/admin/marketing-automation">Automation</Link><Link href="/admin/orders">Orders</Link></nav></aside>
    <main className={styles.main}><header className={styles.top}><div className={styles.topSpacer}/><Link className={styles.topLink} href="/admin">Dashboard</Link><div className={styles.avatar}>P</div></header>
      <div className={styles.content}>
        <div className={styles.head}><div><div className={styles.kicker}>WHATSAPP COMMERCE · META EMBEDDED SIGNUP</div><h1>Conversation command center</h1><p>Connect WhatsApp through Meta, sync approved templates and automate real Priyasa order-status transitions.</p></div><div className={styles.headActions}><Link className={styles.secondary} href="/admin/orders">Manage orders</Link><MetaWhatsAppEmbeddedSignup onMessage={showMessage} className={styles.primary} /></div></div>
        {message && <div className="wa-notice">{message}</div>}
        <section className={styles.section}><div className={styles.panelHead}><div><h2>One-click Meta connection</h2><p>Admins authorize Priyasa through Meta Embedded Signup. No customer-side API token, WABA ID or phone-number credentials are entered here.</p></div><span className={`${styles.pill} ${meta.connected ? 'wa-good' : ''}`}>{meta.connected ? 'CONNECTED' : 'NOT CONNECTED'}</span></div><div className="wa-connect-grid"><div className="wa-card"><span className={styles.kicker}>BUSINESS ACCOUNT</span><strong>{meta.businessName || meta.wabaId || 'Connect through Meta'}</strong><small>{meta.wabaId ? `WABA ${meta.wabaId}` : 'Discovered after authorization'}</small></div><div className="wa-card"><span className={styles.kicker}>PHONE NUMBER</span><strong>{meta.phoneNumber || meta.phoneNumberId || 'Connect through Meta'}</strong><small>{meta.phoneNumberId ? `Phone ID ${meta.phoneNumberId}` : 'Discovered from WABA'}</small></div><div className="wa-card"><span className={styles.kicker}>WEBHOOK</span><strong>{meta.configured ? 'Connected' : 'Auto setup after onboarding'}</strong><small>Inbound delivery and status events</small></div></div></section>
        <section className={styles.section}><div className={styles.panelHead}><div><h2>Meta template sync</h2><p>Use only live APPROVED Utility templates for the outside-24h fallback.</p></div><button className={styles.secondary} disabled={!meta.connected || busy} onClick={() => void syncTemplates()}>↻ Sync templates</button></div>{templates.length ? <div className="wa-template-grid">{templates.map(t => <div className="wa-template" key={`${t.name}-${t.language}`}><div><strong>{t.name}</strong><span>{t.language || 'default language'}</span></div><b>{t.status || 'UNKNOWN'}</b><small>{t.category || 'WhatsApp template'}</small></div>)}</div> : <div className="wa-empty">Connect Meta first, then sync the live template catalogue.</div>}</section>
        <section className={styles.section}><div className={styles.panelHead}><div><h2>24-hour order-status automation</h2><p>Configure both paths once. If the customer messaged Priyasa within the last 24 hours, the workflow sends a free-form status update. When that window is closed, the same event automatically uses the approved Utility template.</p></div><span className={styles.pill}>{approvedUtility.length} UTILITY TEMPLATES</span></div>
          <div className="wa-status-list">{orderStatuses.map(([status, label]) => { const flow = flows[status] || {}; const preview = (flow.freeText || defaultText(label)).replace(/\{\{customerName\}\}/g,'Aarav').replace(/\{\{orderNumber\}\}/g,'PRY-1048').replace(/\{\{trackingNumber\}\}/g,'TRK123456'); return <div className="wa-status-row wa-status-row--editor" key={status}>
            <div className="wa-flow-title"><strong>{label}</strong><span>order.{status.toLowerCase()} → policy-aware WhatsApp</span><em className={enabled[status] ? 'wa-flow-on' : ''}>{enabled[status] ? 'ENABLED' : 'DRAFT'}</em></div>
            <div className="wa-flow-controls">
              <label>Approved Utility fallback<select value={flow.template || ''} onChange={e => { const t = templates.find(x => x.name === e.target.value && x.status === 'APPROVED'); setFlow(status, { template: e.target.value, language: t?.language || 'en_US' }); }} disabled={!approvedUtility.length || busy}><option value="">Select Utility template…</option>{approvedUtility.map(t => <option key={`${t.name}-${t.language}`} value={t.name}>{t.name} · {t.language || 'default'}</option>)}</select></label>
              <label>Template variables<select multiple value={flow.parameters || ['orderNumber','status']} onChange={e => setFlow(status, { parameters: Array.from(e.target.selectedOptions).map(o => o.value) })} disabled={busy}>{variables.map(v => <option key={v} value={v}>{`{{${v}}}`}</option>)}</select></label>
              <label>Free-form message inside 24h<textarea value={flow.freeText ?? defaultText(label)} onChange={e => setFlow(status, { freeText: e.target.value })} disabled={busy} rows={3}/></label>
              <div className="wa-flow-preview"><span>LIVE PREVIEW</span><p>{preview}</p></div>
              <button className={styles.secondary} disabled={!meta.connected || busy || !flow.template} onClick={() => void enable(status, label)}>{enabled[status] ? 'Update workflow' : 'Enable workflow'}</button>
            </div>
          </div>; })}</div>
        </section>
        <section className={styles.section}><div className={styles.panelHead}><div><h2>Live delivery monitoring</h2><p>Meta delivery webhooks update accepted messages as sent, delivered, read or failed.</p></div><span className={styles.pill}>{deliveries.length} RECENT</span></div><div className="wa-connect-grid"><div className="wa-card"><span className={styles.kicker}>SENT</span><strong>{deliveryStats.SENT || 0}</strong><small>Accepted by Meta</small></div><div className="wa-card"><span className={styles.kicker}>DELIVERED</span><strong>{deliveryStats.DELIVERED || 0}</strong><small>Delivered to recipient</small></div><div className="wa-card"><span className={styles.kicker}>READ / FAILED</span><strong>{(deliveryStats.READ || 0) + (deliveryStats.FAILED || 0)}</strong><small>{deliveryStats.READ || 0} read · {deliveryStats.FAILED || 0} failed</small></div></div>{deliveries.length ? <div className="wa-template-grid">{deliveries.slice(0, 12).map(d => <div className="wa-template" key={d.providerMessageId}><div><strong>{d.templateName}</strong><span>{d.recipient}</span></div><b>{d.status}</b><small>{d.error || (d.orderId ? `Order ${d.orderId}` : 'WhatsApp message')}</small></div>)}</div> : <div className="wa-empty">No WhatsApp messages have been sent yet.</div>}</section>
        <div className={styles.footerNote}>The 24-hour policy is enforced server-side. An order-status automation cannot silently send a free-form message outside the customer-service window; it requires the configured approved Utility fallback.</div>
      </div>
    </main>
  </div>;
}
