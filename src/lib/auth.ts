import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
const secret=()=>new TextEncoder().encode(process.env.SESSION_SECRET||'development-only-change-me');
export async function setSession(user:{id:string;role:string}){const token=await new SignJWT({role:user.role}).setProtectedHeader({alg:'HS256'}).setSubject(user.id).setIssuedAt().setExpirationTime('7d').sign(secret());(await cookies()).set('priyasa_session',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*7});}
export async function getSession(){const token=(await cookies()).get('priyasa_session')?.value;if(!token)return null;try{const {payload}=await jwtVerify(token,secret());return {userId:payload.sub!,role:String(payload.role||'CUSTOMER')};}catch{return null;}}
export async function requireAdmin(){const session=await getSession();if(!session||!['ADMIN','STAFF'].includes(session.role))throw new Error('FORBIDDEN');return session;}
export async function requireAdminPermission(permission:string){const session=await requireAdmin();if(session.role==='ADMIN')return session;const user=await db.user.findUnique({where:{id:session.userId},select:{adminRoleId:true}});if(!user?.adminRoleId)throw new Error('FORBIDDEN_PERMISSION');const role=await db.adminRole.findUnique({where:{id:user.adminRoleId},include:{permissions:{include:{permission:true}}}});if(!role?.permissions.some(x=>x.permission.key===permission))throw new Error('FORBIDDEN_PERMISSION');return session;}
