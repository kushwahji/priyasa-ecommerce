import Link from 'next/link';
import { getStorefrontCategories, getStorefrontCollections } from '@/lib/storefront-data';

export default async function StorefrontPrimaryNav() {
  const [categories, collections] = await Promise.all([
    getStorefrontCategories().catch(() => []),
    getStorefrontCollections(false).catch(() => []),
  ]);
  const visible = categories.slice(0, 8);
  const edits = collections.slice(0, 5);
  return <nav aria-label="Primary navigation">
    <Link href="/">Home</Link>
    <details className="header-mega">
      <summary>Women⌄</summary>
      <div className="mega-panel">
        <div><h4>Shop by Category</h4>{visible.length ? visible.map((c:any)=><Link key={c.id} href={`/category/${c.slug}`}>{c.name}</Link>) : <Link href="/shop">All Products</Link>}</div>
        <div><h4>Shop by Style</h4><Link href="/new-arrivals">New In</Link><Link href="/offers">Sale</Link>{edits.map((c:any)=><Link key={c.id} href={`/collections/${c.slug}`}>{c.name}</Link>)}<Link href="/shop?sort=price_asc">Price: Low to High</Link></div>
        <div className="mega-feature"><strong>Every You, Beautiful.</strong><span>Discover the latest Priyasa edit.</span><Link href="/shop">Shop Now →</Link></div>
      </div>
    </details>
    {categories.find((c:any)=>String(c.slug).toLowerCase()==='kids') && <Link href="/category/kids">Kids</Link>}
    <Link href="/new-arrivals">New Arrivals</Link>
    <Link href="/collections">Collections⌄</Link>
    <Link href="/offers">Sale</Link>
    <Link href="/about">About Us</Link>
  </nav>;
}
