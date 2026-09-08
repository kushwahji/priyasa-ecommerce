import { getBestSellers, getHomeCms, getLatestLaunches, getProductsForHomeSection, getStorefrontCategories, getStorefrontProducts } from '@/lib/storefront-data';
import { ProductCard } from '@/components/ProductCard';
import HomeHeroCarousel from '@/components/HomeHeroCarousel';
import HomeImageCarousel from '@/components/HomeImageCarousel';
import HomeCmsSection from '@/components/HomeCmsSection';
import HomeProductGrid from '@/components/HomeProductGrid';
import AffiliateHomeSection from '@/components/AffiliateHomeSection';
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';
import { TruckIcon, ShieldIcon, ReturnIcon, GiftIcon } from '@/components/StorefrontIcons';

export const dynamic='force-dynamic';
const cleanText=(value:unknown)=>String(value??'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim();
const heroTitle=(value:string)=>value.length>96?`${value.slice(0,93).replace(/\s+\S*$/,'')}…`:value;
const typeOf=(s:any)=>String(s.type||'').toLowerCase();
const productType=(type:string)=>type.startsWith('products-')||['latest','latest-collection','best-sellers','trending','sale'].includes(type);
const imageType=(type:string)=>['image-carousel','image-slide','carousel'].includes(type);
const bannerType=(type:string)=>['promo','banner','image-banner','collection-banner'].includes(type);
const casualType=(type:string)=>['casual-grid','casual','lifestyle-grid'].includes(type);
const featureType=(type:string)=>['feature','lifestyle'].includes(type);
const deliveryType=(type:string)=>['delivery-banner','benefits','trust-strip'].includes(type);
const festivalType=(type:string)=>['festival','festival-grid','festive-collection'].includes(type);
const categoriesMarkup=(categories:any[],title='Shop by Category',subtitle='Find your style, your way.')=><section className="home-section"><div className="home-section-head"><div><span className="home-kicker">THE PRIYASA EDIT</span><h2>{title}</h2><p>{subtitle}</p></div><a className="home-view-all" href="/shop">View All →</a></div><div className="category-grid category-grid-editorial">{categories.slice(0,8).map((category:any)=><a className="category-card" key={category.id} href={`/category/${category.slug}`}><div className="category-image" style={{backgroundImage:`url(${category.imageUrl||category.products?.[0]?.images?.[0]?.url||'/images/product-placeholder.svg'})`}}/><div className="category-label"><strong>{category.name}</strong><span>Shop Now →</span></div></a>)}</div></section>;

export default async function Home(){
 const [categories,sections,latest]=await Promise.all([getStorefrontCategories(),getHomeCms(),getLatestLaunches(30)]);
 const fallbackBest=await getBestSellers(30);
 const fallbackSale=await getProductsForHomeSection('products-sale',30);
 const festivalSlug=categories.find((c:any)=>['festival','festive','diwali','navratri','eid','wedding'].some((k:string)=>String(c.slug).toLowerCase().includes(k)))?.slug;
 const festivalProducts=festivalSlug?await getStorefrontProducts({categorySlug:festivalSlug,limit:30}):[];
 const hasCms=sections.length>0;
 const used=new Set<string>();
 const renderProductSection=async(section:any,productsOverride?:any[])=>{const products=productsOverride||await getProductsForHomeSection(typeOf(section),30);if(!products.length)return null;return <section className="home-section home-product-section" key={section.id}><div className="home-section-head"><div><span className="home-kicker">{section.subtitle||'PRIYASA EDIT'}</span><h2>{section.title||'Curated for you'}</h2>{section.ctaHref&&<p>{cleanText(section.subtitle)}</p>}</div>{section.ctaHref&&<a className="home-view-all" href={section.ctaHref}>{section.ctaLabel||'View All'} →</a>}</div><HomeProductGrid products={products} initialVisible={10} step={10}/></section>};
 const body:any[]=[];
 if(!hasCms){
   if(latest.length)body.push(<section className="home-section home-hero-multi" key="fallback-hero"><section className="hero hero-editorial hero-fallback" style={{backgroundImage:`url(${latest[0].image})`,'--hero-image':`url(${latest[0].image})`} as React.CSSProperties}><div className="hero-copy"><span className="eyebrow">LATEST FROM PRIYASA</span><h1>{heroTitle(cleanText(latest[0].name))}</h1><p>{cleanText(latest[0].description)||'Fashion for every mood, every moment and every you.'}</p><a className="button" href={`/product/${latest[0].slug}`}>Shop Now →</a></div></section></section>);
   body.push(<section className="home-delivery-banner" key="fallback-delivery"><div className="home-delivery-inner"><div className="home-delivery-item"><TruckIcon/><div><strong>Free Shipping</strong><small>On orders above ₹999</small></div></div><div className="home-delivery-item"><GiftIcon/><div><strong>COD Available</strong><small>Cash on delivery</small></div></div><div className="home-delivery-item"><ReturnIcon/><div><strong>Easy Returns</strong><small>Hassle free</small></div></div><div className="home-delivery-item"><ShieldIcon/><div><strong>Secure Payments</strong><small>100% safe & trusted</small></div></div></div></section>);
   if(categories.length)body.push(categoriesMarkup(categories));
   if(latest.length)body.push(await renderProductSection({id:'latest',type:'products-latest',title:'New Launch',subtitle:'NEW IN',ctaHref:'/new-arrivals',ctaLabel:'View All'},latest));
   if(fallbackBest.length)body.push(await renderProductSection({id:'best',type:'products-best',title:'Best Sellers',subtitle:'MOST LOVED',ctaHref:'/shop',ctaLabel:'View All'},fallbackBest));
   if(festivalProducts.length)body.push(<section className="home-festival-wrap" key="festival-fallback"><section className="home-section"><div className="home-section-head"><div><span className="home-kicker">FESTIVAL EDIT</span><h2>Festival Collection</h2><p>Celebrate every occasion in style.</p></div><a className="home-view-all" href={`/category/${festivalSlug}`}>Shop Collection →</a></div><div className="home-festival-grid">{festivalProducts.slice(0,4).map((p:any)=><a className="home-festival-card" key={p.id} href={`/product/${p.slug}`} style={{backgroundImage:`url(${p.image})`}}><div className="home-festival-copy"><strong>{p.name}</strong><span>SHOP NOW →</span></div></a>)}</div></section></section>);
   if(fallbackSale.length)body.push(await renderProductSection({id:'sale',type:'products-sale',title:'Sale Favourites',subtitle:'SPECIAL EDIT',ctaHref:'/offers',ctaLabel:'View Offers'},fallbackSale));
 }else{
   for(let i=0;i<sections.length;i++){
    const section=sections[i];const type=typeOf(section);if(used.has(section.id))continue;
    if(['hero','hero-slide'].includes(type)){const slides=sections.filter((s:any)=>['hero','hero-slide'].includes(typeOf(s)));slides.forEach((s:any)=>used.add(s.id));body.push(<section className="home-section home-hero-multi" key={`hero-${section.id}`}><HomeHeroCarousel slides={slides}/></section>);continue}
    if(imageType(type)){const slides=sections.filter((s:any)=>imageType(typeOf(s)));slides.forEach((s:any)=>used.add(s.id));body.push(<section className="home-section" key={`images-${section.id}`}><HomeImageCarousel slides={slides}/></section>);continue}
    if(type==='category-grid'){used.add(section.id);body.push(categoriesMarkup(categories,section.title||'Shop by Category',section.subtitle||'Find your style, your way.'));continue}
    if(productType(type)){used.add(section.id);body.push(await renderProductSection(section));continue}
    if(type==='products-all'||type==='products-grid-30'){used.add(section.id);body.push(await renderProductSection(section,await getStorefrontProducts({limit:30})));continue}
    if(festivalType(type)){used.add(section.id);body.push(<section className="home-festival-wrap" key={section.id}><section className="home-section"><div className="home-section-head"><div><span className="home-kicker">{section.subtitle||'FESTIVAL EDIT'}</span><h2>{section.title||'Festival Collection'}</h2></div>{section.ctaHref&&<a className="home-view-all" href={section.ctaHref}>{section.ctaLabel||'Shop Collection'} →</a>}</div><div className="home-festival-grid">{(festivalProducts.length?festivalProducts:latest).slice(0,4).map((p:any)=><a className="home-festival-card" key={p.id} href={`/product/${p.slug}`} style={{backgroundImage:`url(${p.image})`}}><div className="home-festival-copy"><strong>{p.name}</strong><span>SHOP NOW →</span></div></a>)}</div></section></section>);continue}
    if(deliveryType(type)){used.add(section.id);body.push(<section className="home-delivery-banner" key={section.id}><div className="home-delivery-inner"><div className="home-delivery-item"><TruckIcon/><div><strong>Free Shipping</strong><small>{section.subtitle||'On orders above ₹999'}</small></div></div><div className="home-delivery-item"><GiftIcon/><div><strong>COD Available</strong><small>Cash on delivery</small></div></div><div className="home-delivery-item"><ReturnIcon/><div><strong>Easy Returns</strong><small>Hassle free</small></div></div><div className="home-delivery-item"><ShieldIcon/><div><strong>Secure Payments</strong><small>100% safe & trusted</small></div></div></div></section>);continue}
    if(bannerType(type)){used.add(section.id);body.push(<section className="split-banner" key={section.id}><div className="split-copy"><span className="eyebrow dark">{section.subtitle||'PRIYASA EDIT'}</span><h2>{section.title||'The Priyasa Edit'}</h2>{section.ctaHref&&<a className="button dark-button" href={section.ctaHref}>{section.ctaLabel||'Shop Now'} →</a>}</div><div className="split-image" style={{backgroundImage:`url(${section.imageUrl||''})`}}/></section>);continue}
    if(casualType(type)){const group=sections.filter((s:any)=>casualType(typeOf(s)));group.forEach((s:any)=>used.add(s.id));body.push(<section className="home-section" key={`casual-${section.id}`}><div className="home-section-head"><div><span className="home-kicker">{section.subtitle||'CASUAL EDIT'}</span><h2>{section.title||'Casual Vibes'}</h2></div>{section.ctaHref&&<a className="home-view-all" href={section.ctaHref}>{section.ctaLabel||'Shop Casually'} →</a>}</div><div className="home-casual-grid">{group.map((s:any)=><a className="home-casual-card" key={s.id} href={s.ctaHref||'/shop'} style={{backgroundImage:`url(${s.imageUrl||'/images/product-placeholder.svg'})`}}><div className="home-casual-copy"><strong>{s.title||'Everyday Style'}</strong><span>{s.ctaLabel||'SHOP NOW'} →</span></div></a>)}</div></section>);continue}
    if(featureType(type)){const group=sections.filter((s:any)=>featureType(typeOf(s)));group.forEach((s:any)=>used.add(s.id));body.push(<section className="home-section" key={`feature-${section.id}`}><div className="home-section-head"><div><span className="home-kicker">{section.subtitle||'PRIYASA EDIT'}</span><h2>{section.title||'Style for Every You'}</h2></div></div><div className="feature-grid feature-grid-editorial">{group.map((s:any)=><a key={s.id} href={s.ctaHref||'/shop'} className="feature" style={{backgroundImage:`linear-gradient(180deg,rgba(0,0,0,.03),rgba(0,0,0,.62)),url(${s.imageUrl||''})`}}><span className="eyebrow">{s.subtitle||'THE EDIT'}</span><h3>{s.title||'Explore the edit'}</h3><span>{s.ctaLabel||'Shop Now'} →</span></a>)}</div></section>);continue}
    used.add(section.id);body.push(<HomeCmsSection key={section.id} section={section}/>);
   }
 }
 return <div className="home-reference-v4">{body}<div className="home-centre-design"><h2>Style for Every You</h2><p>Curated fashion, thoughtful details and beautiful everyday moments — the Priyasa way.</p></div><PersonalizedRecommendations/><AffiliateHomeSection/></div>;
}
