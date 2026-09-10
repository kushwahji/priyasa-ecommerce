import Link from 'next/link';
import {BrandLogo} from '@/components/BrandLogo';
import {AppDownloadBadges} from '@/components/AppDownloadBadges';
import {NewsletterForm} from '@/components/NewsletterForm';

const groups = [
  {title:'Shop', items:[['Women','/category/women'],['Men','/category/men'],['Kids','/category/kids'],['New Arrivals','/new-arrivals'],['Sale & Offers','/offers'],['Collections','/collections']]},
  {title:'Customer Care', items:[['Track Order','/track-order'],['Shipping Policy','/shipping-policy'],['Returns & Refunds','/return-refund-policy'],['Cancellation Policy','/cancellation-policy'],['FAQs','/faq'],['Contact Us','/contact'],['Help Centre','/help']]},
  {title:'About Priyasa', items:[['Our Story','/about'],['Size Guide','/size-guide'],['My Account','/account'],['Priyasa Wallet','/account/wallet'],['Returns & Exchanges','/account/returns'],['Privacy Policy','/privacy-policy'],['Terms & Conditions','/terms-and-conditions']]},
];

export default function PriyasaFooter(){
  return <>
    <section className="priyasa-thank-you" aria-label="Thank you">
      <div className="priyasa-thank-you-inner">
        <div className="priyasa-thank-you-copy">
          <span>THANK YOU FOR VISITING</span>
          <h2>Every You,<br/><em>Beautiful.</em></h2>
          <p>We’re happy to have you here. Discover something beautiful for every mood, moment and you.</p>
          <Link href="/shop" className="priyasa-footer-cta">Continue Shopping <b>→</b></Link>
        </div>
        <div className="priyasa-thank-you-art">
          <img src="/images/thank-you.svg" alt="Thank you for choosing Priyasa"/>
          <BrandLogo href="/" placement="footer"/>
        </div>
      </div>
    </section>

    <footer className="priyasa-footer">
      <div className="priyasa-footer-newsletter">
        <div><span className="footer-eyebrow">PRIYASA EDIT</span><h2>Stay in the know.</h2><p>Get new arrivals, private offers and style updates delivered to your inbox.</p></div>
        <NewsletterForm/>
      </div>
      <div className="priyasa-footer-main">
        <div className="priyasa-footer-brand">
          <BrandLogo href="/" placement="footer"/>
          <p>Fashion for every mood, every moment and every you.</p>
          <div className="priyasa-footer-address"><span>PRIYASA INDIA</span><p>KM34 JP Noida, GB Nagar<br/>201304 UP, India</p></div>
          <div className="priyasa-footer-socials" aria-label="Social links"><a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook">f</a><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">◎</a><a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube">▶</a></div>
        </div>
        <nav className="priyasa-footer-links" aria-label="Footer navigation">
          {groups.map(group=><details key={group.title} open><summary>{group.title}<span>+</span></summary><div className="priyasa-footer-link-list">{group.items.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}</div></details>)}
        </nav>
        <div className="priyasa-footer-app"><span className="footer-eyebrow">SHOP ANYWHERE</span><h3>Download the Priyasa app</h3><p>Faster checkout, order tracking and exclusive app-only offers.</p><AppDownloadBadges/><div className="footer-payment-title">Secure payments</div><div className="footer-payment-row" aria-label="Payment methods"><span>VISA</span><span>UPI</span><span>RuPay</span><span>MC</span><span>AMEX</span></div></div>
      </div>
      <div className="priyasa-footer-bottom"><span>© {new Date().getFullYear()} PRIYASA. All Rights Reserved.</span><span>Made with ♥ in India</span><span>Secure • Private • Trusted</span></div>
    </footer>
  </>;
}
