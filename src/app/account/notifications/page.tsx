'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BellIcon, CheckIcon } from '@/components/StorefrontIcons';

export default function Notifications() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function load() { try { const r = await fetch('/api/customer/notifications', { cache: 'no-store' }); const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Unable to load notifications'); setItems(d.data || []); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load notifications'); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  async function mark(id?: string) { await fetch('/api/customer/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(id ? { id } : {}) }); setItems((current) => id ? current.map((x) => x.id === id ? { ...x, readAt: new Date().toISOString() } : x) : current.map((x) => ({ ...x, readAt: new Date().toISOString() }))); }
  if (loading) return <div className="account-shell"><div className="account-orders-loading">Loading notifications…</div></div>;
  if (error) return <div className="account-shell"><div className="account-card order-empty"><h2>{error}</h2><Link className="button" href="/login">Sign in</Link></div></div>;
  const unread = items.filter((x) => !x.readAt).length;
  return <div className="account-shell"><div className="breadcrumbs"><Link href="/account">My Account</Link><span> / </span> Notifications</div><div className="account-main-head"><div><span className="eyebrow">MY PRIYASA</span><h1>Notifications</h1><p className="account-lead">Order updates and important account messages in one place.</p></div>{unread > 0 && <button className="button button-light" onClick={() => mark()}>Mark all read</button>}</div>{!items.length ? <div className="account-card notification-empty"><BellIcon width={34} height={34}/><h2>You’re all caught up</h2><p>New order and account updates will appear here.</p></div> : <div className="notification-list">{items.map((item) => <article className={`account-card notification-card ${item.readAt ? 'read' : 'unread'}`} key={item.id}><div className="notification-icon"><BellIcon width={20} height={20}/></div><div className="notification-copy"><div><strong>{item.title}</strong>{!item.readAt && <span className="notification-dot" aria-label="Unread"/>}</div><p>{item.body}</p><small>{new Date(item.createdAt).toLocaleString('en-IN')}</small>{item.data?.orderId && <Link className="text-link" href={`/account/orders/${item.data.orderId}`}>View order →</Link>}</div>{!item.readAt && <button className="notification-read" onClick={() => mark(item.id)} aria-label="Mark notification as read"><CheckIcon width={18} height={18}/></button>}</article>)}</div>}</div>;
}
