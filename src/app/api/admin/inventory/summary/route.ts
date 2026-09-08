import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireAdminPermission} from '@/lib/auth';

export async function GET(){
  try{
    await requireAdminPermission('inventory.read');
    const [variants,low,out,warehouses,moves]=await Promise.all([
      db.productVariant.count(),
      db.productVariant.count({where:{stock:{lte:5}}}),
      db.productVariant.count({where:{stock:{lte:0}}}),
      db.warehouse.count({where:{active:true}}),
      db.inventoryMovement.findMany({take:20,orderBy:{createdAt:'desc'},include:{variant:{select:{sku:true,product:{select:{name:true}}}}}}),
    ]);
    return NextResponse.json({data:{variants,lowStock:low,outOfStock:out,warehouses,movements:moves}});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to load inventory summary'},{status:403});}
}
