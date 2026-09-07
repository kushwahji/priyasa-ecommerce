import Link from 'next/link';
import {getStorefrontCategories,getStorefrontProducts} from '@/lib/storefront-data';
import {ProductCard} from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function Category({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const [categories,products]=await Promise.all([getStorefrontCategories(),getStorefrontProducts({categorySlug:slug})]);const category=categories.find(c=>c.slug===slug);if(!category)return <div className="page"><h1>Collection not found</h1><Link className="button" href="/shop">Browse Shop</Link></div>;return <div className="storefront-page"><div className="page storefront-inner"><div className="breadcrumbs"><Link href="/">Home</Link> / {category.name}</div><div className="collection-intro"><div><span className="eyebrow dark">PRIYASA COLLECTION</span><h2>{category.name}</h2></div><p>{category.description||'Explore the latest styles from this collection.'}</p></div><div className="product-grid shop">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div>{!products.length&&<div className="empty-shop"><h3>No products available</h3><p>This collection is currently being updated.</p></div>}</div></div>}
