import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AuthOtpModal } from '@/components/AuthOtpModal';
import { BrandLogo } from '@/components/BrandLogo';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect('/account');

  return <main className="customer-auth-page">
    <section className="customer-auth-art"><div className="customer-auth-copy"><BrandLogo href="/"/><span className="eyebrow">EVERY YOU, BEAUTIFUL</span><h1>Fashion made<br/><em>for you.</em></h1><p>Discover styles that make every mood, moment and occasion feel beautiful.</p></div></section>
    <section className="customer-auth-panel"><div className="customer-auth-card"><BrandLogo href="/" compact/><span className="eyebrow">WELCOME TO PRIYASA</span><h1>Sign in with mobile</h1><p>Use your mobile number and verify with a secure WhatsApp OTP. No password required.</p><button className="button full-button" type="button">Continue with Mobile</button><div className="auth-benefits"><span>✓ Secure OTP login</span><span>✓ Order tracking</span><span>✓ Saved preferences</span></div><small>New to Priyasa? <Link href="/shop">Start Shopping</Link></small></div></section>
    <AuthOtpModal open={true} onClose={() => {}}/>
  </main>;
}
