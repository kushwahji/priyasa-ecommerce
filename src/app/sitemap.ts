import type { MetadataRoute } from 'next';
import { getStorefrontCategories } from '@/lib/storefront-data';
import { priyasaApi } from '@/lib/priyasa-api';

export const revalidate=3600;
const BASE=process.env.NEXT_PUBLIC_APP_URL||'https://priyasa.com';

async function productSlugs(){const out:{slug:string}[]=[];for(let page=1;page<=100;page++){try{const{response,body}=await priyasaApi(`/api/v1/storefront/products?per_page=100&page=${page}&sort=newest`,{cache:'no-store'});if(!response.ok)break;const data=(body as any)?.data;const rows=Array.isArray(data?.data)?data.data:Array.isArray(data)?data:[];for(const p of rows)if(p?.slug)out.push({slug:String(p.slug)});const meta=data?.meta;if(!meta||page>=Number(meta.last_page||page)||rows.length===0)break}catch{break}}return out}

export default async function sitemap():Promise<MetadataRoute.Sitemap>{const[categories,products]=await Promise.all([getStorefrontCategories(),productSlugs()]);const staticRoutes=['','/shop','/new-arrivals','/offers','/collections','/about','/contact','/size-guide','/faq','/help','/track-order','/shipping-policy','/return-refund-policy','/cancellation-policy','/privacy-policy','/terms-and-conditions'];const now=new Date();return[...staticRoutes.map(path=>({url:`${BASE}${path}`,lastModified:now,changeFrequency:(path===''?'daily':'weekly') as 'daily'|'weekly',priority:path===''?1:.6})),...categories.map(c=>({url:`${BASE}/category/${c.slug}`,lastModified:now,changeFrequency:'daily' as const,priority:.8})),...products.map(p=>({url:`${BASE}/product/${encodeURIComponent(p.slug)}`,lastModified:now,changeFrequency:'daily' as const,priority:.9}))]}
