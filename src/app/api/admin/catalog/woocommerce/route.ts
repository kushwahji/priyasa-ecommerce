import {NextResponse} from 'next/server';
import {requireAdminPermission} from '@/lib/auth';
import {db} from '@/lib/db';
import {importWooCommerceCatalog,previewWooCommerceImport,syncWooCommerceCatalog} from '@/lib/woocommerce-import';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});

export async function GET(){
 try{
  await requireAdminPermission('products.read');
  return json({data:await previewWooCommerceImport()});
 }catch(error){
  return json({error:error instanceof Error?error.message:'Unable to connect to WooCommerce'},{ } as never);
 }
}

export async function POST(req:Request){
 try{
  const session=await requireAdminPermission('products.write');
  const body=await req.json().catch(()=>({}));
  if(body?.mode==='preview')return json({data:await previewWooCommerceImport()});
  const mode=body?.mode==='sync'?'sync':'import';
  const result=mode==='sync'?await syncWooCommerceCatalog():await importWooCommerceCatalog();
  await db.auditLog.create({data:{userId:session.userId,action:mode==='sync'?'SYNC':'IMPORT',entity:'WooCommerceCatalog',metadata:{mode,...result}}});
  return json({data:{mode,...result}});
 }catch(error){
  return json({error:error instanceof Error?error.message:'WooCommerce catalog operation failed'},500);
 }
}
