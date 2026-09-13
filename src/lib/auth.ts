import {SignJWT,jwtVerify} from 'jose';
import bcrypt from 'bcryptjs';
import {cookies,headers} from 'next/headers';
import {db} from '@/lib/db';

const secret=()=>{
  const value=process.env.SESSION_SECRET?.trim();
  if(!value&&process.env.NODE_ENV==='production') throw new Error('SESSION_SECRET is required in production');
  return new TextEncoder().encode(value||'development-only-change-me');
};

const cookieOptions=()=>({httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:60*60*24*7,...(process.env.SESSION_COOKIE_DOMAIN?.trim()?{domain:process.env.SESSION_COOKIE_DOMAIN.trim()}: {})});

export async function setSession(user:{id:string;role:string}){
  const token=await new SignJWT({role:user.role})
    .setProtectedHeader({alg:'HS256'})
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
  (await cookies()).set('priyasa_session',token,cookieOptions());
  return token;
}

export async function clearSession(){
  const jar=await cookies();
  const options=cookieOptions();
  for(const name of ['priyasa_session','priyasa_access_token','priyasa_user_id','priyasa_mobile','priyasa_local_user_id']) jar.set(name,'',{...options,maxAge:0});
}

export async function getSession(){
  const jar=await cookies();
  let token=jar.get('priyasa_session')?.value;
  if(!token){
    const authorization=(await headers()).get('authorization')||'';
    if(authorization.toLowerCase().startsWith('bearer '))token=authorization.slice(7).trim();
  }
  if(!token)return null;
  try{
    const {payload}=await jwtVerify(token,secret());
    if(!payload.sub)return null;
    return {userId:payload.sub,role:String(payload.role||'CUSTOMER')};
  }catch{return null;}
}

const ADMIN_PERMISSIONS:[string,string][]=[
 ['orders.read','View orders'],['orders.write','Create and update orders'],['orders.refund','Process refunds'],
 ['products.read','View catalog'],['products.write','Create and update catalog'],['inventory.write','Manage inventory'],
 ['content.read','View storefront content'],['content.write','Manage storefront content'],['marketing.write','Manage offers and coupons'],
 ['settings.write','Manage settings'],['customers.read','View customers'],['returns.write','Manage returns'],
];

export async function ensureAdminFromEnvironment(){
  const email=process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password=process.env.ADMIN_PASSWORD;
  const phone=process.env.ADMIN_PHONE?.trim();
  if(!email||!password||!phone) throw new Error('ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_PHONE are required');

  const role=await db.adminRole.upsert({where:{name:'ADMIN'},update:{description:'Full commerce administration'},create:{name:'ADMIN',description:'Full commerce administration'}});
  for(const [key,description] of ADMIN_PERMISSIONS){
    const permission=await db.adminPermission.upsert({where:{key},update:{description},create:{key,description}});
    await db.adminRolePermission.upsert({where:{roleId_permissionId:{roleId:role.id,permissionId:permission.id}},update:{},create:{roleId:role.id,permissionId:permission.id}});
  }
  const existing=await db.user.findFirst({where:{OR:[{email},{phone}]}});
  const passwordHash=await bcrypt.hash(password,12);
  if(existing)return db.user.update({where:{id:existing.id},data:{email,phone,passwordHash,role:'ADMIN',adminRoleId:role.id}});
  return db.user.create({data:{phone,email,passwordHash,role:'ADMIN',name:'Priyasa Admin',adminRoleId:role.id}});
}

export async function requireAdmin(){
  const session=await getSession();
  if(!session||!['ADMIN','STAFF'].includes(session.role))throw new Error('FORBIDDEN');
  return session;
}

export async function requireAdminPermission(permission:string){
  const session=await requireAdmin();
  if(session.role==='ADMIN')return session;
  const user=await db.user.findUnique({where:{id:session.userId},select:{adminRoleId:true}});
  if(!user?.adminRoleId)throw new Error('FORBIDDEN_PERMISSION');
  const role=await db.adminRole.findUnique({where:{id:user.adminRoleId},include:{permissions:{include:{permission:true}}}});
  if(!role?.permissions.some(x=>x.permission.key===permission))throw new Error('FORBIDDEN_PERMISSION');
  return session;
}
