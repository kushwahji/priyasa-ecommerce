import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {db} from '@/lib/db';
import {getSession} from '@/lib/auth';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(){
  const session=await getSession();
  const jar=await cookies();
  const localUserId=jar.get('priyasa_local_user_id')?.value;
  const mobile=jar.get('priyasa_mobile')?.value;
  if(!session)return NextResponse.json({authenticated:false,role:null});
  const user=await db.user.findUnique({where:{id:session.userId},select:{id:true,phone:true,email:true,name:true,role:true}}).catch(()=>null);
  return NextResponse.json({
    authenticated:Boolean(user&&session.userId===user.id),
    role:user?.role||session.role,
    user:user?{id:user.id,phone:user.phone,email:user.email,name:user.name}:null,
    localIdentity:{present:Boolean(localUserId&&mobile)},
  },{headers:{'Cache-Control':'no-store'}});
}
