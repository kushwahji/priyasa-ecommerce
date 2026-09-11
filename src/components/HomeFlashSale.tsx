'use client';
import { useEffect, useState } from 'react';
import type { Product } from '@/lib/catalog';
import HomeProductRail from '@/components/HomeProductRail';

function remaining(endAt?: string) {
  if (!endAt) return '';
  const ms = Math.max(0, new Date(endAt).getTime() - Date.now());
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2,'0')} : ${String(m).padStart(2,'0')} : ${String(s).padStart(2,'0')}`;
}

export default function HomeFlashSale({ products, endAt, title = 'Flash Sale', subtitle = 'Limited-time prices on selected styles' }: { products: Product[]; endAt?: string; title?: string; subtitle?: string }) {
  const [clock, setClock] = useState(() => remaining(endAt));
  useEffect(() => { if (!endAt) return; const id = window.setInterval(() => setClock(remaining(endAt)), 1000); return () => window.clearInterval(id); }, [endAt]);
  if (!products.length) return null;
  return <section className="home-flash-sale home-section"><div className="home-section-head"><div><span className="home-kicker">{subtitle}</span><h2>{title}</h2></div>{clock && <strong className="home-flash-clock">Ends in {clock}</strong>}</div><HomeProductRail products={products}/></section>;
}
