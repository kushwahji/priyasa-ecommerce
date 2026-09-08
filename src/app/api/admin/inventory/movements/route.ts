import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireAdminPermission} from '@/lib/auth';

export async function GET(req:Request){
  try{
    await requireAdminPermission('inventory.read');
    const url=new URL(req.url); const sku=url.searchParams.get('sku')||undefined;
    const rows=await db.inventoryMovement.findMany({where:sku?{variant:{sku}}:undefined,orderBy:{createdAt:'desc'},take:100,include:{variant:{select:{sku:true,size:true,color:true,product:{select:{name:true}}}}}});
    return NextResponse.json({data:rows});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to load inventory movements'},{status:403});}
}
