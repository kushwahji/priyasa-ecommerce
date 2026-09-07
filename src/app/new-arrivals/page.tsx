import Link from 'next/link';
import {getStorefrontProducts} from '@/lib/storefront-data';
import {ProductCard} from '@/components/ProductCard';
export default async function NewArrivals(){const products=await getStorefrontProducts();return <div className="storefront-page"><div className="page storefront-inner"><div className="breadcrumbs"><Link href="/">Home</Link> / New Arrivals</div><div className="collection-intro"><div><span className="eyebrow dark">JUST IN</span><h2>New Arrivals</h2></div><p>Fresh styles from the live Priyasa catalogue.</p></div><div className="product-grid shop">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div>{!products.length&&<div className="empty-shop"><h3>No new arrivals yet</h3></div>}</div></div>}
