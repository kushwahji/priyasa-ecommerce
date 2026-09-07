import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
import {requireAdminPermission} from '@/lib/auth';
const schema=z.object({ids:z.array(z.string().min(1)).min(1).max(200)});
export async function POST(req:Request){
 try{const s=await requireAdminPermission('content.write');const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:'Invalid order'},{status:400});const existing=await db.cmsSection.findMany({where:{id:{in:p.data.ids}},select:{id:true}});if(existing.length!==p.data.ids.length)return NextResponse.json({error:'One or more sections no longer exist'},{status:409});await db.$transaction(p.data.ids.map((id,index)=>db.cmsSection.update({where:{id},data:{sortOrder:index*10}})));await db.auditLog.create({data:{userId:s.userId,action:'REORDER',entity:'CmsSection',metadata:{count:p.data.ids.length}}});return NextResponse.json({ok:true});}
 catch(e){return NextResponse.json({error:e instanceof Error&&e.message.includes('FORBIDDEN')?'Forbidden':'Unable to reorder sections'},{status:e instanceof Error&&e.message.includes('FORBIDDEN')?403:500});}
}
