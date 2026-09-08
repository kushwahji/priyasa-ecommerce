'use client';
import {useMemo,useState} from 'react';
import {money} from '@/lib/catalog';

type Point={label:string;revenue:number;orders:number};
type Props={points:Point[];metrics:{revenue:number;orders:number;customers:number;aov:number;cancelled:number;refunded:number};topProducts:{name:string;units:number;revenue:number}[];categories:{name:string;units:number;revenue:number}[]};

export default function AdminAnalyticsDashboard({points,metrics,topProducts,categories}:Props){
 const [range,setRange]=useState('30');
 const max=Math.max(...points.map(p=>p.revenue),1);
 const visible=useMemo(()=>range==='7'?points.slice(-7):range==='14'?points.slice(-14):points,[points,range]);
 const visibleMax=Math.max(...visible.map(p=>p.revenue),1);
 const totalUnits=topProducts.reduce((s,p)=>s+p.units,0)||1;
 return <>
  <div className="analytics-toolbar"><div><span className="eyebrow dark">STORE INTELLIGENCE</span><h1>Analytics & Reports</h1><p>Live commerce performance from orders, customers and catalogue data.</p></div><select value={range} onChange={e=>setRange(e.target.value)} aria-label="Analytics range"><option value="7">Last 7 days</option><option value="14">Last 14 days</option><option value="30">Last 30 days</option></select></div>
  <div className="analytics-kpis">
   <div className="analytics-kpi"><span>Net revenue</span><strong>{money(metrics.revenue)}</strong><small>Captured / fulfilled orders</small></div>
   <div className="analytics-kpi"><span>Orders</span><strong>{metrics.orders.toLocaleString('en-IN')}</strong><small>Created in selected period</small></div>
   <div className="analytics-kpi"><span>Average order value</span><strong>{money(metrics.aov)}</strong><small>Revenue ÷ paid orders</small></div>
   <div className="analytics-kpi"><span>New customers</span><strong>{metrics.customers.toLocaleString('en-IN')}</strong><small>Customer registrations</small></div>
   <div className="analytics-kpi warning"><span>Cancelled</span><strong>{metrics.cancelled.toLocaleString('en-IN')}</strong><small>Orders cancelled</small></div>
   <div className="analytics-kpi warning"><span>Refunded</span><strong>{metrics.refunded.toLocaleString('en-IN')}</strong><small>Orders refunded</small></div>
  </div>
  <div className="analytics-grid">
   <section className="analytics-card analytics-chart-card"><header><div><h2>Revenue trend</h2><small>Daily captured revenue</small></div><strong>{money(visible.reduce((s,p)=>s+p.revenue,0))}</strong></header><div className="analytics-bars" role="img" aria-label="Revenue trend chart">{visible.map(p=><div className="analytics-bar-col" key={p.label} title={`${p.label}: ${money(p.revenue)}`}><div className="analytics-bar" style={{height:`${Math.max(3,(p.revenue/visibleMax)*100)}%`}}/><small>{p.label}</small></div>)}</div></section>
   <section className="analytics-card"><header><div><h2>Sales mix</h2><small>Top products by units</small></div></header><div className="analytics-list">{topProducts.map((p,i)=><div className="analytics-row" key={p.name}><div className="analytics-rank">{i+1}</div><div className="analytics-row-main"><strong>{p.name}</strong><div className="analytics-progress"><i style={{width:`${Math.max(4,(p.units/totalUnits)*100)}%`}}/></div><small>{p.units} units · {money(p.revenue)}</small></div></div>)}{!topProducts.length&&<p className="analytics-empty">No paid product sales yet.</p>}</div></section>
  </div>
  <div className="analytics-grid analytics-grid-bottom">
   <section className="analytics-card"><header><div><h2>Category performance</h2><small>Revenue and units sold</small></div></header><div className="analytics-table-wrap"><table className="analytics-table"><thead><tr><th>Category</th><th>Units</th><th>Revenue</th></tr></thead><tbody>{categories.map(c=><tr key={c.name}><td><strong>{c.name}</strong></td><td>{c.units}</td><td>{money(c.revenue)}</td></tr>)}{!categories.length&&<tr><td colSpan={3}>No category sales yet.</td></tr>}</tbody></table></div></section>
   <section className="analytics-card"><header><div><h2>Operational signals</h2><small>Use these to prioritize action</small></div></header><div className="analytics-signal"><span>Cancellation rate</span><strong>{metrics.orders?((metrics.cancelled/metrics.orders)*100).toFixed(1):'0.0'}%</strong></div><div className="analytics-signal"><span>Refund rate</span><strong>{metrics.orders?((metrics.refunded/metrics.orders)*100).toFixed(1):'0.0'}%</strong></div><div className="analytics-signal"><span>Revenue per order</span><strong>{money(metrics.aov)}</strong></div><div className="analytics-signal"><span>Highest daily revenue</span><strong>{money(max)}</strong></div></section>
  </div>
 </>;
}
