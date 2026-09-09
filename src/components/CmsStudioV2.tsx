'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Section = { id?: string; key: string; type: string; title?: string | null; subtitle?: string | null; imageUrl?: string | null; mobileImageUrl?: string | null; ctaLabel?: string | null; ctaHref?: string | null; startsAt?: string | null; endsAt?: string | null; active: boolean; sortOrder: number };
type Target = { id: string; name: string; slug: string };
type Media = { name: string; url: string };

type Slide = { key: string; title: string; subtitle: string; imageUrl: string; mobileImageUrl: string; ctaLabel: string; ctaHref: string; active: boolean; sortOrder: number };

const blankSlide = (i: number): Slide => ({ key: `home.carousel.${Date.now()}.${i}`, title: '', subtitle: 'PRIYASA EDIT', imageUrl: '', mobileImageUrl: '', ctaLabel: 'Shop now', ctaHref: '/shop', active: true, sortOrder: i });

function modeForSection(type: string): 'banner' | 'carousel' | 'section' {
  if (['image-carousel', 'image-slide', 'carousel'].includes(type)) return 'carousel';
  if (['feature', 'casual-grid', 'festival-grid', 'category-grid', 'text'].includes(type)) return 'section';
  return 'banner';
}

export default function CmsStudioV2() {
  const [sections, setSections] = useState<Section[]>([]);
  const [categories, setCategories] = useState<Target[]>([]);
  const [products, setProducts] = useState<Target[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [mode, setMode] = useState<'banner' | 'carousel' | 'section'>('banner');
  const [slides, setSlides] = useState<Slide[]>([blankSlide(0)]);
  const [editing, setEditing] = useState<Section | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<number | null>(0);

  async function load() {
    const [s, c, p, m] = await Promise.all([
      fetch('/api/admin/cms', { cache: 'no-store' }),
      fetch('/api/admin/categories', { cache: 'no-store' }),
      fetch('/api/admin/products', { cache: 'no-store' }),
      fetch('/api/admin/cms/media', { cache: 'no-store' }),
    ]);
    const [sd, cd, pd, md] = await Promise.all([s.json(), c.json(), p.json(), m.json()]);
    if (s.ok) setSections(sd.data || []);
    if (c.ok) setCategories((cd.data || []).map((x: any) => ({ id: x.id, name: x.name, slug: x.slug })));
    if (p.ok) setProducts((pd.data || []).map((x: any) => ({ id: x.id, name: x.name, slug: x.slug })));
    if (m.ok) setMedia((md.data || []).map((x: any) => ({ name: x.name, url: x.url })));
  }

  useEffect(() => { void load(); }, []);

  function startBanner(section?: Section) {
    const nextMode = section ? modeForSection(section.type) : 'banner';
    setMode(nextMode);
    if (section) setSlides([{ key: section.key, title: section.title || '', subtitle: section.subtitle || 'PRIYASA EDIT', imageUrl: section.imageUrl || '', mobileImageUrl: section.mobileImageUrl || '', ctaLabel: section.ctaLabel || 'Shop now', ctaHref: section.ctaHref || '/shop', active: section.active, sortOrder: section.sortOrder }]);
    else setSlides([blankSlide(0)]);
    setEditing(section || null);
    setUploadTarget(0);
  }

  function startCarousel() { setMode('carousel'); setEditing(null); setUploadTarget(null); setSlides([blankSlide(0), blankSlide(1), blankSlide(2)]); }
  function startSection() { setMode('section'); setEditing(null); setUploadTarget(0); setSlides([blankSlide(0)]); }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setMessage(`Uploading ${files.length} image${files.length > 1 ? 's' : ''}…`);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData(); fd.append('file', file);
        const response = await fetch('/api/admin/cms/media', { method: 'POST', body: fd });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Unable to upload ${file.name}`);
        uploaded.push(String(data.data.url));
      }
      setSlides((current) => {
        const next = [...current];
        uploaded.forEach((url, offset) => {
          const index = uploadTarget === null ? Math.min(next.length, offset) : Math.min((uploadTarget || 0) + offset, next.length - 1);
          if (offset === 0 && uploadTarget === null) next.push({ ...blankSlide(next.length), imageUrl: url });
          else if (next[index]) next[index] = { ...next[index], imageUrl: url };
          else next.push({ ...blankSlide(next.length), imageUrl: url });
        });
        return next;
      });
      await load();
      setMessage(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded.`);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Upload failed'); }
    finally { setBusy(false); }
  }

  async function save() {
    setBusy(true); setMessage('Saving storefront changes…');
    try {
      const payloads = mode === 'carousel' ? slides : [slides[0]];
      for (const slide of payloads) {
        if (!slide.imageUrl) throw new Error('Every banner/carousel slide needs an image URL or upload.');
        const body = { ...slide, type: mode === 'carousel' ? 'image-carousel' : mode === 'banner' ? 'hero-slide' : 'feature', sortOrder: slide.sortOrder, startsAt: undefined, endsAt: undefined };
        const response = await fetch('/api/admin/cms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to save storefront content');
        if (mode !== 'carousel' && editing?.id) break;
      }
      setMessage(mode === 'carousel' ? `${payloads.length} carousel slides published.` : 'Storefront content saved successfully.');
      await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to save'); }
    finally { setBusy(false); }
  }

  async function remove(section: Section) {
    if (!section.id || !confirm(`Delete ${section.title || section.key}?`)) return;
    const response = await fetch(`/api/admin/cms?id=${encodeURIComponent(section.id)}`, { method: 'DELETE' });
    setMessage(response.ok ? 'Content deleted.' : 'Unable to delete content.');
    if (response.ok) await load();
  }

  function updateSlide(index: number, patch: Partial<Slide>) { setSlides((current) => current.map((slide, i) => i === index ? { ...slide, ...patch } : slide)); }
  function destinationOptions() { return <><option value="/shop">Shop all</option><option value="/sale">Sale</option>{categories.map((x) => <option key={`c-${x.id}`} value={`/category/${x.slug}`}>Category · {x.name}</option>)}{products.slice(0, 200).map((x) => <option key={`p-${x.id}`} value={`/product/${x.slug}`}>Product · {x.name}</option>)}</>; }

  const liveBanners = sections.filter((x) => ['hero', 'hero-slide', 'banner'].includes(x.type));
  const carousels = sections.filter((x) => ['image-carousel', 'image-slide', 'carousel'].includes(x.type));
  const featureSections = sections.filter((x) => ['feature', 'casual-grid', 'festival-grid', 'category-grid', 'text'].includes(x.type));

  return <div className="cmsV2">
    <header className="cmsV2Top"><div><span>PRIYASA COMMERCE OS · MERCHANDISING</span><h1>Homepage Studio</h1><p>Build the storefront visually. Upload creatives or paste image URLs, choose category/product destinations, reorder content and publish.</p></div><div><Link href="/admin" className="cmsV2Light">Dashboard</Link><Link href="/" className="cmsV2Light">View store ↗</Link></div></header>

    {message && <div className="cmsV2Notice">{message}</div>}

    <section className="cmsV2Stats"><div><small>Live banners</small><strong>{liveBanners.length}</strong></div><div><small>Carousel slides</small><strong>{carousels.length}</strong></div><div><small>Feature sections</small><strong>{featureSections.length}</strong></div><div><small>Media library</small><strong>{media.length}</strong></div></section>

    <section className="cmsV2Builder"><div className="cmsV2BuilderNav"><button className={mode === 'banner' ? 'active' : ''} onClick={() => startBanner()}>＋ Banner</button><button className={mode === 'carousel' ? 'active' : ''} onClick={startCarousel}>▧ Image carousel</button><button className={mode === 'section' ? 'active' : ''} onClick={startSection}>✦ Feature section</button></div>
      <div className="cmsV2Editor"><div className="cmsV2EditorHead"><div><span>{mode === 'banner' ? 'BANNER BUILDER' : mode === 'carousel' ? 'CAROUSEL BUILDER' : 'SECTION BUILDER'}</span><h2>{mode === 'banner' ? 'Create or update a hero banner' : mode === 'carousel' ? 'Build a multi-image carousel' : 'Add a homepage feature block'}</h2></div><button className="cmsV2Primary" disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Publish changes'}</button></div>
        {mode === 'carousel' && <div className="cmsV2UploadBar"><div><strong>Multiple image upload</strong><small>Select several images at once. Each image becomes a carousel slide.</small></div><button className="cmsV2Light" disabled={busy} onClick={() => { setUploadTarget(null); fileRef.current?.click(); }}>＋ Upload multiple</button></div>}
        <input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" multiple={mode === 'carousel'} onChange={(e) => { void uploadFiles(e.target.files); e.currentTarget.value = ''; }} />
        <div className="cmsV2Slides">{slides.map((slide, index) => <article className="cmsV2Slide" key={slide.key}><div className="cmsV2SlideNumber">{index + 1}</div><div className="cmsV2Preview" style={{ backgroundImage: `linear-gradient(90deg,rgba(20,15,18,.62),rgba(20,15,18,.05)),url(${slide.imageUrl || '/images/product-placeholder.svg'})` }}><div><small>{slide.subtitle || 'PRIYASA EDIT'}</small><strong>{slide.title || 'Your headline'}</strong><span>{slide.ctaLabel || 'Shop now'} →</span></div></div><div className="cmsV2Fields"><label>Image URL<input value={slide.imageUrl} onChange={(e) => updateSlide(index, { imageUrl: e.target.value })} placeholder="https://…" /></label><label>Upload<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setUploadTarget(index); void uploadFiles(e.target.files); } e.currentTarget.value = ''; }} /></label><label>Headline<input value={slide.title} onChange={(e) => updateSlide(index, { title: e.target.value })} placeholder="New season" /></label><label>Subtitle<input value={slide.subtitle} onChange={(e) => updateSlide(index, { subtitle: e.target.value })} placeholder="PRIYASA EDIT" /></label><label>CTA label<input value={slide.ctaLabel} onChange={(e) => updateSlide(index, { ctaLabel: e.target.value })} /></label><label>Redirect to<select value={slide.ctaHref} onChange={(e) => updateSlide(index, { ctaHref: e.target.value })}>{destinationOptions()}</select></label><label>Mobile image URL<input value={slide.mobileImageUrl} onChange={(e) => updateSlide(index, { mobileImageUrl: e.target.value })} placeholder="Optional mobile creative" /></label><label className="cmsV2Check"><input type="checkbox" checked={slide.active} onChange={(e) => updateSlide(index, { active: e.target.checked })} /> Publish this slide</label></div><div className="cmsV2SlideActions">{mode === 'carousel' && <button onClick={() => setSlides((current) => current.filter((_, i) => i !== index))}>Remove slide</button>}<button onClick={() => { setUploadTarget(index); fileRef.current?.click(); }}>Replace image</button></div></article>)}</div>{mode === 'carousel' && <button className="cmsV2AddSlide" onClick={() => setSlides((current) => [...current, blankSlide(current.length)])}>＋ Add another slide</button>}
      </div>
    </section>

    <section className="cmsV2Existing"><div className="cmsV2SectionHead"><div><span>LIVE CONTENT</span><h2>Manage existing storefront content</h2></div><button className="cmsV2Light" onClick={() => void load()}>↻ Refresh</button></div><div className="cmsV2ExistingGrid">{sections.map((section) => <article key={section.id}><div className="cmsV2ExistingImage" style={{ backgroundImage: `url(${section.imageUrl || '/images/product-placeholder.svg'})` }}><b>{section.active ? 'LIVE' : 'OFF'}</b></div><div className="cmsV2ExistingBody"><small>{section.type}</small><strong>{section.title || 'Untitled content'}</strong><span>{section.ctaHref || '/shop'}</span><div><button onClick={() => startBanner(section)}>Edit</button><button onClick={() => void remove(section)}>Delete</button></div></div></article>)}{!sections.length && <div className="cmsV2Empty">No homepage content yet. Create your first banner above.</div>}</div></section>
  </div>;
}
