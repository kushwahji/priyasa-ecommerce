import Link from 'next/link';
import { UserIcon, GiftIcon, HeartIcon, BagIcon, MapPinIcon, BellIcon, HelpIcon, CreditCardIcon } from '@/components/StorefrontIcons';

const items=[['My Orders','/account/orders',BagIcon],['My Addresses','/account/addresses',MapPinIcon],['My Wishlist','/wishlist',HeartIcon],['My Wallet','/account/wallet',CreditCardIcon],['Coupons & Offers','/offers',GiftIcon],['Notifications','/account/notifications',BellIcon],['Help & Support','/faq',HelpIcon]] as const;

export default function Account(){return <div className="account-shell">
  <div className="breadcrumbs"><Link href="/">Home</Link><span> / </span> My Account</div>
  <div className="account-layout">
    <aside className="account-sidebar">
      <div className="profile-mini"><div className="account-avatar">PS</div><div><strong>Priyasa Customer</strong><small>Welcome back</small></div></div>
      {items.map(([label,href,Icon])=><Link key={label} href={href}><Icon width={17} height={17}/><span>{label}</span></Link>)}
      <Link className="active" href="/account"><UserIcon width={17} height={17}/><span>Profile</span><b>›</b></Link>
    </aside>
    <section>
      <div className="account-main-head"><div><span className="eyebrow">MY PRIYASA</span><h1>Profile</h1></div><Link className="button" href="/account/edit">Edit Profile</Link></div>
      <div className="account-card profile-summary"><div className="profile-avatar-large">PS</div><div><h2>Priyasa Customer</h2><p>Welcome to your Priyasa account.</p><span className="account-phone">Mobile number verified</span></div></div>
      <div className="account-card"><h2>Personal Information</h2><div className="account-info-grid"><div className="account-info-item"><small>Full Name</small><strong>Priyasa Customer</strong></div><div className="account-info-item"><small>Email</small><strong>customer@priyasa.com</strong></div><div className="account-info-item"><small>Mobile Number</small><strong>+91 ••••• •••••</strong></div><div className="account-info-item"><small>Gender</small><strong>Not specified</strong></div></div></div>
      <div className="account-card"><h2>Quick Links</h2><div className="quick-links"><Link className="quick-link" href="/account/orders"><BagIcon width={22} height={22}/><strong>My Orders</strong></Link><Link className="quick-link" href="/account/addresses"><MapPinIcon width={22} height={22}/><strong>My Addresses</strong></Link><Link className="quick-link" href="/wishlist"><HeartIcon width={22} height={22}/><strong>Wishlist</strong></Link><Link className="quick-link" href="/account/wallet"><CreditCardIcon width={22} height={22}/><strong>Wallet</strong></Link></div></div>
      <div className="account-card"><h2>Account & Security</h2><p className="muted">Your Priyasa account uses secure phone OTP authentication. Manage your profile, saved addresses, orders and preferences.</p><Link className="button outline" href="/privacy-policy">Privacy & Security</Link></div>
    </section>
  </div>
</div>}
