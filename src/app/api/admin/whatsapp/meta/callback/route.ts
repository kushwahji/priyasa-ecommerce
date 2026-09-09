import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['ADMIN', 'STAFF'].includes(session.role)) return NextResponse.redirect(new URL('/admin/whatsapp?meta=unauthorized', req.url));
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = req.cookies.get('priyasa_meta_signup_state')?.value;
  if (!code || !state || !savedState || state !== savedState) return NextResponse.redirect(new URL('/admin/whatsapp?meta=invalid_state', req.url));

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_WHATSAPP_EMBEDDED_SIGNUP_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/whatsapp/meta/callback`;
  const version = process.env.META_GRAPH_API_VERSION || 'v23.0';
  if (!appId || !appSecret) return NextResponse.redirect(new URL('/admin/whatsapp?meta=platform_not_configured', req.url));

  try {
    const tokenUrl = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);
    const tokenResponse = await fetch(tokenUrl, { cache: 'no-store' });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token) return NextResponse.redirect(new URL('/admin/whatsapp?meta=token_exchange_failed', req.url));

    // The returned user token is intentionally not sent to the browser. The production
    // persistence layer should encrypt it and associate the connection with the admin's
    // tenant before using it for WABA discovery and subscription.
    const destination = new URL('/admin/whatsapp?meta=connected', req.url);
    destination.searchParams.set('signup_token_received', '1');
    const response = NextResponse.redirect(destination);
    response.cookies.delete('priyasa_meta_signup_state');
    return response;
  } catch {
    return NextResponse.redirect(new URL('/admin/whatsapp?meta=callback_failed', req.url));
  }
}
