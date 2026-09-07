import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET(request:Request){const {searchParams}=new URL(request.url);const q=searchParams.get('q')||undefined;const category=searchParams.get('category')||undefined;const products=await db.product.findMany({where:{active:true, ...(q?{OR:[{name:{contains:q,mode:'insensitive'}},{description:{contains:q,mode:'insensitive'}}]}:{}), ...(category?{category:{slug:category}}:{})},include:{variants:true,images:true},orderBy:{createdAt:'desc'}});return NextResponse.json({data:products});}
