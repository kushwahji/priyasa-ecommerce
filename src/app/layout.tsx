import './globals.css';
import './premium.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthButton } from '@/components/AuthButton';
import { BrandLogo } from '@/components/BrandLogo';
import { MobileMenu } from '@/components/MobileMenu';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: { default: 'PRIYASA — Every You, Beautiful', template: '%s | PRIYASA' },
  description: 'Indian fashion for every you. Discover lingerie, nightwear, ethnic wear, activewear and more.',
  openGraph: { type: 'website', title: 'PRIYASA — Every You, Beautiful', description: 'Indian fashion for every you.' }
};

const navItems = [
  ['New In','/new-arrivals'], ['Lingerie','/category/lingerie'], ['Nightwear','/category/nightwear'],
  ['Ethnic Wear','/category/ethnic-wear'], ['Activewear','/category/activewear'], ['Loungewear','/category/loungewear'],
  ['Accessories','/category/accessories'], ['Collections','/collections'], ['Offers','/offers']
];

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>
    <div className="announcement"><span>Free Shipping on Orders Above ₹999</span><i/> <span>Easy Returns</span><i/> <span>Secure Payments</span></div>
    <header className="site-header">
      <MobileMenu />
      <BrandLogo />
      <nav aria-label="Primary navigation">{navItems.map(([label,href]) => <Link key={label} href={href}>{label}</Link>)}</nav>
      <div className="actions">
        <Link href="/search" aria-label="Search" className="header-icon">⌕</Link><AuthButton/><Link href="/wishlist" aria-label="Wishlist" className="header-icon">♡</Link><Link href="/cart" aria-label="Cart" className="header-icon">▢</Link>
      </div>
    </header>
    <main>{children}</main>
    <footer className="footer">
      <div className="footer-brand-block"><BrandLogo href="/"/><p>Fashion made for confidence, comfort and every celebration.</p><div className="footer-socials"><span>Instagram</span><span>Facebook</span><span>WhatsApp</span></div></div>
      <div><h4>Shop</h4><Link href="/shop">All Products</Link><Link href="/new-arrivals">New In</Link><Link href="/category/lingerie">Lingerie</Link><Link href="/category/nightwear">Nightwear</Link><Link href="/category/ethnic-wear">Ethnic Wear</Link></div>
      <div><h4>Help</h4><Link href="/track-order">Track Order</Link><Link href="/shipping-policy">Shipping</Link><Link href="/return-refund-policy">Returns</Link><Link href="/contact">Contact Us</Link><Link href="/faq">FAQ</Link></div>
      <div><h4>About Priyasa</h4><Link href="/about">Our Story</Link><Link href="/size-guide">Size Guide</Link><Link href="/collections">Collections</Link><Link href="/account">My Account</Link></div>
    </footer>
    <div className="copyright">© {new Date().getFullYear()} PRIYASA. All rights reserved. Made with ♥ in India.</div>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link href="/"><span>⌂</span><small>Home</small></Link><Link href="/search"><span>⌕</span><small>Search</small></Link><Link href="/shop"><span>◌</span><small>Shop</small></Link><Link href="/wishlist"><span>♡</span><small>Wishlist</small></Link><Link href="/cart"><span>▢</span><small>Bag</small></Link></nav>
  </body></html>
}
