import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { encryptMetaToken, saveMetaWhatsAppConnection } from '@/lib/meta-whatsapp';

async function graph(version: string, path: string, token: string, init?: RequestInit) {
  const response = await fetch(`https://graph.facebook.com/${version}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Meta Graph request failed (${response.status})`);
  return data;
}

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
  if (!appId || !appSecret || !redirectUri) return NextResponse.redirect(new URL('/admin/whatsapp?meta=platform_not_configured', req.url));

  try {
    const tokenUrl = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);
    const tokenResponse = await fetch(tokenUrl, { cache: 'no-store' });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token) throw new Error('Meta token exchange failed');

    const accessToken = String(token.access_token);
    const debug = await graph(version, `debug_token?input_token=${encodeURIComponent(accessToken)}`, `${appId}|${appSecret}`);
    const tokenData = debug?.data;
    if (!tokenData?.is_valid || tokenData.app_id !== appId) throw new Error('Meta returned an invalid application token');
    const granular = Array.isArray(tokenData.granular_scopes) ? tokenData.granular_scopes : [];
    const whatsappScope = granular.find((item: { scope?: string }) => item.scope === 'whatsapp_business_management');
    const targetIds = Array.isArray(whatsappScope?.target_ids) ? whatsappScope.target_ids : [];
    const wabaId = String(targetIds[0] || '');
    if (!wabaId) throw new Error('Meta did not return a shared WhatsApp Business Account');

    const waba = await graph(version, `${wabaId}?fields=id,name,account_review_status,currency,timezone_id,message_template_namespace`, accessToken);
    const phones = await graph(version, `${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name`, accessToken);
    const phone = Array.isArray(phones?.data) ? phones.data[0] : null;
    if (!phone?.id) throw new Error('No WhatsApp phone number was returned for this business account');

    await graph(version, `${wabaId}/subscribed_apps`, accessToken, { method: 'POST' });

    await saveMetaWhatsAppConnection({
      id: crypto.randomUUID(),
      userId: session.userId,
      accessTokenEncrypted: encryptMetaToken(accessToken),
      wabaId,
      phoneNumberId: String(phone.id),
      phoneNumber: phone.display_phone_number ? String(phone.display_phone_number) : null,
      businessName: waba?.name ? String(waba.name) : (phone.verified_name ? String(phone.verified_name) : null),
      status: 'CONNECTED',
      connectedAt: new Date(),
    });

    const destination = new URL('/admin/whatsapp?meta=connected', req.url);
    const response = NextResponse.redirect(destination);
    response.cookies.delete('priyasa_meta_signup_state');
    return response;
  } catch (error) {
    const destination = new URL('/admin/whatsapp?meta=callback_failed', req.url);
    destination.searchParams.set('reason', error instanceof Error ? error.message.slice(0, 160) : 'unknown');
    const response = NextResponse.redirect(destination);
    response.cookies.delete('priyasa_meta_signup_state');
    return response;
  }
}
