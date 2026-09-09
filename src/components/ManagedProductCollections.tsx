'use client';

import { useEffect, useState } from 'react';

type CollectionType = 'products-sale' | 'products-latest';
type Section = { id?: string; key: string; type: CollectionType; title?: string | null; subtitle?: string | null; ctaLabel?: string | null; ctaHref?: string | null; active: boolean; sortOrder: number };

const defaults: Record<CollectionType, Omit<Section, 'key'>> = {
  'products-sale': { type: 'products-sale', title: 'Flash Sale', subtitle: 'LIMITED-TIME EDIT', ctaLabel: 'View All Offers', ctaHref: '/offers', active: true, sortOrder: 30 },
  'products-latest': { type: 'products-latest', title: 'Latest Launch', subtitle: 'NEW IN', ctaLabel: 'View All', ctaHref: '/new-arrivals', active: true, sortOrder: 31 },
};

export default function ManagedProductCollections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [draft, setDraft] = useState<Section>(() => ({ key: `home.products.sale`, ...defaults['products-sale'] }));
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch('/api/admin/cms', { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (response.ok) setSections((data.data || []).filter((x: Section) => x.type === 'products-sale' || x.type === 'products-latest'));
  }
  useEffect(() => { void load(); }, []);

  function edit(section: Section) { setDraft({ ...section }); }
  function add(type: CollectionType) { setDraft({ key: `home.products.${type === 'products-sale' ? 'sale' : 'latest'}`, ...defaults[type] }); }

  async function save() {
    setBusy(true); setMessage('Saving collection…');
    try {
      const response = await fetch('/api/admin/cms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to save collection');
      setMessage('Collection published. The storefront will use the latest product data automatically.');
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save collection'); }
    finally { setBusy(false); }
  }

  async function remove(section: Section) {
    if (!section.id || !window.confirm(`Remove ${section.title || section.type}?`)) return;
    const response = await fetch(`/api/admin/cms?id=${encodeURIComponent(section.id)}`, { method: 'DELETE' });
    setMessage(response.ok ? 'Collection removed.' : 'Unable to remove collection.');
    if (response.ok) await load();
  }

  return <section className="managed-product-collections">
    <div className="managed-product-head"><div><span>PRODUCT MERCHANDISING</span><h2>Flash Sale & Latest Launch</h2><p>Control the two homepage product rails. Each rail automatically uses live active products, current price and stock. The storefront displays up to 12 products.</p></div><div className="managed-product-actions"><button onClick={() => add('products-sale')}>＋ Flash Sale</button><button onClick={() => add('products-latest')}>＋ Latest Launch</button></div></div>
    {message && <div className="managed-product-message" role="status">{message}</div>}
    <div className="managed-product-editor">
      <label>Rail<select value={draft.type} onChange={(e) => { const type=e.target.value as CollectionType; setDraft((d) => ({ ...d, ...defaults[type], type, key:`home.products.${type === 'products-sale' ? 'sale' : 'latest'}` })); }}><option value="products-sale">Flash Sale</option><option value="products-latest">Latest Launch</option></select></label>
      <label>Title<input value={draft.title || ''} onChange={(e) => setDraft((d) => ({ ...d, title:e.target.value }))} /></label>
      <label>Subtitle<input value={draft.subtitle || ''} onChange={(e) => setDraft((d) => ({ ...d, subtitle:e.target.value }))} /></label>
      <label>CTA label<input value={draft.ctaLabel || ''} onChange={(e) => setDraft((d) => ({ ...d, ctaLabel:e.target.value }))} /></label>
      <label>CTA destination<input value={draft.ctaHref || ''} onChange={(e) => setDraft((d) => ({ ...d, ctaHref:e.target.value }))} /></label>
      <label>Order<input type="number" value={draft.sortOrder} onChange={(e) => setDraft((d) => ({ ...d, sortOrder:Number(e.target.value) || 0 }))} /></label>
      <label className="managed-product-check"><input type="checkbox" checked={draft.active} onChange={(e) => setDraft((d) => ({ ...d, active:e.target.checked }))} /> Live on storefront</label>
      <button className="managed-product-save" disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Publish rail'}</button>
    </div>
    <div className="managed-product-list">{sections.map((section) => <article key={section.id}><div><b>{section.active ? 'LIVE' : 'OFF'}</b><span>{section.type === 'products-sale' ? 'Flash Sale' : 'Latest Launch'}</span><strong>{section.title || 'Untitled'}</strong><small>{section.subtitle || 'PRIYASA EDIT'} · 12 products · order {section.sortOrder}</small></div><div><button onClick={() => edit(section)}>Edit</button><button onClick={() => void remove(section)}>Remove</button></div></article>)}{!sections.length && <p>No managed product rails yet. Add Flash Sale and Latest Launch to activate the homepage layout.</p>}</div>
  </section>;
}
