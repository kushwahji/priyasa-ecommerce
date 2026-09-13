import {NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
import {db} from '@/lib/db';
import {setSession} from '@/lib/auth';

export async function POST(req:Request){
  try{
    const body=await req.json().catch(()=>({}));
    const email=typeof body?.email==='string'?body.email.trim().toLowerCase():'';
    const code=typeof body?.code==='string'?body.code.trim():'';
    const challengeId=typeof body?.challengeId==='string'?body.challengeId.trim():'';
    if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!/^[0-9]{6}$/.test(code)||!challengeId)return NextResponse.json({error:'Email, 6-digit code and challenge are required'},{status:400});

    const c=await db.emailOtpChallenge.findUnique({where:{id:challengeId}});
    if(!c||c.email!==email||c.consumedAt||c.expiresAt<new Date())return NextResponse.json({error:'Code expired or invalid'},{status:401});
    if(c.attempts>=5)return NextResponse.json({error:'Too many attempts. Request a new code.'},{status:429});

    const ok=await bcrypt.compare(code,c.codeHash);
    if(!ok){
      await db.emailOtpChallenge.update({where:{id:c.id},data:{attempts:{increment:1}}});
      return NextResponse.json({error:'Invalid verification code'},{status:401});
    }

    const user=await db.user.findUnique({where:{email:c.email}});
    if(!user||!['ADMIN','STAFF'].includes(user.role))return NextResponse.json({error:'Admin account not found'},{status:403});

    const token=await setSession(user);
    await db.$transaction([
      db.emailOtpChallenge.update({where:{id:c.id},data:{consumedAt:new Date()}}),
      db.auditLog.create({data:{userId:user.id,action:'ADMIN_EMAIL_OTP_LOGIN',entity:'User',entityId:user.id}}),
    ]);
    return NextResponse.json({ok:true,role:user.role,token});
  }catch(error){
    console.error('[PRIYASA ADMIN OTP VERIFY]',error instanceof Error?error.message:'unknown error');
    return NextResponse.json({error:'Unable to verify the admin code right now.'},{status:500});
  }
}
