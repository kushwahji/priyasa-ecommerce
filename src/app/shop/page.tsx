import Image from 'next/image';
import Link from 'next/link';
import { products } from '@/lib/catalog';
import { ShopFilters } from '@/components/ShopFilters';

const hero = 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2200&q=88';

export default function Shop(){
  return <div className="storefront-page">
    <section className="plp-hero">
      <Image src={hero} alt="Priyasa fashion collection" fill priority sizes="100vw" className="plp-hero-image" />
      <div className="plp-hero-overlay"><span className="eyebrow">PRIYASA COLLECTIONS</span><h1>Fashion for<br/><em>every mood.</em></h1><p>Discover considered silhouettes, everyday essentials and occasion-ready Indian style.</p></div>
    </section>
    <div className="page storefront-inner">
      <div className="breadcrumbs"><Link href="/">Home</Link> / Shop</div>
      <div className="collection-intro"><div><span className="eyebrow dark">THE PRIYASA EDIT</span><h2>All styles</h2></div><p>Explore the complete collection, from intimate essentials to festive statements.</p></div>
      <div className="category-pills">{['Lingerie','Nightwear','Ethnic Wear','Activewear','Loungewear','Accessories'].map(x=><Link href={`/category/${x.toLowerCase().replaceAll(' ','-')}`} key={x}>{x}</Link>)}</div>
      <ShopFilters products={products}/>
    </div>
  </div>;
}
