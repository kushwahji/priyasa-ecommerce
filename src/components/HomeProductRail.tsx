'use client';
import type { Product } from '@/lib/catalog';
import { ProductCard } from '@/components/ProductCard';

export default function HomeProductRail({ products, className = '' }: { products: Product[]; className?: string }) {
  if (!products.length) return null;
  return (
    <div className={`home-product-rail ${className}`.trim()}>
      {products.map((product) => <div className="home-product-rail-item" key={product.id}><ProductCard product={product} /></div>)}
    </div>
  );
}
