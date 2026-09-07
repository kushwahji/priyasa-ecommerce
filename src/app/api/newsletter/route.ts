import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
const schema=z.object({email:z.string().trim().email().max(254)});
export async function POST(req:Request){try{const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:'Please enter a valid email address.'},{status:400});const email=p.data.email.toLowerCase();await db.settings.upsert({where:{key:`newsletter:${email}`},create:{key:`newsletter:${email}`,value:{email,active:true,subscribedAt:new Date().toISOString()}},update:{value:{email,active:true,resubscribedAt:new Date().toISOString()}}});return NextResponse.json({ok:true});}catch{return NextResponse.json({error:'Newsletter signup is temporarily unavailable.'},{status:500});}}
