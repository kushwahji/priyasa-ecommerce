import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {getSession} from '@/lib/auth';

export const dynamic='force-dynamic';

export async function GET(){
  const session=await getSession();
  if(!session)return NextResponse.json({authenticated:false},{headers:{'Cache-Control':'no-store'}});
  const user=await db.user.findUnique({where:{id:session.userId},select:{id:true,name:true,phone:true,email:true}});
  if(!user)return NextResponse.json({authenticated:false},{headers:{'Cache-Control':'no-store'}});
  const jar=(await import('next/headers')).cookies;
  const cookieJar=await jar();
  const externalId=cookieJar.get('priyasa_user_id')?.value||null;
  return NextResponse.json({authenticated:true,user:{...user,externalId}},{headers:{'Cache-Control':'no-store'}});
}
