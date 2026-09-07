import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/catalog';
import { money } from '@/lib/catalog';

export function ProductCard({ product }: { product: Product }) {
  return <article className="product-card">
    {product.badge && <span className="badge">{product.badge}</span>}
    <Link href={`/product/${product.slug}`}><Image src={product.image} alt={product.name} width={600} height={800} /></Link>
    <div className="product-info"><h3><Link href={`/product/${product.slug}`} style={{color:'inherit',textDecoration:'none'}}>{product.name}</Link></h3><span className="price">{money(product.price)}</span><span className="mrp">{money(product.mrp)}</span></div>
  </article>;
}
