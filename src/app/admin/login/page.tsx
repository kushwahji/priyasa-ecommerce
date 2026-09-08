'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const r = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Login failed');
      router.replace('/admin');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-brand"><span>P</span><div><strong>PRIYASA</strong><small>COMMERCE OS</small></div></div>
      <section className="admin-login-hero"><span>PRIYASA COMMERCE OS</span><h1>Run your store<br/><em>beautifully.</em></h1><p>Products, orders, customers, marketing, fulfillment and finance — one control centre.</p><div className="admin-login-points"><b>✓ Live commerce operations</b><b>✓ Secure role-based access</b><b>✓ Mobile-ready workspace</b></div></section>
      <form className="admin-login-card" onSubmit={submit}>
        <div className="admin-login-mark">P</div>
        <span className="eyebrow">ADMIN ACCESS</span>
        <h1>Welcome back</h1>
        <p>Sign in with your authorized admin account.</p>
        <label>Email<input className="input" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Password<input className="input" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
        {error && <p className="admin-login-error" role="alert">{error}</p>}
        <button className="button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to Commerce OS →'}</button>
        <small>Authorized personnel only · Priyasa Commerce</small>
      </form>
    </div>
  );
}
