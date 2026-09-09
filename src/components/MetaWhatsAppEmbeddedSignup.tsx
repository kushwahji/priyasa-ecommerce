'use client';

import { useEffect, useRef, useState } from 'react';

type EmbeddedConfig = { appId: string; configId: string; version: string; state: string };
type FacebookResponse = { status?: string; authResponse?: { code?: string } };
type FacebookSdk = { init: (options: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void; login: (callback: (response: FacebookResponse) => void, options: Record<string, unknown>) => void };

declare global {
  interface Window { FB?: FacebookSdk; fbAsyncInit?: () => void; }
}

export default function MetaWhatsAppEmbeddedSignup({ onMessage, className }: { onMessage?: (message: string) => void; className?: string }) {
  const [config, setConfig] = useState<EmbeddedConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const loadingRef = useRef<Promise<FacebookSdk> | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch('/api/admin/whatsapp/meta/embedded-session', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Meta Embedded Signup is not configured.');
        if (active) setConfig(data);
      } catch (error) {
        if (active) onMessage?.(error instanceof Error ? error.message : 'Unable to initialize Meta connection.');
      }
    };
    void load();
    return () => { active = false; };
  }, [onMessage]);

  useEffect(() => {
    if (!config) return;
    const loadSdk = () => {
      if (window.FB) {
        window.FB.init({ appId: config.appId, cookie: true, xfbml: true, version: config.version });
        setReady(true);
        return Promise.resolve(window.FB);
      }
      if (loadingRef.current) return loadingRef.current;
      loadingRef.current = new Promise<FacebookSdk>((resolve, reject) => {
        window.fbAsyncInit = () => {
          if (!window.FB) return reject(new Error('Meta SDK loaded without Facebook Login.'));
          window.FB.init({ appId: config.appId, cookie: true, xfbml: true, version: config.version });
          setReady(true);
          resolve(window.FB);
        };
        const existing = document.getElementById('facebook-jssdk');
        if (existing) return;
        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.onerror = () => reject(new Error('Unable to load Meta Facebook SDK.'));
        document.body.appendChild(script);
      });
      return loadingRef.current;
    };
    void loadSdk().catch((error) => onMessage?.(error instanceof Error ? error.message : 'Unable to load Meta SDK.'));
  }, [config, onMessage]);

  async function launch() {
    if (!config) return onMessage?.('Meta Embedded Signup is not configured.');
    setBusy(true);
    try {
      const FB = window.FB || await loadingRef.current;
      if (!FB) throw new Error('Meta SDK is still loading. Please try again.');
      FB.login((response) => {
        const code = response.authResponse?.code;
        if (code) {
          window.location.href = `/api/admin/whatsapp/meta/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(config.state)}`;
          return;
        }
        setBusy(false);
        onMessage?.('Meta authorization was cancelled or did not return an authorization code.');
      }, {
        config_id: config.configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: { setup: {} },
      });
    } catch (error) {
      setBusy(false);
      onMessage?.(error instanceof Error ? error.message : 'Unable to open Meta authorization.');
    }
  }

  return <button className={className} type="button" onClick={() => void launch()} disabled={busy || !ready} aria-busy={busy}>
    {busy ? 'Connecting…' : ready ? 'Continue with Meta →' : 'Loading Meta…'}
  </button>;
}
