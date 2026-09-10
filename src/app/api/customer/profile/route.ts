import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {priyasaApi,apiError} from '@/lib/priyasa-api';

const endpoint='/api/v1/storefront/profile';
async function token(){return (await cookies()).get('priyasa_access_token')?.value;}
async function proxy(method:string,body?:unknown){const t=await token();if(!t)return NextResponse.json({error:'Authentication required'},{status:401});const {response,body:result}=await priyasaApi(endpoint,{method,headers:{Authorization:`Bearer ${t}`},...(body===undefined?{}:{body:JSON.stringify(body)})});if(!response.ok)return NextResponse.json({error:apiError(result,'Unable to update profile.'),details:result},{status:response.status});return NextResponse.json((result as any)?.data??result,{status:response.status});}
export async function GET(){return proxy('GET');}
export async function PATCH(req:Request){const body=await req.json().catch(()=>({}));const name=typeof body?.name==='string'?body.name.trim():'';const parts=name.split(/\s+/).filter(Boolean);return proxy('PATCH',{first_name:parts[0]||undefined,last_name:parts.slice(1).join(' ')||undefined,email:typeof body?.email==='string'?(body.email.trim()||null):undefined});}
