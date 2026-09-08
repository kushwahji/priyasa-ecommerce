import Link from 'next/link';
import {getStorefrontCategories} from '@/lib/storefront-data';
import AdvancedStorefrontSearch from '@/components/AdvancedStorefrontSearch';

export const dynamic = 'force-dynamic';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const categories=await getStorefrontCategories();const category=categories.find(c=>c.slug===slug);return {title:category?`${category.name} Collection | PRIYASA`:'Collection | PRIYASA',description:category?.description||`Shop the latest ${category?.name||'PRIYASA'} styles.`}}

export default async function Category({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const categories=await getStorefrontCategories();const category=categories.find(c=>c.slug===slug);if(!category)return <div className="page"><h1>Collection not found</h1><Link className="button" href="/shop">Browse Shop</Link></div>;return <div className="storefront-page"><div className="page storefront-inner"><div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / {category.name}</div><div className="collection-intro"><div><span className="eyebrow dark">PRIYASA COLLECTION</span><h1>{category.name}</h1></div><p>{category.description||'Explore the latest styles from this collection.'}</p></div><AdvancedStorefrontSearch initialCategory={slug}/></div></div>}
