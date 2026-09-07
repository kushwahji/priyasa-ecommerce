import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { products, money } from '@/lib/catalog';
import { DeliveryPincode } from '@/components/DeliveryPincode';
import { ProductGallery } from '@/components/ProductGallery';
import { ProductPurchase } from '@/components/ProductPurchase';
import { ProductCard } from '@/components/ProductCard';

export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const p=products.find(x=>x.slug===slug);
  if(!p) return notFound();
  const related=products.filter(x=>x.id!==p.id && x.category===p.category).slice(0,4);
  const discount=p.mrp>p.price?Math.round((1-p.price/p.mrp)*100):0;
  return <div className="storefront-page">
    <div className="page storefront-inner pdp-page">
      <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href={`/category/${p.category.toLowerCase().replaceAll(' ','-')}`}>{p.category}</Link> / {p.name}</div>
      <div className="pdp-layout">
        <ProductGallery image={p.image} name={p.name} gallery={[p.image]}/>
        <section className="pdp-info">
          <span className="eyebrow dark">{p.category}</span>
          <h1>{p.name}</h1>
          <div className="pdp-rating"><span>★★★★★</span><b>4.8</b><a href="#reviews">124 reviews</a></div>
          <div className="pdp-price"><strong>{money(p.price)}</strong><del>{money(p.mrp)}</del>{discount>0&&<span>{discount}% OFF</span>}</div>
          <p className="pdp-description">{p.description}</p>
          <div className="pdp-divider"/>
          <ProductPurchase product={p}/>
          <DeliveryPincode weightGrams={500}/>
          <div className="delivery-promises"><div><b>🚚</b><span><strong>Fast delivery</strong><small>Estimated delivery after pincode check</small></span></div><div><b>↩</b><span><strong>Easy returns</strong><small>7-day returns on eligible products</small></span></div><div><b>♧</b><span><strong>Secure checkout</strong><small>Payments protected end-to-end</small></span></div></div>
          <div className="pdp-accordions"><details open><summary>Product details</summary><p>{p.description} Designed for everyday comfort, dependable fit and a polished finish. SKU: PRI-{p.id.toUpperCase()}.</p></details><details><summary>Shipping & returns</summary><p>Enter your pincode above for a live Shiprocket serviceability check. Eligible orders qualify for easy returns according to the Priyasa return policy.</p></details><details id="reviews"><summary>Customer reviews <span>4.8 / 5</span></summary><p>Customers love the fit, fabric and finish of this style.</p></details></div>
        </section>
      </div>
    </div>
    {related.length>0&&<section className="section related-products"><div className="section-head"><div><span className="eyebrow dark">YOU MAY ALSO LIKE</span><h2>Complete the edit</h2></div><Link className="text-link" href="/shop">View all →</Link></div><div className="product-grid product-grid-editorial">{related.map(x=><ProductCard key={x.id} product={x}/>)}</div></section>}
    <div className="mobile-buy-bar"><span>{money(p.price)}</span><Link href="/checkout" className="button dark-button">Buy now</Link></div>
  </div>;
}
