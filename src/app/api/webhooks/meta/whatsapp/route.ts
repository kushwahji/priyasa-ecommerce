import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expected = process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (mode === 'subscribe' && token && expected && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected)) && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Webhook verification failed' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get('x-hub-signature-256') || '';
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signature.startsWith('sha256=')) return NextResponse.json({ error: 'Webhook signature is not configured' }, { status: 503 });

  const expected = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
  const received = signature.slice('sha256='.length);
  if (received.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))) return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });

  let payload: unknown;
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const eventId = crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
  const eventType = typeof payload === 'object' && payload && 'object' in payload ? String((payload as { object?: unknown }).object || 'whatsapp_business_account') : 'whatsapp_business_account';

  try {
    await db.webhookEvent.create({ data: { provider: 'meta_whatsapp', eventId, eventType, payload: payload as object } });
  } catch (error) {
    const duplicate = error instanceof Error && /unique|duplicate/i.test(error.message);
    if (!duplicate) return NextResponse.json({ error: 'Webhook persistence failed' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
