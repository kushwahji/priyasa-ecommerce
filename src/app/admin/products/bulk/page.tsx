'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Row = { id: string; sku: string; size: string; color: string; price: number | null; stock: number; reserved: number; product: { id: string; name: string; category?: { name: string } | null } };

export default function BulkVariants() {
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [priceMode, setPriceMode] = useState('keep');
  const [priceValue, setPriceValue] = useState('');
  const [stockMode, setStockMode] = useState('keep');
  const [stockValue, setStockValue] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const response = await fetch('/api/admin/products', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to load variants');
      setRows((data.data || []).flatMap((product: any) => (product.variants || []).map((variant: any) => ({ ...variant, product: { id: product.id, name: product.name, category: product.category } }))));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load variants');
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();
    if (!search) return rows;
    return rows.filter((row) => [row.sku, row.size, row.color, row.product.name, row.product.category?.name || ''].join(' ').toLowerCase().includes(search));
  }, [rows, q]);

  const allVisible = filtered.length > 0 && filtered.every((row) => selected.includes(row.id));

  async function apply() {
    if (!selected.length) return setMessage('Select at least one variant.');
    if (priceMode !== 'keep' && (priceValue === '' || Number(priceValue) < 0)) return setMessage('Enter a valid price value.');
    if (stockMode !== 'keep' && (stockValue === '' || Number(stockValue) < 0)) return setMessage('Enter a valid stock value.');
    setBusy(true); setMessage('Updating variants…');
    try {
      const response = await fetch('/api/admin/variants/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ variantIds: selected, priceMode, priceValue: priceMode === 'keep' ? undefined : Number(priceValue), stockMode, stockValue: stockMode === 'keep' ? undefined : Number(stockValue) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Bulk update failed');
      setMessage(`${data.updated || 0} variants updated successfully.`); setSelected([]); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Bulk update failed'); }
    finally { setBusy(false); }
  }

  return <div className="admin-shell"><aside className="admin-nav"><h2>PRIYASA Admin</h2><Link href="/admin">← Dashboard</Link><Link href="/admin/products">Products</Link><Link href="/admin/products/bulk">Bulk variants</Link><Link href="/admin/inventory">Inventory</Link><Link href="/admin/categories">Categories</Link></aside><section className="admin-main"><div className="section-head"><div><span className="eyebrow dark">CATALOG OPERATIONS</span><h1>Bulk Variant Updates</h1><p className="muted">Update selected SKU prices and stock without reducing stock below reserved units.</p></div><Link className="button" href="/admin/products">Back to products</Link></div>{message&&<div className="checkout-status" role="status">{message}</div>}<div className="admin-card bulk-toolbar"><div className="admin-form-grid"><label>Search SKU / product / size / color<input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="e.g. XL, pink, SKU…"/></label><label>Selected<strong style={{display:'block',fontSize:24,marginTop:7}}>{selected.length}</strong></label><label>Price action<select className="input" value={priceMode} onChange={e=>setPriceMode(e.target.value)}><option value="keep">No price change</option><option value="set">Set exact price</option><option value="increase-percent">Increase by %</option><option value="decrease-percent">Decrease by %</option></select></label><label>Price value<input className="input" type="number" min="0" value={priceValue} onChange={e=>setPriceValue(e.target.value)} placeholder="₹ / %" disabled={priceMode==='keep'}/></label><label>Stock action<select className="input" value={stockMode} onChange={e=>setStockMode(e.target.value)}><option value="keep">No stock change</option><option value="set">Set exact stock</option><option value="increase">Add stock</option><option value="decrease">Reduce stock</option></select></label><label>Stock value<input className="input" type="number" min="0" value={stockValue} onChange={e=>setStockValue(e.target.value)} placeholder="Units" disabled={stockMode==='keep'}/></label></div><div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button className="button dark-button" disabled={busy||!selected.length} onClick={()=>void apply()}>{busy?'Updating…':'Apply to selected'}</button><button className="button" disabled={busy} onClick={()=>setSelected([])}>Clear selection</button></div></div><div className="admin-card" style={{marginTop:18}}><div className="table-wrap"><table className="table"><thead><tr><th><input type="checkbox" checked={allVisible} onChange={()=>setSelected(allVisible?selected.filter(id=>!filtered.some(r=>r.id===id)):[...new Set([...selected,...filtered.map(r=>r.id)])]}/></th><th>Product</th><th>SKU</th><th>Attributes</th><th>Price</th><th>Stock</th><th>Reserved</th><th>Available</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td><input type="checkbox" checked={selected.includes(r.id)} onChange={()=>setSelected(x=>x.includes(r.id)?x.filter(v=>v!==r.id):[...x,r.id])}/></td><td><strong>{r.product.name}</strong><br/><small>{r.product.category?.name||'Uncategorised'}</small></td><td>{r.sku}</td><td>{r.size} · {r.color}</td><td>₹{(r.price??0).toLocaleString('en-IN')}</td><td>{r.stock}</td><td>{r.reserved}</td><td><strong>{Math.max(0,r.stock-r.reserved)}</strong></td></tr>)}</tbody></table>{!filtered.length&&<div className="empty">No variants match the filter.</div>}</div></div></section></div>;
}
