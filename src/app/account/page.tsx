import Link from 'next/link';
import { UserIcon, GiftIcon, HeartIcon, BagIcon, MapPinIcon, BellIcon, HelpIcon } from '@/components/StorefrontIcons';

const items=[['My Orders','/account/orders',BagIcon],['My Addresses','/account/addresses',MapPinIcon],['My Wishlist','/wishlist',HeartIcon],['Coupons & Offers','/offers',GiftIcon],['Notifications','/account/notifications',BellIcon],['Help & Support','/faq',HelpIcon]] as const;

export default function Account(){return <div className="account-shell">
  <div className="breadcrumbs"><Link href="/">Home</Link> <span> / </span> My Account</div>
  <div className="account-layout">
    <aside className="account-sidebar">
      <div className="profile-mini"><strong>Priyasa Customer</strong><small>Welcome back</small></div>
      {items.map(([label,href,Icon])=><Link key={label} href={href}><Icon width={17} height={17}/>{label}</Link>)}
      <Link className="active" href="/account"><UserIcon width={17} height={17}/>Profile</Link>
    </aside>
    <section>
      <div className="account-main-head"><div><span className="eyebrow">MY PRIYASA</span><h1>My Profile</h1></div><Link className="button" href="/account/edit">Edit Profile</Link></div>
      <div className="account-card"><h2>Personal Information</h2><div className="account-info-grid"><div className="account-info-item"><small>Full Name</small><strong>Priyasa Customer</strong></div><div className="account-info-item"><small>Email</small><strong>customer@priyasa.com</strong></div><div className="account-info-item"><small>Mobile Number</small><strong>+91 ••••• •••••</strong></div><div className="account-info-item"><small>Gender</small><strong>Not specified</strong></div></div></div>
      <div className="account-card"><h2>Quick Links</h2><div className="quick-links">{items.slice(0,4).map(([label,href,Icon])=><Link className="quick-link" key={label} href={href}><Icon width={22} height={22}/><div>{label}</div></Link>)}</div></div>
      <div className="account-card"><h2>Account & Security</h2><p className="muted">Your Priyasa account uses secure phone OTP authentication. Update your profile and manage your saved addresses, orders and preferences.</p><Link className="button outline" href="/privacy-policy">Privacy & Security</Link></div>
    </section>
  </div>
</div>}
