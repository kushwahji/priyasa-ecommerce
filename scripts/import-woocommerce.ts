import {importWooCommerceCatalog,previewWooCommerceImport} from '../src/lib/woocommerce-import';

const mode=process.argv[2]||'preview';
if(mode==='preview'){
 const result=await previewWooCommerceImport();
 console.log(JSON.stringify(result,null,2));
}else if(mode==='import'){
 console.log('Starting WooCommerce → Priyasa catalog import...');
 const result=await importWooCommerceCatalog();
 console.log(JSON.stringify(result,null,2));
}else{
 throw new Error('Usage: npm run woocommerce:import -- preview|import');
}
