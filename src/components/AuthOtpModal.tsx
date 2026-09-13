'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon } from '@/components/StorefrontIcons';
type Step = 'phone' | 'otp';
type VerifyResult = { success?: boolean; data?: { success?: boolean; token?: string; access_token?: string; user?: { id?: number; mobile?: string }; message?: string; request_id?: string }; message?: string; errors?: Record<string, string[]> };
const key = 'priyasa_device_id';
const getDeviceId = () => { let id = localStorage.getItem(key); if (!id) { id = `web-${crypto.randomUUID()}`; localStorage.setItem(key, id); } return id; };
async function jsonFetch(path: string, body: unknown) { const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) }); const data = await r.json().catch(() => ({ message: 'Unexpected server response. Please try again.' })); return { ok: r.ok, data }; }

export function AuthOtpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>('phone'), [mobile, setMobile] = useState(''), [otp, setOtp] = useState(''), [requestId, setRequestId] = useState(''), [cooldown, setCooldown] = useState(0), [loading, setLoading] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]); const normalized = useMemo(() => mobile.replace(/\D/g, '').slice(-10), [mobile]);
  useEffect(() => { if (cooldown <= 0) return; const t = setInterval(() => setCooldown((v) => Math.max(0, v - 1)), 1000); return () => clearInterval(t); }, [cooldown]);
  useEffect(() => { if (!open) { setStep('phone'); setOtp(''); setRequestId(''); setError(''); setMessage(''); setLoading(false); } }, [open]);
  useEffect(() => { if (!open) return; const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [open, loading, onClose]);
  useEffect(() => { if (open && step === 'otp') window.setTimeout(() => otpRefs.current[0]?.focus(), 40); }, [open, step]);
  if (!open) return null;

  const sendOtp = async () => {
    setError(''); setMessage(''); if (!/^\d{10}$/.test(normalized)) { setError('Enter a valid 10-digit mobile number.'); return; }
    setLoading(true); setMessage('Sending OTP securely…');
    try {
      const r = await jsonFetch('/api/auth/send-otp', { mobile: normalized, country_code: '+91', device_token: 'web', device_id: getDeviceId(), purpose: 'login', channel: 'whatsapp', app_version: '1.0.0', platform: 'web' });
      const d = r.data as any; if (!r.ok || d.data?.success === false) { setMessage(''); setError(d.data?.message || d.message || 'Unable to send OTP. Please try again.'); return; }
      setRequestId(d.data?.request_id || d.request_id || ''); setCooldown(Number(d.data?.retry_after || 30)); setStep('otp'); setMessage(d.data?.message || d.message || 'OTP sent successfully on WhatsApp.');
    } catch { setMessage(''); setError('Network error while sending OTP. Please try again.'); } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setError(''); setMessage(''); if (!/^\d{4,8}$/.test(otp)) { setError('Enter the OTP you received.'); return; } if (!requestId) { setError('OTP request has expired. Please request a new OTP.'); return; }
    setLoading(true); setMessage('Verifying OTP securely…');
    try {
      const r = await jsonFetch('/api/auth/verify-otp', { mobile: normalized, otp, request_id: requestId, device_token: 'web', device_id: getDeviceId(), app_version: '1.0.0', platform: 'web' });
      const d = r.data as VerifyResult; if (!r.ok || !d.data?.success) { setMessage(''); setError(d.data?.message || d.message || d.errors?.otp?.[0] || 'OTP verification failed. Please check the code and try again.'); return; }
      setMessage('OTP verified. Signing you in…'); window.setTimeout(() => { onClose(); window.location.reload(); }, 450);
    } catch { setMessage(''); setError('Network error while verifying OTP. Please try again.'); } finally { setLoading(false); }
  };

  const resend = async () => {
    if (cooldown > 0 || loading) return;
    // Reuse the supported send-OTP contract instead of calling an undocumented
    // /resend-otp endpoint. The Core API controls its own retry policy.
    setError(''); setMessage('Sending a new OTP…'); setLoading(true);
    try {
      const r = await jsonFetch('/api/auth/send-otp', { mobile: normalized, country_code: '+91', device_token: 'web', device_id: getDeviceId(), purpose: 'login', channel: 'whatsapp', app_version: '1.0.0', platform: 'web' });
      const d = r.data as any; if (!r.ok || d.data?.success === false) { setMessage(''); setError(d.data?.message || d.message || 'Unable to resend OTP. Please try again.'); return; }
      setRequestId(d.data?.request_id || d.request_id || requestId); setCooldown(Number(d.data?.retry_after || 30)); setMessage(d.data?.message || d.message || 'New OTP sent successfully.');
    } catch { setMessage(''); setError('Network error while resending OTP.'); } finally { setLoading(false); }
  };
  const cancel = () => { if (!loading) onClose(); };
  const setDigit = (index: number, value: string) => { const digits = value.replace(/\D/g, '').slice(0, 6); if (!digits) return; const next = (otp.slice(0, index) + digits + otp.slice(index + digits.length)).slice(0, 6); setOtp(next); otpRefs.current[Math.min(index + digits.length, 5)]?.focus(); };
  const handlePaste = (e: React.ClipboardEvent) => { e.preventDefault(); const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); if (!digits) return; setOtp(digits); otpRefs.current[Math.min(digits.length, 6) - 1]?.focus(); };
  const clearAt = (index: number) => { if (otp[index]) { setOtp(otp.slice(0, index) + otp.slice(index + 1)); return; } if (index > 0) { const next = otp.slice(0, index - 1) + otp.slice(index); setOtp(next); otpRefs.current[index - 1]?.focus(); } };

  return <div className="otp-backdrop" role="dialog" aria-modal="true" aria-label="Priyasa login" onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) cancel(); }}>
    <div className="otp-modal">
      <button type="button" className="otp-close" onClick={cancel} aria-label="Close">×</button>
      <div className="otp-brand"><img src="/images/priyasa-logo.svg" alt="PRIYASA" width={122} height={32}/></div>
      <div className="eyebrow">{step === 'phone' ? 'WELCOME TO PRIYASA' : 'SECURE VERIFICATION'}</div>
      <h2>{step === 'phone' ? 'Welcome Back' : 'Verify Your Phone'}</h2>
      <p className="muted">{step === 'phone' ? 'Login or create your Priyasa account with your mobile number.' : `We have sent a 6-digit OTP to +91 ${normalized}.`}</p>
      {step === 'phone' ? <>
        <label>Mobile number<div className="otp-phone"><span>+91</span><input autoFocus inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} placeholder="Enter your mobile number"/></div></label>
        <button type="button" className="button otp-submit" disabled={loading} onClick={sendOtp}>{loading ? <><span className="otp-spinner"/>Sending OTP…</> : 'Send OTP'}</button>
      </> : <>
        <label>Enter OTP</label><div className="otp-digits" onPaste={handlePaste}>{Array.from({ length: 6 }).map((_, i) => <input key={i} ref={(el) => { otpRefs.current[i] = el; }} className="otp-digit" inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={1} value={otp[i] || ''} onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => { if (e.key === 'Backspace') clearAt(i); if (e.key === 'ArrowLeft' && i > 0) otpRefs.current[i - 1]?.focus(); if (e.key === 'ArrowRight' && i < 5) otpRefs.current[i + 1]?.focus(); }} aria-label={`OTP digit ${i + 1}`}/>)}</div>
        <button type="button" className="button otp-submit" disabled={loading} onClick={verifyOtp}>{loading ? <><span className="otp-spinner"/>Verifying OTP…</> : 'Verify & Login'}</button>
        <div className="otp-meta"><button type="button" className="otp-link" disabled={loading || cooldown > 0} onClick={resend}>{cooldown > 0 ? `Resend OTP in 00:${String(cooldown).padStart(2, '0')}` : 'Resend OTP'}</button><button type="button" className="otp-link" disabled={loading} onClick={() => { setStep('phone'); setOtp(''); setError(''); setMessage(''); }}>Change number</button></div>
      </>}
      {message && <div className="otp-status success" role="status" aria-live="polite">{loading && <span className="otp-spinner"/>}<CheckIcon/>{message}</div>}{error && <div className="otp-status error" role="alert">{error}</div>}
      <small className="otp-foot">By continuing, you agree to Priyasa's Terms & Privacy Policy.</small>
    </div>
  </div>;
}
