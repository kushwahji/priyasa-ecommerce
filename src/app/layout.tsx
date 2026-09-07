import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: { default: 'PRIYASA — Every You, Beautiful', template: '%s | PRIYASA' },
  description: 'Indian fashion for every you. Discover lingerie, nightwear, ethnic wear, activewear and more.',
  openGraph: { type: 'website', title: 'PRIYASA — Every You, Beautiful', description: 'Indian fashion for every you.' }
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>
    <div className="announcement">Free Shipping on Orders Above ₹999 <span>•</span> Easy Returns <span>•</span> Secure Payments</div>
    <header className="site-header">
      <Link href="/" className="brand"><strong>PRIYASA</strong><small>Every You, Beautiful</small></Link>
      <nav>{['New In','Lingerie','Nightwear','Ethnic Wear','Activewear','Loungewear','Accessories','Collections','Offers'].map(x => <Link key={x} href={x==='New In'?'/new-arrivals':x==='Ethnic Wear'?'/category/ethnic-wear':x==='Offers'?'/offers':`/category/${x.toLowerCase().replaceAll(' ','-')}`}>{x}</Link>)}</nav>
      <div className="actions"><Link href="/search">⌕</Link><Link href="/account">♙</Link><Link href="/wishlist">♡</Link><Link href="/cart">🛒</Link></div>
    </header>
    <main>{children}</main>
    <footer className="footer"><div><div className="brand"><strong>PRIYASA</strong><small>Every You, Beautiful</small></div><p>Fashion made for confidence, comfort and every celebration.</p></div><div><h4>Shop</h4><Link href="/category/lingerie">Lingerie</Link><Link href="/category/nightwear">Nightwear</Link><Link href="/category/ethnic-wear">Ethnic Wear</Link><Link href="/new-arrivals">New In</Link></div><div><h4>Help</h4><Link href="/track-order">Track Order</Link><Link href="/shipping-policy">Shipping</Link><Link href="/return-refund-policy">Returns</Link><Link href="/contact">Contact Us</Link></div><div><h4>About</h4><Link href="/about">Our Story</Link><Link href="/size-guide">Size Guide</Link><Link href="/faq">FAQ</Link></div></footer>
    <div className="copyright">© {new Date().getFullYear()} PRIYASA. All rights reserved. Made with ♥ in India.</div>
  </body></html>
}
