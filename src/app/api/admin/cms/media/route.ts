import {NextResponse} from 'next/server';
import {mkdir,readdir,readFile,stat,unlink,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {requireAdminPermission} from '@/lib/auth';

const root=path.join(process.cwd(),'public','uploads','cms');
const allowed=new Map([['image/jpeg','jpg'],['image/png','png'],['image/webp','webp'],['image/avif','avif'],['image/gif','gif']]);

export async function GET(){
 try{await requireAdminPermission('content.read');await mkdir(root,{recursive:true});const names=await readdir(root);const data=[];for(const name of names){if(!/^cms-[a-f0-9-]+\.(jpg|png|webp|avif|gif)$/i.test(name))continue;const info=await stat(path.join(root,name));data.push({name,url:`/uploads/cms/${name}`,size:info.size,updatedAt:info.mtime.toISOString()});}data.sort((a,b)=>+new Date(b.updatedAt)-+new Date(a.updatedAt));return NextResponse.json({data});}
 catch(e){return NextResponse.json({error:e instanceof Error&&e.message.includes('FORBIDDEN')?'Forbidden':'Unable to load media'},{status:e instanceof Error&&e.message.includes('FORBIDDEN')?403:500});}
}

export async function POST(req:Request){
 try{const session=await requireAdminPermission('content.write');const form=await req.formData();const file=form.get('file');if(!(file instanceof File))return NextResponse.json({error:'Image file is required'},{status:400});const ext=allowed.get(file.type);if(!ext)return NextResponse.json({error:'Use JPG, PNG, WEBP, AVIF or GIF'},{status:400});if(file.size>8*1024*1024)return NextResponse.json({error:'Image must be 8MB or smaller'},{status:400});await mkdir(root,{recursive:true});const name=`cms-${randomUUID()}.${ext}`;await writeFile(path.join(root,name),Buffer.from(await file.arrayBuffer()));await (await import('@/lib/db')).db.auditLog.create({data:{userId:session.userId,action:'UPLOAD',entity:'CmsMedia',entityId:name,metadata:{size:file.size,type:file.type}}});return NextResponse.json({data:{name,url:`/uploads/cms/${name}`,size:file.size}});}
 catch(e){return NextResponse.json({error:e instanceof Error&&e.message.includes('FORBIDDEN')?'Forbidden':'Unable to upload image'},{status:e instanceof Error&&e.message.includes('FORBIDDEN')?403:500});}
}

export async function DELETE(req:Request){
 try{const session=await requireAdminPermission('content.write');const url=new URL(req.url);const name=url.searchParams.get('name')||'';if(!/^cms-[a-f0-9-]+\.(jpg|png|webp|avif|gif)$/i.test(name))return NextResponse.json({error:'Invalid media name'},{status:400});const target=path.join(root,name);await unlink(target).catch(()=>{});await (await import('@/lib/db')).db.auditLog.create({data:{userId:session.userId,action:'DELETE',entity:'CmsMedia',entityId:name}});return NextResponse.json({ok:true});}
 catch(e){return NextResponse.json({error:e instanceof Error&&e.message.includes('FORBIDDEN')?'Forbidden':'Unable to delete media'},{status:e instanceof Error&&e.message.includes('FORBIDDEN')?403:500});}
}
