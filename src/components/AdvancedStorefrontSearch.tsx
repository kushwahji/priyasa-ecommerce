'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@/lib/catalog';
import { ProductCard } from '@/components/ProductCard';
import { BagIcon, SearchIcon } from '@/components/StorefrontIcons';
import { mapProduct, searchStorefront } from '@/lib/storefront-data';

const TRENDING = ['Kurtis', 'Anarkali', 'Kurta Set', 'Cotton Kurti', 'Festive Wear'];
const KEY = 'priyasa_recent_searches';
type F = { category: string; brand: string; size: string; color: string; min: string; max: string; sort: string; in_stock: string; sale_only: string };
const initial: F = { category: '', brand: '', size: '', color: '', min: '', max: '', sort: 'relevance', in_stock: '', sale_only: '' };

type SuggestionState = { products: any[]; brands: any[]; categories: any[] };
const emptySuggestions: SuggestionState = { products: [], brands: [], categories: [] };

export default function AdvancedStorefrontSearch({ initialQuery = '', initialCategory = '' }: { initialQuery?: string; initialCategory?: string }) {
  const [q, setQ] = useState(initialQuery);
  const [items, setItems] = useState<Product[]>([]);
  const [facets, setFacets] = useState<any>({});
  const [meta, setMeta] = useState<any>({});
  const [f, setF] = useState<F>({ ...initial, category: initialCategory });
  const [recent, setRecent] = useState<string[]>([]);
  const [focus, setFocus] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<SuggestionState>(emptySuggestions);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setRecent(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string').slice(0, 6) : []);
    } catch { setRecent([]); }
  }, []);

  const save = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    setRecent((current) => {
      const next = [normalized, ...current.filter((x) => x.toLowerCase() !== normalized.toLowerCase())].slice(0, 6);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage can be unavailable */ }
      return next;
    });
  };

  useEffect(() => {
    let dead = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = { q: q.trim(), per_page: '24' };
        Object.entries(f).forEach(([key, value]) => {
          if (value && key !== 'min' && key !== 'max') params[key] = value;
        });
        if (f.min) params.min_price = f.min;
        if (f.max) params.max_price = f.max;
        const result = await searchStorefront(params);
        if (!dead) {
          setItems(result.items.map(mapProduct));
          setFacets(result.facets || {});
          setMeta(result.meta || {});
        }
      } catch {
        if (!dead) { setItems([]); setFacets({}); setMeta({}); }
      } finally {
        if (!dead) setLoading(false);
      }
    }, 180);
    return () => { dead = true; clearTimeout(timer); };
  }, [q, f]);

  useEffect(() => {
    let dead = false;
    const timer = setTimeout(async () => {
      const value = q.trim();
      if (value.length < 2) { setSuggestions(emptySuggestions); return; }
      try {
        const response = await fetch(`/api/storefront/search-suggestions?q=${encodeURIComponent(value)}`, { cache: 'no-store' });
        const body = await response.json();
        if (!dead && response.ok) setSuggestions(body.data || emptySuggestions);
      } catch {
        if (!dead) setSuggestions(emptySuggestions);
      }
    }, 220);
    return () => { dead = true; clearTimeout(timer); };
  }, [q]);

  const options = useMemo(() => ({
    categories: facets.categories || [],
    brands: facets.brands || [],
    sizes: facets.sizes || [],
    colors: facets.colors || [],
  }), [facets]);
  const count = Object.entries(f).filter(([key, value]) => key !== 'sort' && Boolean(value)).length;
  const choose = (value: string) => { setQ(value); save(value); setFocus(false); };
  const set = (key: keyof F, value: string) => setF((current) => ({ ...current, [key]: value }));
  const facetSelect = (key: keyof F, label: string, values: any[]) => (
    <div><b>{label}</b><select value={f[key]} onChange={(e) => set(key, e.target.value)}>
      <option value="">All {label.toLowerCase()}</option>
      {values.map((x: any) => <option key={x.value} value={x.value}>{x.label}{x.count !== undefined ? ` (${x.count})` : ''}</option>)}
    </select></div>
  );

  const buildNextParams = (page: number) => {
    const params: Record<string, string> = { q: q.trim(), per_page: '24', page: String(page) };
    Object.entries(f).forEach(([key, value]) => { if (value && key !== 'min' && key !== 'max') params[key] = value; });
    if (f.min) params.min_price = f.min;
    if (f.max) params.max_price = f.max;
    return params;
  };

  return <div className="search-experience">
    <div className="search-mobile-head"><Link href="/" className="back" aria-label="Back">‹</Link><button type="button" className="mobile-search-box" onClick={() => document.getElementById('priyasa-search-input')?.focus()}><SearchIcon/><span>{q || 'Search products, styles & categories'}</span></button><Link href="/cart" className="bag-link" aria-label="Bag"><BagIcon/></Link></div>
    <div className="search-hero"><span className="eyebrow dark">FIND YOUR PRIYASA EDIT</span><h1>What are you looking for?</h1>
      <div className="search-input-wrap"><input id="priyasa-search-input" autoFocus value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 180)} placeholder="Search kurtis, dresses, ethnic wear..." aria-label="Search products" autoComplete="off"/><button onMouseDown={(e) => e.preventDefault()} onClick={() => setQ('')} aria-label="Clear search">{q ? '×' : ''}</button>
        {focus && !q && <div className="search-suggestion-panel"><b>Trending searches</b>{TRENDING.map((x) => <button key={x} onMouseDown={() => choose(x)}>⌕ {x}</button>)}{recent.length > 0 && <><b>Recent searches</b>{recent.map((x) => <button key={x} onMouseDown={() => choose(x)}>↻ {x}</button>)}</>}</div>}
        {focus && q && (suggestions.products.length + suggestions.brands.length + suggestions.categories.length > 0) && <div className="search-suggestion-panel live"><b>Suggestions</b>{suggestions.products.slice(0, 5).map((p: any) => <Link key={`p${p.id}`} href={`/product/${p.slug}`} onMouseDown={() => save(q)}><span>{p.name}<small>{p.brand || p.category?.name || 'Product'}</small></span></Link>)}{suggestions.brands.slice(0, 3).map((b: any) => <button key={`b${b.value}`} onMouseDown={() => { set('brand', b.value); setFocus(false); }}>Brand · {b.label}</button>)}{suggestions.categories.slice(0, 3).map((c: any) => <button key={`c${c.value}`} onMouseDown={() => { set('category', c.slug || c.value || ''); setFocus(false); }}>Category · {c.label}</button>)}</div>}
      </div>
      <div className="search-chips"><span>Try</span>{TRENDING.map((x) => <button key={x} onClick={() => choose(x)}>{x}</button>)}</div>
    </div>
    <div className="search-toolbar"><strong>{loading ? 'Finding…' : `${Number(meta.total ?? items.length).toLocaleString('en-IN')} styles`}{q && <span> for “{q}”</span>}</strong><div className="search-toolbar-actions"><button className="filter-toggle" onClick={() => setOpen((x) => !x)}>Filters {count > 0 && <b>{count}</b>}</button><label className="sort-control">Sort <select value={f.sort} onChange={(e) => set('sort', e.target.value)}><option value="relevance">Relevance</option><option value="newest">Newest</option><option value="price_asc">Price: Low to High</option><option value="price_desc">Price: High to Low</option><option value="discount">Discount</option><option value="rating">Rating</option><option value="popular">Popular</option></select></label></div></div>
    {open && <section className="search-filter-panel">{facetSelect('category', 'Category', options.categories)}{facetSelect('brand', 'Brand', options.brands)}{facetSelect('size', 'Size', options.sizes)}{facetSelect('color', 'Color', options.colors)}
      <div><b>Availability</b><label><input type="checkbox" checked={f.in_stock === '1'} onChange={(e) => set('in_stock', e.target.checked ? '1' : '')}/> In stock</label><label><input type="checkbox" checked={f.sale_only === '1'} onChange={(e) => set('sale_only', e.target.checked ? '1' : '')}/> On sale</label></div>
      <div><b>Price range</b><div className="price-inputs"><input inputMode="numeric" placeholder="Min ₹" value={f.min} onChange={(e) => set('min', e.target.value.replace(/\D/g, ''))}/><input inputMode="numeric" placeholder="Max ₹" value={f.max} onChange={(e) => set('max', e.target.value.replace(/\D/g, ''))}/></div>{facets.price && <small>Available: ₹{Number(facets.price.min || 0).toLocaleString('en-IN')} – ₹{Number(facets.price.max || 0).toLocaleString('en-IN')}</small>}</div>
      <div className="filter-actions"><button className="clear-filter" onClick={() => setF({ ...initial, category: initialCategory })}>Clear all</button><button className="button" onClick={() => setOpen(false)}>Done</button></div>
    </section>}
    <section className="section search-results-section">{items.length ? <><div className="product-grid product-grid-editorial">{items.map((p) => <ProductCard key={p.id} product={p}/>)}</div>{Number(meta.last_page || 1) > Number(meta.current_page || 1) && <div className="search-load-more"><button className="button" disabled={loading} onClick={async () => { setLoading(true); try { const result = await searchStorefront(buildNextParams(Number(meta.current_page || 1) + 1)); setItems((current) => [...current, ...result.items.map(mapProduct)]); setMeta(result.meta || {}); } finally { setLoading(false); } }}>Load more</button></div>}</> : !loading && <div className="search-empty"><h3>No exact match yet.</h3><p>Try a simpler spelling, category, color or size.</p><div className="zero-result-suggestions">{TRENDING.map((x) => <button key={x} onClick={() => choose(x)}>{x}</button>)}</div><button className="button" onClick={() => { setQ(''); setF({ ...initial, category: initialCategory }); }}>Explore latest launches</button></div>}</section>
  </div>;
}
