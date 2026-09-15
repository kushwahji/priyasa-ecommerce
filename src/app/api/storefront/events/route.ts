import { NextResponse } from 'next/server';
import { priyasaApi } from '@/lib/priyasa-api';

const ALLOWED=new Set(['page_view','product_view','cart_view','cart_updated','begin_checkout','search','wishlist_add','purchase']);

export async function POST(req:Request){
 try{
  const body=await req.json();
  const event=String(body?.event||'').trim().slice(0,50);
  if(!ALLOWED.has(event))return NextResponse.json({error:'Unsupported event'},{status:400});
  const metadata=body?.metadata&&typeof body.metadata==='object'?body.metadata:{};
  const payload={event,session_id:typeof body?.session_id==='string'?body.session_id.slice(0,120):undefined,product_id:Number.isInteger(body?.product_id)?body.product_id:undefined,variant_id:Number.isInteger(body?.variant_id)?body.variant_id:undefined,query:typeof body?.query==='string'?body.query.slice(0,120):undefined,metadata};
  const {response,body:coreBody}=await priyasaApi('/api/v1/storefront/events',{method:'POST',body:JSON.stringify(payload),cache:'no-store'});
  if(!response.ok)return NextResponse.json({error:'Event service unavailable'},{status:response.status>=500?502:response.status});
  return NextResponse.json(coreBody||{data:{tracked:true}},{status:response.status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return NextResponse.json({error:'Invalid analytics request'},{status:400})}
}
