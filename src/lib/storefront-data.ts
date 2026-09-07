import {db} from '@/lib/db';
import type {Product} from '@/lib/catalog';

const activeWindow=(now:Date)=>({active:true,OR:[{startsAt:null},{startsAt:{lte:now}}],AND:[{OR:[{endsAt:null},{endsAt:{gte:now}}]}]});

function mapProduct(p:any):Product{
 const variant=p.variants?.find((v:any)=>v.stock-v.reserved>0)||p.variants?.[0];
 return {id:p.id,name:p.name,slug:p.slug,category:p.category.name,categorySlug:p.category.slug,price:variant?.price??p.salePrice,mrp:p.mrp,image:p.images?.[0]?.url||'',images:(p.images||[]).map((i:any)=>i.url),colors:[...new Set((p.variants||[]).map((v:any)=>v.color))] as string[],sizes:[...new Set((p.variants||[]).map((v:any)=>v.size))] as string[],description:p.description,variantId:variant?.id||'',badge:p.mrp>p.salePrice?`${Math.round((1-p.salePrice/p.mrp)*100)}% OFF`:undefined};
}

const productInclude={category:true,variants:{orderBy:{stock:'desc'}},images:{orderBy:{sortOrder:'asc'}}};

export async function getStorefrontProducts(options:{categorySlug?:string;limit?:number}={}):Promise<Product[]>{
 const where:any={active:true};if(options.categorySlug)where.category={slug:options.categorySlug};
 const rows=await db.product.findMany({where,include:productInclude,orderBy:{createdAt:'desc'},take:options.limit});
 return rows.map(mapProduct);
}

export async function getLatestLaunches(limit=8){
 const rows=await db.product.findMany({where:{active:true},include:productInclude,orderBy:{createdAt:'desc'},take:limit});
 return rows.map(mapProduct);
}

export async function getSearchProducts(query:string,limit=24){
 const q=query.trim();
 if(!q)return getLatestLaunches(Math.min(limit,12));
 const rows=await db.product.findMany({where:{active:true,OR:[{name:{contains:q}},{slug:{contains:q}},{brand:{contains:q}},{description:{contains:q}},{category:{name:{contains:q}}},{variants:{some:{OR:[{sku:{contains:q}},{size:{contains:q}},{color:{contains:q}}]}}}]},include:productInclude,orderBy:{createdAt:'desc'},take:limit});
 return rows.map(mapProduct);
}

export async function getBestSellers(limit=4):Promise<Product[]>{
 const groups=await db.orderItem.groupBy({by:['variantId'],where:{order:{status:{in:['CONFIRMED','PROCESSING','SHIPPED','DELIVERED']}}},_sum:{quantity:true},orderBy:{_sum:{quantity:'desc'}},take:limit*3});
 if(!groups.length)return getStorefrontProducts({limit});
 const variantRows=await db.productVariant.findMany({where:{id:{in:groups.map(g=>g.variantId)}},select:{id:true,productId:true}});
 const rankedIds:string[]=[];for(const group of groups){const variant=variantRows.find(v=>v.id===group.variantId);if(variant&&!rankedIds.includes(variant.productId))rankedIds.push(variant.productId);}
 const all=await getStorefrontProducts();return rankedIds.map(id=>all.find(p=>p.id===id)).filter((p):p is Product=>Boolean(p)).slice(0,limit);
}

export async function getProductsForHomeSection(type:string,limit=8):Promise<Product[]>{
 const t=type.toLowerCase().trim();
 if(t==='products-latest'||t==='latest'||t==='latest-collection')return getLatestLaunches(limit);
 if(t==='products-best'||t==='best-sellers'||t==='trending')return getBestSellers(limit);
 if(t==='products-sale'||t==='sale'){
  const rows=await db.product.findMany({where:{active:true},include:productInclude,orderBy:{updatedAt:'desc'},take:limit*3});
  return rows.filter((p:any)=>p.salePrice<p.mrp).slice(0,limit).map(mapProduct);
 }
 if(t.startsWith('products-category:'))return getStorefrontProducts({categorySlug:t.slice('products-category:'.length).trim(),limit});
 return [];
}

export async function getStorefrontProduct(slug:string){
 const p=await db.product.findFirst({where:{slug,active:true},include:{category:true,variants:{orderBy:{stock:'desc'}},images:{orderBy:{sortOrder:'asc'}},reviews:{where:{approved:true},select:{rating:true}}}});
 if(!p)return null;
 const variant=p.variants.find(v=>v.stock-v.reserved>0)||p.variants[0];const reviews=p.reviews;const rating=reviews.length?reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length:0;
 return {id:p.id,name:p.name,slug:p.slug,category:p.category.name,categorySlug:p.category.slug,price:variant?.price??p.salePrice,mrp:p.mrp,image:p.images[0]?.url||'',images:p.images.map(i=>i.url),colors:[...new Set(p.variants.map(v=>v.color))],sizes:[...new Set(p.variants.map(v=>v.size))],description:p.description,variantId:variant?.id||'',variants:p.variants.map(v=>({id:v.id,color:v.color,size:v.size,price:v.price??p.salePrice,stock:Math.max(0,v.stock-v.reserved),sku:v.sku})),rating,reviewCount:reviews.length,fabric:p.fabric,care:p.care};
}

export async function getStorefrontCategories(){return db.category.findMany({where:{products:{some:{active:true}}},orderBy:{name:'asc'},include:{_count:{select:{products:true}}});}
export async function getActiveCms(key:string){return db.cmsSection.findFirst({where:{key,...activeWindow(new Date())},orderBy:{sortOrder:'asc'}});}
export async function getHomeCms(){return db.cmsSection.findMany({where:{...activeWindow(new Date()),key:{startsWith:'home.'}},orderBy:{sortOrder:'asc'}});}
export const money=(n:number)=>`₹${n.toLocaleString('en-IN')}`;
