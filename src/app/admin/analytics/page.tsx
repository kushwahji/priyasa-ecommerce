import Link from 'next/link';import {redirect} from 'next/navigation';import {db} from '@/lib/db';import {getSession} from '@/lib/auth';import AdminAnalyticsDashboard from '@/components/AdminAnalyticsDashboard';import '../admin-analytics.css';

export const dynamic='force-dynamic';
const PAID=['CONFIRMED','PROCESSING','SHIPPED','DELIVERED'] as const;

export default async function Analytics(){
 const s=await getSession();if(!s||!['ADMIN','STAFF'].includes(s.role))redirect('/admin/login');
 const now=new Date();const since=new Date(now.getTime()-30*86400000);const [orders,customers,paidOrders,topRows,categoryRows]=await Promise.all([
  db.order.findMany({where:{createdAt:{gte:since}},select:{createdAt:true,total:true,status:true}}),
  db.user.count({where:{role:'CUSTOMER',createdAt:{gte:since}}}),
  db.order.findMany({where:{createdAt:{gte:since},status:{in:[...PAID]}},select:{total:true}}),
  db.orderItem.findMany({where:{order:{createdAt:{gte:since},status:{in:[...PAID]}}},select:{productName:true,unitPrice:true,quantity:true}}),
  db.orderItem.findMany({where:{order:{createdAt:{gte:since},status:{in:[...PAID]}}},select:{unitPrice:true,quantity:true,variant:{select:{product:{select:{category:{select:{name:true}}}}}}}}),
 ]);
 const points=Array.from({length:30},(_,i)=>{const d=new Date(now);d.setHours(0,0,0,0);d.setDate(d.getDate()-(29-i));const next=new Date(d);next.setDate(next.getDate()+1);const day=orders.filter(o=>o.createdAt>=d&&o.createdAt<next);return {label:d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}),revenue:day.filter(o=>PAID.includes(o.status as any)).reduce((s,o)=>s+o.total,0),orders:day.length};});
 const revenue=paidOrders.reduce((s,o)=>s+o.total,0);const paidCount=paidOrders.length;const cancelled=orders.filter(o=>o.status==='CANCELLED').length;const refunded=orders.filter(o=>o.status==='REFUNDED').length;
 const productMap=new Map<string,{units:number;revenue:number}>();for(const x of topRows){const v=productMap.get(x.productName)||{units:0,revenue:0};v.units+=x.quantity;v.revenue+=x.unitPrice*x.quantity;productMap.set(x.productName,v)}
 const topProducts=[...productMap.entries()].map(([name,v])=>({name,...v})).sort((a,b)=>b.units-a.units).slice(0,10);
 const catMap=new Map<string,{units:number;revenue:number}>();for(const x of categoryRows){const name=x.variant.product.category.name;const v=catMap.get(name)||{units:0,revenue:0};v.units+=x.quantity;v.revenue+=x.unitPrice*x.quantity;catMap.set(name,v)}
 const categories=[...catMap.entries()].map(([name,v])=>({name,...v})).sort((a,b)=>b.revenue-a.revenue).slice(0,10);
 return <div className="admin-shell"><aside className="admin-nav"><h2>PRIYASA Admin</h2><Link href="/admin">← Dashboard</Link><Link href="/admin/orders">Orders</Link><Link className="active" href="/admin/analytics">Analytics</Link><Link href="/admin/marketing">Marketing</Link><Link href="/admin/automations">Automations</Link></aside><section className="admin-main"><AdminAnalyticsDashboard points={points} metrics={{revenue,orders:orders.length,customers,aov:paidCount?Math.round(revenue/paidCount):0,cancelled,refunded}} topProducts={topProducts} categories={categories}/></section></div>;
}
