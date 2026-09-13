import {NextResponse} from 'next/server';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import {db} from '@/lib/db';
import {ensureAdminFromEnvironment} from '@/lib/auth';

export async function POST(req:Request){
  try{
    const body=await req.json().catch(()=>({}));
    const email=typeof body?.email==='string'?body.email.trim().toLowerCase():'';
    if(!email||!email.includes('@'))return NextResponse.json({error:'Valid email required'},{status:400});

    // Bootstrap the configured production administrator on demand. This avoids
    // requiring a manual DB insert or a separate seed process after a restart.
    const configuredEmail=process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if(configuredEmail===email){
      if(!process.env.ADMIN_PASSWORD||!process.env.ADMIN_PHONE)return NextResponse.json({error:'Admin bootstrap is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_PHONE.'},{status:503});
      await ensureAdminFromEnvironment();
    }

    const user=await db.user.findUnique({where:{email}});
    if(!user||!['ADMIN','STAFF'].includes(user.role))return NextResponse.json({error:'Admin account not found'},{status:404});

    const latest=await db.emailOtpChallenge.findFirst({where:{email:user.email!},orderBy:{createdAt:'desc'}});
    if(latest&&Date.now()-latest.createdAt.getTime()<30000)return NextResponse.json({error:'Please wait before requesting another code'},{status:429});

    const code=crypto.randomInt(100000,1000000).toString();
    const challenge=await db.emailOtpChallenge.create({data:{email:user.email!,codeHash:await bcrypt.hash(code,10),expiresAt:new Date(Date.now()+5*60*1000)}});
    const apiKey=process.env.RESEND_API_KEY?.trim();
    const from=process.env.EMAIL_FROM?.trim();
    if(!apiKey||!from){
      await db.emailOtpChallenge.update({where:{id:challenge.id},data:{attempts:99}});
      return NextResponse.json({error:'Transactional email is not configured. Set RESEND_API_KEY and EMAIL_FROM.'},{status:503});
    }

    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[user.email],subject:'Your PRIYASA admin login code',text:`Your PRIYASA admin verification code is ${code}. It expires in 5 minutes.`,html:`<p>Your PRIYASA admin verification code is <strong>${code}</strong>.</p><p>This code expires in 5 minutes.</p>`})});
    if(!response.ok){
      const providerError=await response.text().catch(()=> '');
      await db.emailOtpChallenge.update({where:{id:challenge.id},data:{attempts:99}});
      console.error('[PRIYASA ADMIN OTP EMAIL]',response.status,providerError.slice(0,500));
      return NextResponse.json({error:'Unable to send verification email. Check the configured sender domain and Resend credentials.'},{status:502});
    }
    return NextResponse.json({ok:true,challengeId:challenge.id,resendAfterSeconds:30});
  }catch(error){
    console.error('[PRIYASA ADMIN OTP]',error instanceof Error?error.message:'unknown error');
    return NextResponse.json({error:'Unable to request an admin verification code right now.'},{status:500});
  }
}
