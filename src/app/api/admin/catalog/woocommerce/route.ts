import {NextResponse} from 'next/server';
import {requireAdminPermission} from '@/lib/auth';
import {importWooCommerceCatalog,previewWooCommerceImport} from '@/lib/woocommerce-import';

export async function GET(){
 try{await requireAdminPermission('products.read');return NextResponse.json({data:await previewWooCommerceImport()});}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to connect to WooCommerce'},{status:500});}
}

export async function POST(req:Request){
 try{
  const session=await requireAdminPermission('products.write');
  const body=await req.json().catch(()=>({}));
  if(body?.mode==='preview')return NextResponse.json({data:await previewWooCommerceImport()});
  const result=await importWooCommerceCatalog();
  await (await import('@/lib/db')).db.auditLog.create({data:{userId:session.userId,action:'IMPORT',entity:'WooCommerceCatalog',metadata:result}});
  return NextResponse.json({data:result});
 }catch(error){
  return NextResponse.json({error:error instanceof Error?error.message:'WooCommerce import failed'},{status:500});
 }
}
