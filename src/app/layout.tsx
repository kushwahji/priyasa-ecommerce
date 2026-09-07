import './globals.css';
import './premium.css';
import './storefront.css';
import './priyasa-premium.css';
import './reference-ui.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthButton } from '@/components/AuthButton';
import { BrandLogo } from '@/components/BrandLogo';
import { MobileMenu } from '@/components/MobileMenu';
import { SearchIcon, UserIcon, HeartIcon, BagIcon, HomeIcon } from '@/components/StorefrontIcons';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: { default: 'PRIYASA — Every You, Beautiful', template: '%s | PRIYASA' },
  description: 'Indian fashion for every you. Discover lingerie, nightwear, ethnic wear, activewear and more.',
  openGraph: { type: 'website', title: 'PRIYASA — Every You, Beautiful', description: 'Indian fashion for every you.' }
};

const navItems = [
  ['Home','/'], ['Women','/category/women'], ['Kids','/category/kids'], ['New Arrivals','/new-arrivals'],
  ['Sale','/offers'], ['About Us','/about']
];

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>
    <div className="announcement"><span>Free Shipping on Orders Above ₹999</span><i/><span>Easy Returns</span><i/><span>Secure Payments</span></div>
    <header className="site-header">
      <MobileMenu />
      <BrandLogo />
      <nav aria-label="Primary navigation">{navItems.map(([label,href]) => <Link key={label} href={href}>{label}</Link>)}</nav>
      <div className="actions">
        <Link href="/search" aria-label="Search" className="header-icon"><SearchIcon/></Link>
        <AuthButton />
        <Link href="/wishlist" aria-label="Wishlist" className="header-icon"><HeartIcon/></Link>
        <Link href="/cart" aria-label="Shopping bag" className="header-icon"><BagIcon/></Link>
      </div>
    </header>
    <main>{children}</main>
    <footer className="footer">
      <div className="footer-brand-block"><BrandLogo href="/"/><p>Fashion for every mood, every moment and every you.</p><div className="footer-socials"><span>Instagram</span><span>Facebook</span><span>WhatsApp</span></div></div>
      <div><h4>Shop</h4><Link href="/shop">All Products</Link><Link href="/new-arrivals">New Arrivals</Link><Link href="/category/women">Women</Link><Link href="/category/kids">Kids</Link><Link href="/offers">Sale & Offers</Link></div>
      <div><h4>Help & Support</h4><Link href="/track-order">Track Order</Link><Link href="/shipping-policy">Shipping</Link><Link href="/return-refund-policy">Returns & Refund</Link><Link href="/contact">Contact Us</Link><Link href="/faq">FAQs</Link></div>
      <div><h4>About PRIYASA</h4><Link href="/about">Our Story</Link><Link href="/size-guide">Size Guide</Link><Link href="/privacy-policy">Privacy Policy</Link><Link href="/account">My Account</Link></div>
    </footer>
    <div className="copyright">© {new Date().getFullYear()} PRIYASA. All rights reserved. Made with ♥ in India.</div>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <Link href="/"><HomeIcon/><small>Home</small></Link>
      <Link href="/shop"><SearchIcon/><small>Categories</small></Link>
      <Link href="/wishlist"><HeartIcon/><small>Wishlist</small></Link>
      <Link href="/cart"><BagIcon/><small>Cart</small></Link>
      <Link href="/account"><UserIcon/><small>Account</small></Link>
    </nav>
  </body></html>
}
