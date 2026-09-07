'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Product } from '@/lib/catalog';
import { money } from '@/lib/catalog';
import { AddToCart } from '@/components/AddToCart';

export function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false);
  useEffect(() => {
    try { setLiked(JSON.parse(localStorage.getItem('priyasa_wishlist') || '[]').includes(product.id)); } catch {}
  }, [product.id]);
  function toggleWishlist() {
    const key = 'priyasa_wishlist';
    const list: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    const next = liked ? list.filter(id => id !== product.id) : [...new Set([...list, product.id])];
    localStorage.setItem(key, JSON.stringify(next)); setLiked(!liked);
  }
  const discount = product.mrp > product.price ? Math.round((1-product.price/product.mrp)*100) : 0;
  return <article className="product-card">
    <div className="product-media">
      {product.badge && <span className="badge">{product.badge}</span>}
      <button className={`product-wishlist ${liked ? 'liked' : ''}`} onClick={toggleWishlist} aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}>{liked ? '♥' : '♡'}</button>
      <Link href={`/product/${product.slug}`} aria-label={product.name} className="product-image-link"><Image src={product.image} alt={product.name} width={600} height={800} /></Link>
      <div className="quick-add"><AddToCart variantId={`${product.id}-default`} productId={product.id} name={product.name} price={product.price}/></div>
    </div>
    <div className="product-info">
      <div className="product-category">{product.category}</div>
      <h3><Link href={`/product/${product.slug}`}>{product.name}</Link></h3>
      <div className="product-rating"><span>★★★★★</span> <small>4.8</small></div>
      <div><span className="price">{money(product.price)}</span> <span className="mrp">{money(product.mrp)}</span>{discount > 0 && <span className="discount-text"> {discount}% off</span>}</div>
    </div>
  </article>;
}
