import Link from 'next/link';
import {redirect} from 'next/navigation';
import {db} from '@/lib/db';
import {getSession} from '@/lib/auth';
import {money} from '@/lib/catalog';
import AdminDemoCleanup from '@/components/AdminDemoCleanup';

const nav=[
  ['Dashboard','/admin','⌂'],['Orders','/admin/orders','▤'],['Manual Order','/admin/orders/new','＋'],['Products','/admin/products','▦'],['Bulk Variants','/admin/products/bulk','◫'],['WooCommerce Sync','/admin/products/woocommerce','↻'],['Import Products','/admin/products/import','⇩'],['Categories','/admin/categories','⌗'],['Inventory','/admin/inventory','▥'],['Customers','/admin/customers','♙'],['Coupons & Offers','/admin/coupons-offers','◇'],['Marketing','/admin/marketing','◉'],['Automations','/admin/automations','⚙'],['Meta Ads','/admin/meta-ads','◎'],['WhatsApp','/admin/whatsapp','◌'],['Analytics','/admin/analytics','▥'],['Returns & Refunds','/admin/returns-refunds','↩'],['Reviews','/admin/reviews','☆'],['SEO','/admin/seo','⌕'],['Homepage Studio','/admin/cms','▣'],['Settings','/admin/settings','⚙'],['Audit Log','/admin/audit-log','≡'],
];

