import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {priyasaApi,apiError} from '@/lib/priyasa-api';

type AuthHeaders = Record<string,string>;

async function authHeaders(): Promise<AuthHeaders>{
  const jar=await cookies();
  const token=jar.get('priyasa_access_token')?.value;
  return token?{Authorization:`Bearer ${token}`}:{};
}

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const {response,body}=await priyasaApi(`/api/v1/storefront/products/${encodeURIComponent(id)}/reviews`,{headers:await authHeaders()});
  if(!response.ok)return NextResponse.json({error:apiError(body,'Unable to load reviews')},{status:response.status});
  return NextResponse.json(body,{headers:{'Cache-Control':'no-store'}});
}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const headers:AuthHeaders={...(await authHeaders()),'Idempotency-Key':req.headers.get('Idempotency-Key')||crypto.randomUUID()};
  if(!headers.Authorization)return NextResponse.json({error:'Authentication required'},{status:401});
  const input=await req.json().catch(()=>null);
  const {response,body}=await priyasaApi(`/api/v1/storefront/products/${encodeURIComponent(id)}/reviews`,{method:'POST',headers,body:JSON.stringify(input??{})});
  if(!response.ok)return NextResponse.json({error:apiError(body,'Unable to submit review'),details:body},{status:response.status});
  return NextResponse.json(body,{status:response.status});
}
