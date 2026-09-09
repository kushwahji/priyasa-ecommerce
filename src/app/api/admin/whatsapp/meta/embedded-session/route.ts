import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireAdmin();
    const appId = process.env.META_APP_ID?.trim();
    const configId = process.env.META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID?.trim();
    const version = process.env.META_GRAPH_API_VERSION?.trim() || 'v23.0';
    if (!appId || !configId) return NextResponse.json({ error: 'Meta Embedded Signup is not configured on this server.' }, { status: 503 });

    const state = `${crypto.randomUUID()}.${session.userId}`;
    const response = NextResponse.json({ appId, configId, version, state });
    response.cookies.set('priyasa_meta_signup_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
