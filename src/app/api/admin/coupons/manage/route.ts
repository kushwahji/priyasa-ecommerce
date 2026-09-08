import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
import {requireAdminPermission} from '@/lib/auth';

const schema=z.object({id:z.string().min(1),active:z.boolean()});

export async function PATCH(req:Request){try{const admin=await requireAdminPermission('marketing.write');const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:'Invalid coupon update'},{status:400});const coupon=await db.coupon.update({where:{id:p.data.id},data:{active:p.data.active}});await db.auditLog.create({data:{userId:admin.userId,action:p.data.active?'ACTIVATE':'DEACTIVATE',entity:'Coupon',entityId:coupon.id}});return NextResponse.json({data:coupon});}catch(e){const m=e instanceof Error?e.message:'';return NextResponse.json({error:m.includes('FORBIDDEN')?'Forbidden':'Unable to update coupon'},{status:m.includes('FORBIDDEN')?403:409});}}

export async function DELETE(req:Request){try{const admin=await requireAdminPermission('marketing.write');const id=new URL(req.url).searchParams.get('id')||'';if(!id)return NextResponse.json({error:'Coupon id is required'},{status:400});const coupon=await db.coupon.findUnique({where:{id}});if(!coupon)return NextResponse.json({error:'Coupon not found'},{status:404});if(coupon.usedCount>0)return NextResponse.json({error:'Used coupons cannot be deleted. Disable the coupon instead.'},{status:409});await db.coupon.delete({where:{id}});await db.auditLog.create({data:{userId:admin.userId,action:'DELETE',entity:'Coupon',entityId:id}});return NextResponse.json({ok:true});}catch(e){const m=e instanceof Error?e.message:'';return NextResponse.json({error:m.includes('FORBIDDEN')?'Forbidden':'Unable to delete coupon'},{status:m.includes('FORBIDDEN')?403:409});}}
