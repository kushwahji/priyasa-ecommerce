import Link from 'next/link';
import {getActiveCms,getStorefrontCategories,getStorefrontProducts} from '@/lib/storefront-data';
import {ShopFilters} from '@/components/ShopFilters';

export const dynamic = 'force-dynamic';

export default async function Shop(){
 const [products,categories,hero]=await Promise.all([getStorefrontProducts(),getStorefrontCategories(),getActiveCms('shop.hero')]);
 return <div className="storefront-page">
  {hero&&<section className="plp-hero" style={{backgroundImage:`linear-gradient(90deg,rgba(27,13,16,.76),rgba(27,13,16,.1)),url(${hero.imageUrl||''})`,backgroundSize:'cover',backgroundPosition:'center'}}><div className="plp-hero-overlay"><span className="eyebrow">{hero.type}</span><h1>{hero.title}</h1>{hero.subtitle&&<p>{hero.subtitle}</p>}{hero.ctaHref&&<Link className="button" href={hero.ctaHref}>{hero.ctaLabel||'Shop Now'} →</Link>}</div></section>}
  <div className="page storefront-inner"><div className="breadcrumbs"><Link href="/">Home</Link> / Shop</div><div className="collection-intro"><div><span className="eyebrow dark">THE PRIYASA EDIT</span><h2>All styles</h2></div><p>Explore the live collection.</p></div><div className="category-pills">{categories.map(c=><Link href={`/category/${c.slug}`} key={c.id}>{c.name}</Link>)}</div><ShopFilters products={products} categories={categories.map(c=>c.name)} /></div>
 </div>;
}
