import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateMetaWhatsAppMessage } from '@/lib/meta-whatsapp';
import { recordWhatsAppInbound } from '@/lib/meta-whatsapp-conversations';

type InboundMessage = {
  phoneNumberId: string;
  from: string;
  name?: string;
  messageId: string;
  at: Date;
  preview?: string;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expected = process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  const valid = Boolean(token && expected && token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected)));

  if (mode === 'subscribe' && valid && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Webhook verification failed' }, { status: 403 });
}

function extractStatuses(payload: unknown) {
  const result: Array<{ id: string; status: string; error?: string }> = [];
  const entries = payload && typeof payload === 'object' && Array.isArray((payload as { entry?: unknown }).entry)
    ? (payload as { entry: unknown[] }).entry
    : [];

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const changes = Array.isArray((entry as { changes?: unknown }).changes) ? (entry as { changes: unknown[] }).changes : [];
    for (const change of changes) {
      if (!change || typeof change !== 'object') continue;
      const value = (change as { value?: unknown }).value;
      if (!value || typeof value !== 'object') continue;
      const statuses = Array.isArray((value as { statuses?: unknown }).statuses) ? (value as { statuses: unknown[] }).statuses : [];

      for (const item of statuses) {
        if (!item || typeof item !== 'object') continue;
        const id = (item as { id?: unknown }).id;
        const status = (item as { status?: unknown }).status;
        if (!id || !status) continue;

        const errors = Array.isArray((item as { errors?: unknown }).errors) ? (item as { errors: unknown[] }).errors : [];
        const errorParts = errors.map((error) => {
          if (!error || typeof error !== 'object') return '';
          const data = error as { title?: unknown; message?: unknown; code?: unknown };
          return String(data.title ?? data.message ?? data.code ?? '');
        }).filter(Boolean);

        result.push({
          id: String(id),
          status: String(status).toUpperCase(),
          ...(errorParts.length ? { error: errorParts.join('; ') } : {}),
        });
      }
    }
  }

  return result;
}

function extractInbound(payload: unknown): InboundMessage[] {
  const result: InboundMessage[] = [];
  const entries = payload && typeof payload === 'object' && Array.isArray((payload as { entry?: unknown }).entry)
    ? (payload as { entry: unknown[] }).entry
    : [];

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const changes = Array.isArray((entry as { changes?: unknown }).changes) ? (entry as { changes: unknown[] }).changes : [];

    for (const change of changes) {
      if (!change || typeof change !== 'object') continue;
      const value = (change as { value?: unknown }).value;
      if (!value || typeof value !== 'object') continue;

      const metadata = (value as { metadata?: unknown }).metadata;
      const phoneNumberId = metadata && typeof metadata === 'object'
        ? String((metadata as { phone_number_id?: unknown }).phone_number_id ?? '')
        : '';
      if (!phoneNumberId) continue;

      const contacts = Array.isArray((value as { contacts?: unknown }).contacts) ? (value as { contacts: unknown[] }).contacts : [];
      const names = new Map<string, string>();
      for (const contact of contacts) {
        if (!contact || typeof contact !== 'object') continue;
        const waId = String((contact as { wa_id?: unknown }).wa_id ?? '');
        const profile = (contact as { profile?: unknown }).profile;
        const name = profile && typeof profile === 'object' ? String((profile as { name?: unknown }).name ?? '') : '';
        if (waId && name) names.set(waId, name);
      }

      const messages = Array.isArray((value as { messages?: unknown }).messages) ? (value as { messages: unknown[] }).messages : [];
      for (const message of messages) {
        if (!message || typeof message !== 'object') continue;
        const messageId = String((message as { id?: unknown }).id ?? '');
        const rawFrom = String((message as { from?: unknown }).from ?? '');
        if (!messageId || !rawFrom) continue;

        const type = String((message as { type?: unknown }).type ?? 'unknown');
        const text = (message as { text?: unknown }).text;
        const preview = type === 'text' && text && typeof text === 'object'
          ? String((text as { body?: unknown }).body ?? '')
          : `[${type} message]`;
        const rawTimestamp = String((message as { timestamp?: unknown }).timestamp ?? '');
        const timestampSeconds = Number(rawTimestamp);
        const at = Number.isFinite(timestampSeconds) && timestampSeconds > 0
          ? new Date(timestampSeconds * 1000)
          : new Date();
        const from = rawFrom.replace(/\D/g, '');
        if (!from) continue;

        const item: InboundMessage = {
          phoneNumberId,
          from,
          messageId,
          at,
          preview: preview.slice(0, 500),
        };
        const name = names.get(rawFrom);
        if (name) item.name = name;
        result.push(item);
      }
    }
  }

  return result;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get('x-hub-signature-256') || '';
  const secret = process.env.META_APP_SECRET;

  if (!secret || !signature.startsWith('sha256=')) {
    return NextResponse.json({ error: 'Webhook signature is not configured' }, { status: 503 });
  }

  const expected = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
  const received = signature.slice('sha256='.length);
  if (received.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventId = crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
  const eventType = payload && typeof payload === 'object'
    ? String((payload as { object?: unknown }).object ?? 'whatsapp_business_account')
    : 'whatsapp_business_account';

  try {
    await db.webhookEvent.create({
      data: {
        provider: 'meta_whatsapp',
        eventId,
        eventType,
        payload: payload as object,
      },
    });
  } catch (error) {
    const duplicate = error instanceof Error && /unique|duplicate/i.test(error.message);
    if (!duplicate) return NextResponse.json({ error: 'Webhook persistence failed' }, { status: 500 });
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    const statuses = extractStatuses(payload);
    for (const status of statuses) {
      await updateMetaWhatsAppMessage(status.id, status.status, status.error);
      await db.auditLog.create({
        data: {
          action: `WHATSAPP_MESSAGE_${status.status}`,
          entity: 'WhatsAppMessage',
          entityId: status.id,
          metadata: { providerMessageId: status.id, error: status.error ?? null },
        },
      });
    }

    const inbound = extractInbound(payload);
    for (const message of inbound) {
      const conversationId = await recordWhatsAppInbound({
        phoneNumberId: message.phoneNumberId,
        customerPhone: message.from,
        customerName: message.name,
        preview: message.preview,
        at: message.at,
      });
      await db.auditLog.create({
        data: {
          action: 'WHATSAPP_INBOUND_MESSAGE',
          entity: 'WhatsAppConversation',
          entityId: conversationId,
          metadata: { providerMessageId: message.messageId, from: message.from },
        },
      });
    }

    await db.webhookEvent.update({
      where: { eventId },
      data: { processed: true, processedAt: new Date(), error: null },
    });
  } catch (error) {
    await db.webhookEvent.update({
      where: { eventId },
      data: {
        processed: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      },
    }).catch(() => undefined);
    return NextResponse.json({ error: 'Webhook accepted but processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true, processed: true });
}
