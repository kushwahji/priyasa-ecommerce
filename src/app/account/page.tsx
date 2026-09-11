import Link from 'next/link';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { UserIcon, GiftIcon, HeartIcon, BagIcon, MapPinIcon, HelpIcon, WalletIcon, ReturnIcon, CreditCardIcon, ChevronIcon } from '@/components/StorefrontIcons';

const accountItems = [
  ['Orders', '/account/orders', BagIcon, 'Track, cancel or manage purchases'],
  ['Wishlist', '/wishlist', HeartIcon, 'Saved styles and favourites'],
  ['Priyasa Privé', '/offers', GiftIcon, 'Exclusive benefits and coupons'],
  ['Coupons & Offers', '/offers', GiftIcon, 'Save more on your next order'],
  ['Wallet', '/account/wallet', WalletIcon, 'Credits and wallet balance'],
  ['Addresses', '/account/addresses', MapPinIcon, 'Manage delivery addresses'],
  ['Payment Methods', '/account/payment-methods', CreditCardIcon, 'Manage saved payment methods'],
  ['Returns & Exchanges', '/account/returns', ReturnIcon, 'Manage eligible returns'],
  ['Help Centre', '/help', HelpIcon, 'Orders, payments and support'],
] as const;

type UserWithCounts = { id:string; name:string|null; phone:string; email:string|null; createdAt:Date; _count:{orders:number;addresses:number;notifications:number} };

async function getCurrentUser(): Promise<UserWithCounts|null> {
  try {
    const jar = await cookies();
    const id = jar.get('priyasa_local_user_id')?.value;
    const phone = jar.get('priyasa_mobile')?.value;
    if (!id && !phone) return null;
    if (id) return await db.user.findUnique({where:{id},include:{_count:{select:{orders:true,addresses:true,notifications:true}}}}) as UserWithCounts|null;
    return await db.user.findUnique({where:{phone:phone!},include:{_count:{select:{orders:true,addresses:true,notifications:true}}}}) as UserWithCounts|null;
  } catch {
    return null;
  }
}

function BackArrow(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>}

function AccountMobileHead(){return <div className="account-mobile-head"><Link href="/" aria-label="Back to home" className="account-back"><BackArrow/></Link><strong>My Account</strong><Link href="/wishlist" aria-label="Wishlist" className="account-head-icon"><HeartIcon/></Link><Link href="/cart" aria-label="Shopping bag" className="account-head-icon"><BagIcon/></Link></div>}

function GuestAccount(){
  return <div className="account-shell premium-account nykaa-account-v2">
    <AccountMobileHead/>
    <section className="account-welcome-card"><div className="account-welcome-copy"><span className="account-eyebrow">WELCOME TO PRIYASA</span><h1>Everything you love,<br/><em>in one place.</em></h1><p>Sign in to track orders, save your favourites, manage addresses and unlock personalised offers.</p><Link href="/login" className="account-primary-cta">Login / Sign up <ChevronIcon/></Link></div><div className="account-welcome-art"><UserIcon/></div></section>
    <section className="account-quick-grid" aria-label="Account shortcuts"><Link href="/account/orders"><BagIcon/><strong>Orders</strong><span>Track purchases</span></Link><Link href="/wishlist"><HeartIcon/><strong>Wishlist</strong><span>Saved styles</span></Link><Link href="/offers"><GiftIcon/><strong>Offers</strong><span>Deals & coupons</span></Link><Link href="/help"><HelpIcon/><strong>Help Centre</strong><span>We're here to help</span></Link></section>
    <section className="account-mobile-links"><div className="account-section-heading"><span className="account-eyebrow">MANAGE</span><h2>Your Priyasa account</h2></div>{accountItems.slice(2).map(([label,href,Icon,desc])=><Link href={href} key={label}><span className="account-link-icon"><Icon/></span><span><strong>{label}</strong><small>{desc}</small></span><ChevronIcon/></Link>)}</section>
  </div>;
}

function LoggedInAccount({user}:{user:UserWithCounts}){
  const initial=(user.name||user.phone||'P').trim().charAt(0).toUpperCase();
  return <div className="account-shell premium-account nykaa-account-v2">
    <AccountMobileHead/>
    <div className="account-v2-layout">
      <aside className="account-v2-sidebar"><div className="account-profile-mini"><span>{initial}</span><div><strong>{user.name||'Priyasa Customer'}</strong><small>{user.phone}</small><em>Verified member</em></div></div><nav aria-label="Account navigation">{accountItems.map(([label,href,Icon])=><Link href={href} key={label}><Icon/><span>{label}</span><ChevronIcon/></Link>)}<Link className="active" href="/account"><UserIcon/><span>Profile</span><ChevronIcon/></Link></nav></aside>
      <main className="account-v2-main"><div className="account-v2-heading"><div><span className="account-eyebrow">MY PRIYASA</span><h1>Welcome back{user.name?`, ${user.name.split(' ')[0]}`:''}</h1><p>Manage your shopping, orders and account preferences.</p></div><Link href="/account/edit" className="account-outline-cta">Edit Profile</Link></div>
        <div className="account-stat-grid"><Link href="/account/orders"><BagIcon/><span><small>ORDERS</small><strong>{user._count.orders}</strong><em>View purchases</em></span><ChevronIcon/></Link><Link href="/wishlist"><HeartIcon/><span><small>WISHLIST</small><strong>Saved styles</strong><em>Shop favourites</em></span><ChevronIcon/></Link><Link href="/account/addresses"><MapPinIcon/><span><small>ADDRESSES</small><strong>{user._count.addresses}</strong><em>Delivery locations</em></span><ChevronIcon/></Link><Link href="/account/wallet"><WalletIcon/><span><small>WALLET</small><strong>View balance</strong><em>Use at checkout</em></span><ChevronIcon/></Link></div>
        <section className="account-v2-card account-profile-card"><div className="account-large-avatar">{initial}</div><div><span className="account-eyebrow">MEMBER PROFILE</span><h2>{user.name||'Priyasa Customer'}</h2><p>{user.phone}{user.email?` · ${user.email}`:''}</p><b>✓ Mobile verified</b></div><Link href="/account/edit">Manage profile →</Link></section>
        <section className="account-v2-card"><div className="account-section-heading"><div><span className="account-eyebrow">QUICK ACCESS</span><h2>Shopping & support</h2></div></div><div className="account-v2-link-grid">{accountItems.map(([label,href,Icon,desc])=><Link href={href} key={label}><span><Icon/></span><strong>{label}</strong><small>{desc}</small></Link>)}</div></section>
        <section className="account-v2-card account-details-card"><div className="account-section-heading"><div><span className="account-eyebrow">YOUR DETAILS</span><h2>Personal information</h2></div><Link href="/account/edit">Edit</Link></div><div className="account-detail-grid"><div><small>Full name</small><strong>{user.name||'Not added'}</strong></div><div><small>Mobile number</small><strong>{user.phone}</strong></div><div><small>Email</small><strong>{user.email||'Not added'}</strong></div><div><small>Member since</small><strong>{new Date(user.createdAt).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</strong></div></div></section>
        <section className="account-security-strip"><div><span className="account-eyebrow">ACCOUNT SECURITY</span><strong>Protected by mobile OTP</strong><p>Your sign-in uses verified mobile authentication. Sensitive credentials are never displayed here.</p></div><Link href="/privacy-policy">Privacy & Security →</Link></section>
      </main>
    </div>
  </div>;
}

export default async function Account(){const user=await getCurrentUser();return user?<LoggedInAccount user={user}/>:<GuestAccount/>;}
