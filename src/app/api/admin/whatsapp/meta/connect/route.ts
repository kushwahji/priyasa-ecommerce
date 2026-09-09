import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || !['ADMIN', 'STAFF'].includes(session.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const appId = process.env.META_APP_ID;
  const configId = process.env.META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID;
  const redirectUri = process.env.META_WHATSAPP_EMBEDDED_SIGNUP_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/whatsapp/meta/callback`;
  const version = process.env.META_GRAPH_API_VERSION || 'v23.0';
  if (!appId || !configId || !redirectUri) return NextResponse.json({ error: 'Meta Embedded Signup is not configured on the Priyasa platform.' }, { status: 503 });

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(`https://www.facebook.com/${version}/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&config_id=${encodeURIComponent(configId)}&response_type=code`);
  response.cookies.set('priyasa_meta_signup_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600 });
  return response;
}
