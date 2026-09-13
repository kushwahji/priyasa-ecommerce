import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {db} from '@/lib/db';
import {getSession} from '@/lib/auth';

export const dynamic='force-dynamic';

export async function GET(){
  const session=await getSession();
  if(!session)return NextResponse.json({authenticated:false},{headers:{'Cache-Control':'no-store'}});
  const user=await db.user.findUnique({where:{id:session.userId},select:{id:true,name:true,phone:true,email:true}});
  if(!user)return NextResponse.json({authenticated:false},{headers:{'Cache-Control':'no-store'}});
  const externalId=(await cookies()).get('priyasa_user_id')?.value||null;
  return NextResponse.json({authenticated:true,user:{...user,externalId}},{headers:{'Cache-Control':'no-store'}});
}
