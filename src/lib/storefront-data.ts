import {db} from '@/lib/db';
import type {Product} from '@/lib/catalog';

export async function getStorefrontProducts(options:{categorySlug?:string;limit?:number}={}){
 const rows=await db.product.findMany({where:{active:true,...(options.categorySlug?{category:{slug:options.categorySlug}}:{})},include:{category:true,variants:{orderBy:{stock:'desc'}},images:{orderBy:{sortOrder:'asc'}}},orderBy:{createdAt:'desc'},...(options.limit?{take:options.limit}:{})});
 return rows.map((p):Product=>{const variant=p.variants.find(v=>v.stock-v.reserved>0)||p.variants[0];const image=p.images[0]?.url||'';const colors=[...new Set(p.variants.map(v=>v.color).filter(Boolean))];const sizes=[...new Set(p.variants.map(v=>v.size).filter(Boolean))];return {id:p.id,name:p.name,slug:p.slug,category:p.category.name,categorySlug:p.category.slug,price:variant?.price??p.salePrice,mrp:p.mrp,image,images:p.images.map(i=>i.url),colors,sizes,description:p.description,variantId:variant?.id||'',badge:p.mrp>p.salePrice?`${Math.round((1-p.salePrice/p.mrp)*100)}% OFF`:undefined,rating:undefined,reviewCount:undefined};});
}

export async function getStorefrontProduct(slug:string){
 const p=await db.product.findFirst({where:{slug,active:true},include:{category:true,variants:{orderBy:{stock:'desc'}},images:{orderBy:{sortOrder:'asc'}},reviews:{where:{approved:true},select:{rating:true}}}});
 if(!p)return null;
 const variant=p.variants.find(v=>v.stock-v.reserved>0)||p.variants[0];
 const reviews=p.reviews;const rating=reviews.length?reviews.reduce((s,r)=>s+r.rating,0)/reviews.length:0;
 return {id:p.id,name:p.name,slug:p.slug,category:p.category.name,categorySlug:p.category.slug,price:variant?.price??p.salePrice,mrp:p.mrp,image:p.images[0]?.url||'',images:p.images.map(i=>i.url),colors:[...new Set(p.variants.map(v=>v.color).filter(Boolean))],sizes:[...new Set(p.variants.map(v=>v.size).filter(Boolean))],description:p.description,variantId:variant?.id||'',variants:p.variants.map(v=>({id:v.id,color:v.color,size:v.size,price:v.price??p.salePrice,stock:Math.max(0,v.stock-v.reserved),sku:v.sku})),rating,reviewCount:reviews.length,fabric:p.fabric,care:p.care};
}

export async function getStorefrontCategories(){return db.category.findMany({orderBy:{name:'asc'},include:{_count:{select:{products:true}}});}

export async function getActiveCms(key:string){const now=new Date();return db.cmsSection.findFirst({where:{key,active:true,OR:[{startsAt:null},{startsAt:{lte:now}}],AND:[{OR:[{endsAt:null},{endsAt:{gte:now}}]}]},orderBy:{sortOrder:'asc'}});}

export const money=(n:number)=>`₹${n.toLocaleString('en-IN')}`;