function statusClass(status:string){return `status-pill status-${status.toLowerCase()}`}
function shortDate(date:Date){return date.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
function dayLabel(date:Date){return date.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
function initials(name:string){return name.split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase()}

export default async function Admin(){
  const session=await getSession();
  if(!session||!['ADMIN','STAFF'].includes(session.role))redirect('/admin/login');

  const now=new Date();
  const sevenDaysAgo=new Date(now.getTime()-7*86400000);
  const fourteenDaysAgo=new Date(now.getTime()-14*86400000);
  const paidStatuses=['CONFIRMED','PROCESSING','SHIPPED','DELIVERED'] as const;

  const [orders,customers,products,revenue,pending,lowStock,failedPayments,inTransit,coupons,categories,cmsSections,variants,recentOrders,lowStockProducts,statusCounts,trendOrders]=await Promise.all([
    db.order.count(),
    db.user.count({where:{role:'CUSTOMER'}}),
    db.product.count({where:{active:true}}),
    db.order.aggregate({where:{status:{in:[...paidStatuses]}},_sum:{total:true}}),
    db.order.count({where:{status:{in:['CREATED','PAYMENT_PENDING','CONFIRMED','PROCESSING']}}}),
    db.productVariant.count({where:{stock:{lte:5}}}),
    db.payment.count({where:{status:'FAILED',createdAt:{gte:sevenDaysAgo}}}),
    db.shipment.count({where:{status:{in:['PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY']}}}),
    db.coupon.count({where:{active:true}}),
    db.category.count(),
    db.cmsSection.count({where:{active:true}}),
    db.productVariant.count(),
    db.order.findMany({take:6,orderBy:{createdAt:'desc'},select:{orderNumber:true,total:true,status:true,createdAt:true,user:{select:{name:true,phone:true}}}}),
    db.productVariant.findMany({take:6,where:{stock:{lte:5}},orderBy:{stock:'asc'},select:{id:true,sku:true,stock:true,product:{select:{name:true,images:{take:1,orderBy:{sortOrder:'asc'},select:{url:true}}}}}}),
    Promise.all(['DELIVERED','PROCESSING','SHIPPED','CREATED','CANCELLED'].map(status=>db.order.count({where:{status:status as any}}))),
    db.order.findMany({where:{createdAt:{gte:fourteenDaysAgo}},select:{createdAt:true,total:true,status:true}}),
  ]);

  const currentRevenue=trendOrders.filter(o=>paidStatuses.includes(o.status as any)&&o.createdAt>=sevenDaysAgo).reduce((sum,o)=>sum+o.total,0);
  const previousRevenue=trendOrders.filter(o=>paidStatuses.includes(o.status as any)&&o.createdAt<sevenDaysAgo).reduce((sum,o)=>sum+o.total,0);
  const revenueChange=previousRevenue?Math.round(((currentRevenue-previousRevenue)/previousRevenue)*100):0;
  const daily=Array.from({length:7},(_,index)=>{const start=new Date(now);start.setHours(0,0,0,0);start.setDate(start.getDate()-(6-index));const end=new Date(start);end.setDate(end.getDate()+1);return trendOrders.filter(o=>paidStatuses.includes(o.status as any)&&o.createdAt>=start&&o.createdAt<end).reduce((sum,o)=>sum+o.total,0)});
  const maxDaily=Math.max(...daily,1);
  const chartW=720,chartH=225,padL=38,padR=10,padT=12,padB=30,plotW=chartW-padL-padR,plotH=chartH-padT-padB;
  const points=daily.map((value,index)=>({x:padL+(index*(plotW/(daily.length-1))),y:padT+plotH-(value/maxDaily)*plotH,value}));
  const linePath=points.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const barWidth=34;
  const labels=Array.from({length:7},(_,i)=>{const d=new Date(now);d.setHours(0,0,0,0);d.setDate(d.getDate()-(6-i));return dayLabel(d)});
  const totalForDonut=statusCounts.reduce((a,b)=>a+b,0)||1;
  let cursor=0;
  const donutColors=['#19a27b','#1c91d1','#39a4b4','#f0b33e','#df3b62'];
  const donutGradient=statusCounts.map((count,i)=>{const start=(cursor/totalForDonut)*100;cursor+=count;const end=(cursor/totalForDonut)*100;return `${donutColors[i]} ${start}% ${end}%`}).join(',');
  const statusLabels=[['Delivered',statusCounts[0]],['Processing',statusCounts[1]],['Shipped',statusCounts[2]],['Pending',statusCounts[3]],['Cancelled',statusCounts[4]]];

  return <div className="dashboard-v2">
    <aside className="dashboard-sidebar">
      <Link href="/admin" className="dashboard-brand"><span className="dashboard-brand-mark">P</span><span><strong>PRIYASA</strong><small>ADMIN CONTROL CENTER</small></span></Link>
      <nav className="dashboard-nav" aria-label="Admin navigation">
        {nav.map(([label,href,icon])=><Link key={href} href={href} className={href==='/admin'?'active':''}><span className="nav-icon">{icon}</span><span>{label}</span>{['Marketing','Automations','Settings'].includes(label)&&<span className="nav-arrow">›</span>}</Link>)}
      </nav>
    </aside>

    <section className="dashboard-content">
      <header className="dashboard-topbar">
        <button className="dashboard-menu-button" type="button" aria-label="Open admin menu">☰</button>
        <input className="dashboard-search" aria-label="Search admin" placeholder="Search orders, products, customers..." />
        <span className="dashboard-top-spacer" />
        <button className="dashboard-top-action" type="button" aria-label="Notifications">♧<span className="dashboard-notification">{pending>99?'99+':pending}</span></button>
        <div className="dashboard-profile"><span className="dashboard-avatar">{initials(session.name||'Admin')}</span><div><strong>{session.name||'Admin'}</strong><small>{session.email||'admin@priyasa.com'}</small></div><span className="dashboard-caret">⌄</span></div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-heading">
          <div><h1>Dashboard</h1><p>Welcome back! Here’s what’s happening with your store.</p></div>
          <div className="dashboard-filters"><select className="dashboard-select" defaultValue="7"><option value="7">7 Days</option><option value="30">30 Days</option><option value="90">90 Days</option></select><div className="dashboard-date">▣ &nbsp;{shortDate(sevenDaysAgo)} – {shortDate(now)}</div></div>
        </div>

        <div className="dashboard-stat-grid">
          <div className="dashboard-stat-card"><div className="dashboard-stat-top"><div><span className="dashboard-stat-label">Total Orders</span><div className="dashboard-stat-value">{orders.toLocaleString('en-IN')}</div><span className="dashboard-stat-foot"><b className="dashboard-up">↑ {orders?Math.max(1,Math.round((pending/orders)*100)):'0'}%</b> from last week</span></div><span className="dashboard-stat-icon">▣</span></div></div>
          <div className="dashboard-stat-card"><div className="dashboard-stat-top"><div><span className="dashboard-stat-label">Total Revenue</span><div className="dashboard-stat-value">{money(revenue._sum.total||0)}</div><span className="dashboard-stat-foot"><b className={revenueChange>=0?'dashboard-up':'dashboard-down'}>{revenueChange>=0?'↑':'↓'} {Math.abs(revenueChange)}%</b> vs previous 7 days</span></div><span className="dashboard-stat-icon">₹</span></div></div>
          <div className="dashboard-stat-card"><div className="dashboard-stat-top"><div><span className="dashboard-stat-label">Customers</span><div className="dashboard-stat-value">{customers.toLocaleString('en-IN')}</div><span className="dashboard-stat-foot"><b className="dashboard-up">● Live</b> registered customers</span></div><span className="dashboard-stat-icon">♙</span></div></div>
          <div className="dashboard-stat-card"><div className="dashboard-stat-top"><div><span className="dashboard-stat-label">Products</span><div className="dashboard-stat-value">{products.toLocaleString('en-IN')}</div><span className="dashboard-stat-foot"><b className="dashboard-up">↑</b> {variants.toLocaleString('en-IN')} total SKUs</span></div><span className="dashboard-stat-icon">▦</span></div></div>
        </div>

        <div className="dashboard-grid-main">
          <section className="dashboard-card">
            <div className="dashboard-card-head"><h2>Sales Overview</h2><select defaultValue="revenue" aria-label="Sales metric"><option value="revenue">Revenue</option><option value="orders">Orders</option></select></div>
            <div className="dashboard-chart">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} role="img" aria-label="Seven day revenue chart">
                {[0,1,2,3,4].map(i=>{const y=padT+(plotH*i/4);return <g key={i}><line className="dashboard-chart-grid" x1={padL} x2={chartW-padR} y1={y} y2={y}/><text className="dashboard-chart-axis" x="3" y={y+3}>{money(Math.round(maxDaily*(1-i/4)))}</text></g>})}
                {points.map((p,i)=><rect key={i} className="dashboard-chart-bar" x={p.x-barWidth/2} y={padT+plotH-(p.value/maxDaily)*plotH} width={barWidth} height={(p.value/maxDaily)*plotH} rx="3"/>) }
                <path className="dashboard-chart-line" d={linePath}/>
                {points.map((p,i)=><g key={`point-${i}`}><circle className="dashboard-chart-dot" cx={p.x} cy={p.y} r="3.5"/><text className="dashboard-chart-axis" textAnchor="middle" x={p.x} y={chartH-9}>{labels[i]}</text></g>)}
              </svg>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#7f8790'}}><span>Last 7 days</span><strong style={{color:'#252a30'}}>{money(currentRevenue)} revenue</strong></div>
            </div>
          </section>

          <section className="dashboard-card">
            <div className="dashboard-card-head"><h2>Order Status</h2><small>{orders.toLocaleString('en-IN')} total orders</small></div>
            <div className="dashboard-donut-wrap">
              <div className="dashboard-donut" style={{background:`conic-gradient(${donutGradient})`}}><div className="dashboard-donut-center"><strong>{orders.toLocaleString('en-IN')}</strong><span>Total Orders</span></div></div>
              <div className="dashboard-legend">{statusLabels.map(([label,count],i)=><div className="dashboard-legend-row" key={label as string}><i className="dashboard-legend-dot" style={{background:donutColors[i]}}/><span>{label as string}</span><strong>{Number(count).toLocaleString('en-IN')} ({Math.round((Number(count)/totalForDonut)*100)}%)</strong></div>)}</div>
            </div>
          </section>
        </div>

        <div className="dashboard-lower-grid">
          <section className="dashboard-card">
            <div className="dashboard-card-head"><h2>Recent Orders</h2><Link href="/admin/orders" style={{fontSize:10,color:'#d2194e',textDecoration:'none',fontWeight:700}}>View All →</Link></div>
            <table className="dashboard-table"><thead><tr><th>Order #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{recentOrders.map(order=><tr key={order.orderNumber}><td className="order-number">#{order.orderNumber}</td><td className="customer-name">{order.user?.name||order.user?.phone||'Guest'}</td><td>{money(order.total)}</td><td><span className={statusClass(order.status)}>{order.status.replaceAll('_',' ')}</span></td><td>{shortDate(order.createdAt)}</td></tr>)}{recentOrders.length===0&&<tr><td colSpan={5}>No orders yet.</td></tr>}</tbody></table>
          </section>
          <section className="dashboard-card">
            <div className="dashboard-card-head"><h2>Low Stock Products</h2><Link href="/admin/inventory" style={{fontSize:10,color:'#d2194e',textDecoration:'none',fontWeight:700}}>View All →</Link></div>
            <div className="stock-list">{lowStockProducts.map(item=><div className="stock-item" key={item.id}>{item.product.images[0]?.url?<img className="stock-thumb" src={item.product.images[0].url} alt=""/>:<div className="stock-thumb"/>}<div><div className="stock-name">{item.product.name}</div><div className="stock-sku">SKU: {item.sku}</div></div><div className="stock-count">{item.stock} in stock</div></div>)}{lowStockProducts.length===0&&<div style={{padding:22,fontSize:11,color:'#707780'}}>Inventory looks healthy. No variants at or below 5 units.</div>}</div>
          </section>
        </div>

        <section className="dashboard-card" style={{marginBottom:14}}>
          <div className="dashboard-actions">
            <Link className="dashboard-action" href="/admin/products/new"><span className="dashboard-action-icon">＋</span><span><strong>Add Product</strong><span>Create new product</span></span></Link>
            <Link className="dashboard-action" href="/admin/coupons-offers"><span className="dashboard-action-icon">◇</span><span><strong>Create Offer</strong><span>Discount & coupon</span></span></Link>
            <Link className="dashboard-action" href="/admin/whatsapp"><span className="dashboard-action-icon">◌</span><span><strong>Send Campaign</strong><span>WhatsApp / Email</span></span></Link>
            <Link className="dashboard-action" href="/admin/analytics"><span className="dashboard-action-icon">▥</span><span><strong>View Reports</strong><span>Sales & analytics</span></span></Link>
            <Link className="dashboard-action" href="/admin/automations"><span className="dashboard-action-icon">✦</span><span><strong>AI Assistant</strong><span>Get insights</span></span></Link>
          </div>
        </section>

        <div className="dashboard-module-strip">
          {nav.slice(3,11).map(([label,href])=><Link className="dashboard-module-card" href={href} key={href}><strong>{label}</strong><span>Open →</span></Link>)}
        </div>
        <div className="dashboard-footer-note">PRIYASA Commerce Control Center · {coupons} active coupons · {cmsSections} live homepage sections · {categories} categories · {lowStock} low-stock variants · {failedPayments} failed payments in the last 7 days · {inTransit} shipments in transit</div>
        <AdminDemoCleanup/>
      </main>
    </section>
  </div>
}
