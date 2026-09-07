'use client';

import { useMemo, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/lib/catalog';

const categories = ['All','Lingerie','Nightwear','Ethnic Wear','Activewear','Loungewear','Accessories'];
const sizes = ['XS','S','M','L','XL','XXL','Free Size'];
const prices = [['Under ₹999',0,999],['₹999 – ₹1,999',999,1999],['₹2,000 – ₹2,999',2000,2999],['₹3,000+',3000,Infinity]] as const;

export function ShopFilters({ products }: { products: Product[] }) {
  const [category, setCategory] = useState('All');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [sort, setSort] = useState('featured');
  const [mobileFilters, setMobileFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = products.filter(p => category === 'All' || p.category === category);
    if (size) list = list.filter(p => p.sizes.includes(size));
    if (price) {
      const range = prices.find(x => x[0] === price);
      if (range) list = list.filter(p => p.price >= range[1] && p.price <= range[2]);
    }
    return [...list].sort((a,b) => sort === 'price-low' ? a.price-b.price : sort === 'price-high' ? b.price-a.price : sort === 'discount' ? ((b.mrp-b.price)/b.mrp)-((a.mrp-a.price)/a.mrp) : 0);
  }, [products, category, size, price, sort]);

  const controls = <div className="filter-controls">
    <div><span>Category</span>{categories.map(x => <button key={x} className={category===x?'active':''} onClick={() => setCategory(x)}>{x}</button>)}</div>
    <div><span>Size</span>{sizes.map(x => <button key={x} className={size===x?'active':''} onClick={() => setSize(size===x?'':x)}>{x}</button>)}</div>
    <div><span>Price</span>{prices.map(x => <button key={x[0]} className={price===x[0]?'active':''} onClick={() => setPrice(price===x[0]?'':x[0])}>{x[0]}</button>)}</div>
    <button className="filter-clear" onClick={() => {setCategory('All');setSize('');setPrice('')}}>Clear all</button>
  </div>;

  return <>
    <div className="shop-toolbar">
      <button className="mobile-filter-trigger" onClick={() => setMobileFilters(true)}>☷ Filters</button>
      <span>{filtered.length} styles</span>
      <label>Sort by <select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="discount">Best Discount</option></select></label>
    </div>
    <aside className="desktop-filter-panel">{controls}</aside>
    {mobileFilters && <div className="filter-sheet-backdrop" onClick={() => setMobileFilters(false)}><div className="filter-sheet" onClick={e=>e.stopPropagation()}><div className="filter-sheet-head"><strong>Filters</strong><button onClick={()=>setMobileFilters(false)}>×</button></div>{controls}<button className="button dark-button filter-apply" onClick={()=>setMobileFilters(false)}>View {filtered.length} styles</button></div></div>}
    <div className="product-grid shop">{filtered.map(p=><ProductCard key={p.id} product={p}/>)}</div>
    {!filtered.length && <div className="empty-shop"><h3>No styles found</h3><p>Try removing a filter to see more Priyasa styles.</p></div>}
  </>;
}
