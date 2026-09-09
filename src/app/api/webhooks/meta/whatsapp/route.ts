import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateMetaWhatsAppMessage } from '@/lib/meta-whatsapp';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expected = process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  const tokenBytes = token ? Buffer.from(token) : null;
  const expectedBytes = expected ? Buffer.from(expected) : null;
  const valid = Boolean(tokenBytes && expectedBytes && tokenBytes.length === expectedBytes.length && crypto.timingSafeEqual(tokenBytes, expectedBytes));
  if (mode === 'subscribe' && valid && challenge) return new NextResponse(challenge, { status: 200 });
  return NextResponse.json({ error: 'Webhook verification failed' }, { status: 403 });
}

function extractStatuses(payload: any) {
  const result: Array<{ id: string; status: string; error?: string }> = [];
  for (const entry of Array.isArray(payload?.entry) ? payload.entry : []) {
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      const statuses = Array.isArray(change?.value?.statuses) ? change.value.statuses : [];
      for (const item of statuses) {
        if (!item?.id || !item?.status) continue;
        const errors = Array.isArray(item.errors) ? item.errors : [];
        const error = errors.map((e: any) => e?.title || e?.message || e?.code).filter(Boolean).join('; ');
        result.push({ id: String(item.id), status: String(item.status).toUpperCase(), error: error || undefined });
      }
    }
  }
  return result;
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

  try {
    const statuses = extractStatuses(payload);
    for (const status of statuses) {
      await updateMetaWhatsAppMessage(status.id, status.status, status.error);
      await db.auditLog.create({ data: { action: `WHATSAPP_MESSAGE_${status.status}`, entity: 'WhatsAppMessage', entityId: status.id, metadata: { providerMessageId: status.id, error: status.error || null } } });
    }
    if (statuses.length) {
      await db.webhookEvent.update({ where: { eventId }, data: { processed: true, processedAt: new Date(), error: null } });
    } else {
      await db.webhookEvent.update({ where: { eventId }, data: { processed: true, processedAt: new Date() } });
    }
  } catch (error) {
    await db.webhookEvent.update({ where: { eventId }, data: { processed: false, error: error instanceof Error ? error.message : 'Webhook processing failed' } }).catch(() => undefined);
    return NextResponse.json({ error: 'Webhook accepted but processing failed' }, { status: 500 });
  }
  return NextResponse.json({ received: true, processed: true });
}
