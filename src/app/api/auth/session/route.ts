import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';

export async function GET(){
  const jar=await cookies();
  const session=jar.get('priyasa_session')?.value;
  const phone=jar.get('priyasa_mobile')?.value;
  const id=jar.get('priyasa_user_id')?.value||jar.get('priyasa_local_user_id')?.value;
  if(!session&&!phone)return NextResponse.json({authenticated:false});
  return NextResponse.json({authenticated:true,user:{id:id||phone||'customer',name:jar.get('priyasa_user_name')?.value||null,phone:phone||null,email:jar.get('priyasa_user_email')?.value||null,externalId:jar.get('priyasa_user_id')?.value||null}});
}
