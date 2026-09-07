import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
import {requireAdminPermission} from '@/lib/auth';

const schema=z.object({
  variantIds:z.array(z.string().min(1)).min(1).max(1000),
  priceMode:z.enum(['keep','set','increase-percent','decrease-percent']).default('keep'),
  priceValue:z.number().int().min(0).max(10000000).optional(),
  stockMode:z.enum(['keep','set','increase','decrease']).default('keep'),
  stockValue:z.number().int().min(0).max(100000).optional(),
});

export async function POST(req:Request){
 try{
  const session=await requireAdminPermission('products.write');
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:'Invalid bulk update',details:parsed.error.flatten()},{status:400});
  const d=parsed.data;
  if(d.priceMode!=='keep'&&d.priceValue===undefined)return NextResponse.json({error:'Price value is required'},{status:400});
  if(d.stockMode!=='keep'&&d.stockValue===undefined)return NextResponse.json({error:'Stock value is required'},{status:400});
  const variants=await db.productVariant.findMany({where:{id:{in:d.variantIds}},select:{id:true,price:true,stock:true,reserved:true,sku:true}});
  if(variants.length!==d.variantIds.length)return NextResponse.json({error:'One or more variants were not found'},{status:404});
  await db.$transaction(async tx=>{
   for(const v of variants){
    let price=v.price;
    if(d.priceMode==='set')price=d.priceValue!;
    if(d.priceMode==='increase-percent')price=Math.round((v.price??0)*(1+d.priceValue!/100));
    if(d.priceMode==='decrease-percent')price=Math.max(0,Math.round((v.price??0)*(1-d.priceValue!/100)));
    let stock=v.stock;
    if(d.stockMode==='set')stock=d.stockValue!;
    if(d.stockMode==='increase')stock=Math.min(100000,v.stock+d.stockValue!);
    if(d.stockMode==='decrease')stock=Math.max(v.reserved,v.stock-d.stockValue!);
    await tx.productVariant.update({where:{id:v.id},data:{price,stock}});
    await tx.inventoryMovement.create({data:{variantId:v.id,quantity:stock-v.stock,reason:'ADMIN_BULK_UPDATE',referenceId:session.userId}});
   }
  });
  await db.auditLog.create({data:{userId:session.userId,action:'BULK_UPDATE',entity:'ProductVariant',metadata:{count:variants.length,priceMode:d.priceMode,priceValue:d.priceValue,stockMode:d.stockMode,stockValue:d.stockValue}}});
  return NextResponse.json({ok:true,updated:variants.length});
 }catch(e){const m=e instanceof Error?e.message:'';return NextResponse.json({error:m.includes('FORBIDDEN')?'Forbidden':m||'Unable to bulk update variants'},{status:m.includes('FORBIDDEN')?403:409});}
}
