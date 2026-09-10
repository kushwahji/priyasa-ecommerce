import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { priyasaApi } from '@/lib/priyasa-api';
import { PaymentPage } from '@/components/PaymentPage';

export default async function Payment({params}:{params:Promise<{orderId:string}>}){
  const {orderId}=await params;
  const token=(await cookies()).get('priyasa_access_token')?.value;
  if(!token)redirect('/login');
  const {response,body}=await priyasaApi(`/api/v1/storefront/orders/${encodeURIComponent(orderId)}`,{headers:{Authorization:`Bearer ${token}`}});
  if(response.status===404)notFound();
  if(!response.ok)return <div className="page"><div className="order-empty account-card"><h2>Unable to load payment</h2><p>Please return to My Orders and try again.</p><Link className="button" href="/account/orders">My Orders</Link></div></div>;
  const data:any=(body as any)?.data||body;
  const order:any=data?.order||data;
  const orderIdValue=String(order?.id||orderId);
  const orderNumber=String(order?.order_number||order?.orderNumber||'');
  const total=Number(order?.grand_total??order?.total??0);
  const status=String(order?.status||'').toLowerCase();
  if(!orderNumber||!Number.isFinite(total))notFound();
  if(!['payment_pending','pending_payment','created'].includes(status))return <div className="page"><div className="order-empty account-card"><h2>Payment is already completed</h2><p>This order is no longer awaiting payment.</p><Link className="button" href={`/account/orders/${encodeURIComponent(orderIdValue)}`}>View Order</Link></div></div>;
  return <div className="storefront-page"><div className="page storefront-inner payment-page"><div className="breadcrumbs"><Link href="/account/orders">My Orders</Link><span> / </span> Payment</div><PaymentPage orderId={orderIdValue} orderNumber={orderNumber} total={total}/></div></div>;
}
