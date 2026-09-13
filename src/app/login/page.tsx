import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { LoginOtpEntry } from '@/components/LoginOtpEntry';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type SearchParams = { next?: string | string[] };

function safeNext(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : '/account';
}

export default async function LoginPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = searchParams ? await searchParams : {};
  const next = safeNext(params.next);
  const session = await getSession();
  if (session) redirect(next);

  return <main className="customer-auth-page">
    <section className="customer-auth-art"><div className="customer-auth-copy"><BrandLogo href="/"/><span className="eyebrow">EVERY YOU, BEAUTIFUL</span><h1>Fashion made<br/><em>for you.</em></h1><p>Discover styles that make every mood, moment and occasion feel beautiful.</p></div></section>
    <section className="customer-auth-panel"><div className="customer-auth-card"><BrandLogo href="/" compact/><span className="eyebrow">WELCOME TO PRIYASA</span><h1>Sign in with mobile</h1><p>Use your mobile number and verify with a secure WhatsApp OTP. No password required.</p><LoginOtpEntry/><div className="auth-benefits"><span>✓ Secure OTP login</span><span>✓ Order tracking</span><span>✓ Saved preferences</span></div><small>New to Priyasa? <Link href="/shop">Start Shopping</Link></small></div></section>
  </main>;
}
