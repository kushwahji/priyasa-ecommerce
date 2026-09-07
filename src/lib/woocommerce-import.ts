import {db} from '@/lib/db';
import {getWooCategories,getWooProducts,getWooVariations,type WooCategory,type WooVariation} from '@/lib/woocommerce';

const rupees=(value:string|number|null|undefined)=>{const n=Number(value||0);return Number.isFinite(n)?Math.max(0,Math.round(n)):0;};
const cleanSlug=(value:string,id:number)=>{const s=value.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,180);return s||`woocommerce-${id}`;};
const stripHtml=(value:string)=>value.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();

async function ensureCategory(c:WooCategory,cache:Map<number,string>):Promise<string>{
 const hit=cache.get(c.id);if(hit)return hit;
 let parentId:string|undefined;
 if(c.parent){const parent=await getWooCategory(c.parent);if(parent)parentId=await ensureCategory(parent,cache);}
 const slug=cleanSlug(c.slug||c.name,c.id);
 const row=await db.category.upsert({where:{slug},create:{name:c.name,slug,description:c.description||null,imageUrl:c.image?.src||null,parentId:parentId||null},update:{name:c.name,description:c.description||null,imageUrl:c.image?.src||null,parentId:parentId||null}});
 cache.set(c.id,row.id);return row.id;
}
let categorySource:WooCategory[]|null=null;
async function getWooCategory(id:number){if(!categorySource)categorySource=(await getWooCategories()).data;return categorySource.find(c=>c.id===id)||null;}

function variantParts(v:WooVariation){
 const size=v.attributes.find(a=>/size/i.test(a.name))?.option||'One Size';
 const color=v.attributes.find(a=>/color|colour/i.test(a.name))?.option||'Default';
 return {size:size.slice(0,30),color:color.slice(0,40)};
}
function stockFor(manage:boolean|string,quantity:number|null,inStock:boolean){if(quantity!==null&&quantity!==undefined)return Math.max(0,quantity);return inStock?9999:0;}

export async function previewWooCommerceImport(){
 // WooCommerce product responses already contain variation IDs. Do not call the
 // variation endpoint once per product during preview; that can exceed hosting timeouts.
 const [categories,products]=await Promise.all([getWooCategories(),getWooProducts()]);
 let variableProducts=0;let variations=0;
 for(const p of products.data){if(p.type==='variable'){variableProducts++;variations+=Array.isArray(p.variations)?p.variations.length:0;}}
 return {categories:categories.data.length,products:products.data.length,variableProducts,variations};
}

export async function importWooCommerceCatalog(options:{sync?:boolean}={}){
 const [categories,products]=await Promise.all([getWooCategories(),getWooProducts()]);
 categorySource=categories.data;
 const categoryCache=new Map<number,string>();
 const fallback=await db.category.upsert({where:{slug:'uncategorized'},create:{name:'Uncategorized',slug:'uncategorized'},update:{}});
 let categoriesCreatedOrUpdated=0,productsCreatedOrUpdated=0,variationsCreatedOrUpdated=0,imagesImported=0,skipped=0;
 const importedSlugs:string[]=[];
 for(const c of categories.data){await ensureCategory(c,categoryCache);categoriesCreatedOrUpdated++;}
 for(const p of products.data){
  try{
   const categoryId=p.categories[0]?await ensureCategory((await getWooCategory(p.categories[0].id))!,categoryCache):fallback.id;
   const slug=cleanSlug(p.slug||p.name,p.id);
   importedSlugs.push(slug);
   const active=p.status==='publish'&&p.catalog_visibility!=='hidden';
   const mrp=rupees(p.regular_price||p.price||p.sale_price);
   const sale=rupees(p.sale_price||p.price||p.regular_price);
   const salePrice=Math.min(sale||mrp,mrp||sale);
   const variants=p.type==='variable'?(await getWooVariations(p.id)).data:[];
   await db.$transaction(async tx=>{
    const product=await tx.product.upsert({where:{slug},create:{name:p.name,slug,description:stripHtml(p.description||p.short_description||''),categoryId,brand:null,mrp:mrp||salePrice,salePrice:salePrice||mrp,active},update:{name:p.name,description:stripHtml(p.description||p.short_description||''),categoryId,mrp:mrp||salePrice,salePrice:salePrice||mrp,active}});
    await tx.productImage.deleteMany({where:{productId:product.id}});
    if(p.images.length)await tx.productImage.createMany({data:p.images.map((i,index)=>({productId:product.id,url:i.src,alt:i.alt||i.name||p.name,sortOrder:i.position??index}))});
    imagesImported+=p.images.length;
    if(variants.length){
      for(const v of variants){const parts=variantParts(v);const sku=(v.sku||`WC-${p.id}-${v.id}`).slice(0,80);const price=rupees(v.sale_price||v.price||v.regular_price||p.sale_price||p.price||p.regular_price);const stock=stockFor(v.manage_stock,v.stock_quantity,v.in_stock);await tx.productVariant.upsert({where:{sku},create:{productId:product.id,sku,size:parts.size,color:parts.color,price:price||salePrice,stock},update:{productId:product.id,size:parts.size,color:parts.color,price:price||salePrice,stock}});variationsCreatedOrUpdated++;}
    }else{const sku=(p.sku||`WC-${p.id}`).slice(0,80);const price=salePrice||mrp;const stock=stockFor(p.manage_stock,p.stock_quantity,p.in_stock);await tx.productVariant.upsert({where:{sku},create:{productId:product.id,sku,size:'One Size',color:'Default',price,stock},update:{productId:product.id,size:'One Size',color:'Default',price,stock}});variationsCreatedOrUpdated++;}
   });
   productsCreatedOrUpdated++;
  }catch(error){skipped++;console.error(`WooCommerce product ${p.id} import failed`,error);}
 }
 if(options.sync&&skipped===0&&importedSlugs.length){
  const stale=await db.product.updateMany({where:{slug:{notIn:importedSlugs}},data:{active:false}});
  return {categories:categoriesCreatedOrUpdated,products:productsCreatedOrUpdated,variants:variationsCreatedOrUpdated,images:imagesImported,skipped,deactivatedStaleProducts:stale.count};
 }
 return {categories:categoriesCreatedOrUpdated,products:productsCreatedOrUpdated,variants:variationsCreatedOrUpdated,images:imagesImported,skipped,deactivatedStaleProducts:0};
}

export async function syncWooCommerceCatalog(){return importWooCommerceCatalog({sync:true});}
