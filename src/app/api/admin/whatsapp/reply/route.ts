import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { decryptMetaToken, getAnyMetaWhatsAppConnection } from '@/lib/meta-whatsapp';
import { getWhatsAppConversation, isWhatsAppCustomerServiceWindowOpen, markWhatsAppOutbound } from '@/lib/meta-whatsapp-conversations';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId || !['ADMIN', 'STAFF'].includes(session.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const to = String(body?.to || '').replace(/\D/g, '');
  const text = String(body?.text || '').trim();
  if (!to || !text) return NextResponse.json({ error: 'Recipient and message are required' }, { status: 400 });

  const connection = await getAnyMetaWhatsAppConnection();
  if (!connection?.phoneNumberId || !connection.accessTokenEncrypted) return NextResponse.json({ error: 'Meta WhatsApp is not connected' }, { status: 409 });

  const conversation = await getWhatsAppConversation(connection.phoneNumberId, to);
  if (!conversation || !isWhatsAppCustomerServiceWindowOpen(conversation.lastInboundAt)) {
    return NextResponse.json({ error: 'The 24-hour WhatsApp customer-service window has expired. Send an approved template instead.', code: 'WHATSAPP_WINDOW_EXPIRED', requiresTemplate: true, lastInboundAt: conversation?.lastInboundAt || null }, { status: 409 });
  }

  const version = process.env.META_GRAPH_API_VERSION?.trim() || 'v23.0';
  const token = decryptMetaToken(connection.accessTokenEncrypted);
  const endpoint = `https://graph.facebook.com/${version}/${encodeURIComponent(connection.phoneNumberId)}/messages`;
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { preview_url: false, body: text } }), cache: 'no-store', signal: AbortSignal.timeout(15000) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) return NextResponse.json({ error: result?.error?.message || `Meta WhatsApp returned HTTP ${response.status}` }, { status: response.status >= 400 && response.status < 500 ? response.status : 502 });
  const messageId = result?.messages?.[0]?.id ? String(result.messages[0].id) : null;
  await markWhatsAppOutbound(connection.phoneNumberId, to, text.slice(0, 500));
  await db.auditLog.create({ data: { action: 'WHATSAPP_INBOX_REPLY_SENT', entity: 'WhatsAppConversation', entityId: conversation.id, metadata: { providerMessageId: messageId, recipient: to } } });
  return NextResponse.json({ ok: true, messageId });
}
