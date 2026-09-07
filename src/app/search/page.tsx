import StorefrontSearch from '@/components/StorefrontSearch';
export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}){const p=await searchParams;return <div className="storefront-page"><div className="page storefront-inner"><StorefrontSearch initialQuery={p.q||''}/></div></div>}
