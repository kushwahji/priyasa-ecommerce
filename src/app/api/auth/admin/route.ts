import {NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
import {db} from '@/lib/db';
import {ensureAdminFromEnvironment,setSession} from '@/lib/auth';

export async function POST(req:Request){
  try{
    const body=await req.json().catch(()=>null);
    const email=typeof body?.email==='string'?body.email.trim().toLowerCase():'';
    const phone=typeof body?.phone==='string'?body.phone.trim():'';
    const password=typeof body?.password==='string'?body.password:'';
    if((!email&&!phone)||!password)return NextResponse.json({error:'Email and password are required'},{status:400});

    // Hostinger can restart a Node process without running the seed command.
    // Bootstrap the single environment-defined admin just-in-time so login is
    // deterministic and does not depend on process startup ordering.
    const envEmail=process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const envPhone=process.env.ADMIN_PHONE?.trim();
    const matchesConfiguredIdentity=(email&&envEmail===email)||(phone&&envPhone===phone);
    if(matchesConfiguredIdentity&&process.env.ADMIN_PASSWORD===password){
      await ensureAdminFromEnvironment();
    }

    const user=email
      ? await db.user.findUnique({where:{email}})
      : await db.user.findUnique({where:{phone}});

    if(!user||!['ADMIN','STAFF'].includes(user.role)||!user.passwordHash||!(await bcrypt.compare(password,user.passwordHash))){
      return NextResponse.json({error:'Invalid email or password'},{status:401});
    }

    await setSession(user);
    return NextResponse.json({ok:true,role:user.role});
  }catch(error){
    console.error('[PRIYASA ADMIN LOGIN]',error instanceof Error?error.message:'unknown error');
    return NextResponse.json({error:'Unable to sign in right now. Please try again.'},{status:500});
  }
}
