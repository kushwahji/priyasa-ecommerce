import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
import {requireAdminPermission} from '@/lib/auth';

const schema=z.object({body:z.string().trim().min(2).max(2000)});

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    await requireAdminPermission('customers.read');
    const {id}=await params;
    const rows=await db.auditLog.findMany({where:{entity:'CustomerNote',entityId:id},orderBy:{createdAt:'desc'},take:100,include:{user:{select:{name:true,phone:true}}}});
    return NextResponse.json({data:rows});
  }catch(e){return NextResponse.json({error:e instanceof Error&&e.message.includes('FORBIDDEN')?'Forbidden':'Unable to load notes'},{status:403});}
}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const admin=await requireAdminPermission('customers.write');
    const {id}=await params;
    const user=await db.user.findUnique({where:{id},select:{id:true,role:true}});
    if(!user||user.role!=='CUSTOMER')return NextResponse.json({error:'Customer not found'},{status:404});
    const parsed=schema.safeParse(await req.json());
    if(!parsed.success)return NextResponse.json({error:'Invalid note'},{status:400});
    const note=await db.auditLog.create({data:{userId:admin.userId,action:'CUSTOMER_NOTE_ADDED',entity:'CustomerNote',entityId:id,metadata:{body:parsed.data.body}}});
    return NextResponse.json({data:note},{status:201});
  }catch(e){return NextResponse.json({error:e instanceof Error&&e.message.includes('FORBIDDEN')?'Forbidden':'Unable to save note'},{status:403});}
}
