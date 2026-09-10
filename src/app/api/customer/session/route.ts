import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {priyasaApi} from '@/lib/priyasa-api';
export async function GET(){const jar=await cookies();const token=jar.get('priyasa_access_token')?.value;const externalId=jar.get('priyasa_user_id')?.value;if(!token)return NextResponse.json({authenticated:false});const {response,body}=await priyasaApi('/api/v1/storefront/profile',{headers:{Authorization:`Bearer ${token}`}});if(!response.ok||!(body as any)?.data)return NextResponse.json({authenticated:false});const u:any=(body as any).data;return NextResponse.json({authenticated:true,user:{id:String(u.id),name:[u.first_name,u.last_name].filter(Boolean).join(' '),phone:u.phone,email:u.email||null,externalId:externalId||null}});}
