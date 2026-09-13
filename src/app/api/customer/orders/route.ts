import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {priyasaApi,apiError} from '@/lib/priyasa-api';
import {getSession} from '@/lib/auth';

export const dynamic='force-dynamic';

export async function GET(){
  const session=await getSession();
  if(!session)return NextResponse.json({error:'Authentication required',code:'AUTH_REQUIRED'},{status:401,headers:{'Cache-Control':'no-store'}});
  const token=(await cookies()).get('priyasa_access_token')?.value;
  if(!token)return NextResponse.json({error:'Commerce authentication expired. Please sign in again.',code:'CUSTOMER_TOKEN_MISSING'},{status:401,headers:{'Cache-Control':'no-store'}});
  const {response,body}=await priyasaApi('/api/v1/storefront/orders',{method:'GET',headers:{Authorization:`Bearer ${token}`}});
  if(!response.ok)return NextResponse.json({error:apiError(body,'Unable to load orders.'),details:body,code:response.status===401?'CUSTOMER_TOKEN_INVALID':'ORDER_API_ERROR'},{status:response.status,headers:{'Cache-Control':'no-store'}});
  return NextResponse.json(body,{headers:{'Cache-Control':'private, no-store'}});
}
