export type HomeSection = { id:string|number; key:string; type:string; title?:string|null; subtitle?:string|null; image_url?:string|null; imageUrl?:string|null; mobile_image_url?:string|null; mobileImageUrl?:string|null; cta_label?:string|null; ctaLabel?:string|null; cta_href?:string|null; ctaHref?:string|null; content?:Record<string,any>|null; sort_order?:number; sortOrder?:number; is_active?:boolean; starts_at?:string|null; ends_at?:string|null };

const BASE_URL=(process.env.PRIYASA_API_BASE_URL||'https://api.priyasa.com').replace(/\/$/,'');

export async function getHomeSections():Promise<HomeSection[]> {
  const response=await fetch(`${BASE_URL}/api/v1/storefront/home`,{headers:{Accept:'application/json'},next:{revalidate:120,tags:['storefront-home-cms']}});
  if(!response.ok) return [];
  const body=await response.json().catch(()=>null);
  const data=body?.data;
  const sections=Array.isArray(data?.sections)?data.sections:Array.isArray(data)?data:[];
  return sections.filter((s:any)=>s&&s.is_active!==false).sort((a:any,b:any)=>(Number(a.sort_order??a.sortOrder??0)-Number(b.sort_order??b.sortOrder??0))||Number(a.id)-Number(b.id));
}
