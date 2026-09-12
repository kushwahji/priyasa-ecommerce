import {SignJWT,jwtVerify} from 'jose';
import {cookies} from 'next/headers';

const secret=()=>{
  const value=process.env.SESSION_SECRET?.trim();
  if(!value&&process.env.NODE_ENV==='production') throw new Error('SESSION_SECRET is required in production');
  return new TextEncoder().encode(value||'development-only-change-me');
};

export async function setSession(user:{id:string;role:string}){
  const token=await new SignJWT({role:user.role})
    .setProtectedHeader({alg:'HS256'})
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
  (await cookies()).set('priyasa_session',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*7});
}

export async function clearSession(){
  const jar=await cookies();
  for(const name of ['priyasa_session','priyasa_access_token','priyasa_user_id','priyasa_mobile','priyasa_local_user_id']) jar.set(name,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});
}

export async function getSession(){
  const token=(await cookies()).get('priyasa_session')?.value;
  if(!token)return null;
  try{
    const {payload}=await jwtVerify(token,secret());
    if(!payload.sub)return null;
    return {userId:payload.sub,role:String(payload.role||'CUSTOMER')};
  }catch{return null;}
}

/**
 * Legacy local-admin bootstrap was backed by the retired Prisma database.
 * Admin provisioning now belongs to Priyasa Core / the dedicated admin app.
 */
export async function ensureAdminFromEnvironment(){
  throw new Error('LOCAL_ADMIN_DATABASE_DISABLED: provision administrators through Priyasa Core API');
}

export async function requireAdmin(){
  const session=await getSession();
  if(!session||!['ADMIN','STAFF'].includes(session.role))throw new Error('FORBIDDEN');
  return session;
}

/**
 * Permission checks are intentionally not reconstructed locally. Core API is
 * authoritative for RBAC. Legacy Store admin routes must not become a second
 * permission store.
 */
export async function requireAdminPermission(_permission:string){
  const session=await requireAdmin();
  if(session.role!=='ADMIN')throw new Error('FORBIDDEN_PERMISSION');
  return session;
}
