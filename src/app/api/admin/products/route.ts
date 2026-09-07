import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
const schema=z.object({name:z.string().min(2),slug:z.string().regex(/^[a-z0-9-]+$/),description:z.string().min(5),categoryId:z.string(),mrp:z.number().int().positive(),salePrice:z.number().int().positive(),active:z.boolean().default(true)});
export async function GET(){try{await requireAdmin();return NextResponse.json({data:await db.product.findMany({include:{category:true,variants:true},orderBy:{createdAt:'desc'}})});}catch{return NextResponse.json({error:'Forbidden'},{status:403});}}
export async function POST(req:Request){try{const session=await requireAdmin();const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:'Invalid product',details:p.error.flatten()},{status:400});const product=await db.product.create({data:p.data});await db.auditLog.create({data:{userId:session.userId,action:'CREATE',entity:'Product',entityId:product.id}});return NextResponse.json({data:product},{status:201});}catch(e){return NextResponse.json({error:e instanceof Error&&e.message==='FORBIDDEN'?'Forbidden':'Unable to create product'},{status:403});}}
