import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { setSession } from '@/lib/auth';
export async function POST(req:Request){const {phone,password}=await req.json();if(typeof phone!=='string'||typeof password!=='string')return NextResponse.json({error:'Invalid credentials'},{status:400});const user=await db.user.findUnique({where:{phone}});if(!user||!['ADMIN','STAFF'].includes(user.role)||!user.passwordHash||!(await bcrypt.compare(password,user.passwordHash)))return NextResponse.json({error:'Invalid credentials'},{status:401});await setSession(user);return NextResponse.json({ok:true,role:user.role});}
