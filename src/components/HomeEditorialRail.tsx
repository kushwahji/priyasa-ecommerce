import Link from 'next/link';
import type { Product } from '@/lib/catalog';

export default function HomeEditorialRail({ products, title = 'Style Edit', subtitle = 'Explore the latest looks', href = '/shop' }: { products: Product[]; title?: string; subtitle?: string; href?: string }) {
  const items = products.slice(0, 6);
  if (!items.length) return null;
  return (
    <section className="home-editorial-section home-section">
      <div className="home-section-head home-editorial-head">
        <div><span className="home-kicker">{subtitle}</span><h2>{title}</h2></div>
        <Link className="home-view-all" href={href}>View All →</Link>
      </div>
      <div className="home-editorial-rail">
        {items.map((product) => (
          <Link className="home-editorial-card" href={`/product/${encodeURIComponent(product.slug)}`} key={product.id}>
            <img src={product.image} alt={product.name} loading="lazy" />
            <span>{product.category || 'Priyasa Edit'}</span>
            <strong>{product.name}</strong>
            <b>Explore →</b>
          </Link>
        ))}
      </div>
    </section>
  );
}
