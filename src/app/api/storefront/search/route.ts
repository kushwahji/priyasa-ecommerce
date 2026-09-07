import {NextResponse} from 'next/server';
import {getSearchProducts,getStorefrontCategories} from '@/lib/storefront-data';

export async function GET(req:Request){
 try{
  const url=new URL(req.url);const q=(url.searchParams.get('q')||'').trim();
  const raw=Number(url.searchParams.get('limit')||12);const limit=Math.min(24,Math.max(4,Number.isFinite(raw)?raw:12));
  const [products,categories]=await Promise.all([getSearchProducts(q,limit),getStorefrontCategories()]);
  const categorySuggestions=q?categories.filter(c=>c.name.toLowerCase().includes(q.toLowerCase())).slice(0,5).map(c=>({name:c.name,slug:c.slug})):[];
  return NextResponse.json({data:{query:q,products,categories:categorySuggestions}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to search'},{status:500});}
}
