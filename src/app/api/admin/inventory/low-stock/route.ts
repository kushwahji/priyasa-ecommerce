import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireAdminPermission} from '@/lib/auth';

export async function GET(){
  try{
    await requireAdminPermission('inventory.read');
    const rows=await db.productVariant.findMany({where:{stock:{lte:5}},orderBy:{stock:'asc'},include:{product:{select:{id:true,name:true,active:true,images:{take:1,orderBy:{sortOrder:'asc'},select:{url:true}}}}},take:200});
    return NextResponse.json({data:rows.map(v=>({id:v.id,sku:v.sku,size:v.size,color:v.color,stock:v.stock,reserved:v.reserved,available:Math.max(0,v.stock-v.reserved),product:v.product}))});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to load low-stock inventory'},{status:403});}
}
