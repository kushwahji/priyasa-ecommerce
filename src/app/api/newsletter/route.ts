import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
const schema=z.object({email:z.string().trim().email().max(254)});
export async function POST(req:Request){try{const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:'Please enter a valid email address.'},{status:400});const email=p.data.email.toLowerCase();await db.newsletterSubscriber.upsert({where:{email},create:{email},update:{active:true}});return NextResponse.json({ok:true});}catch{return NextResponse.json({error:'Newsletter signup is temporarily unavailable.'},{status:500});}}
