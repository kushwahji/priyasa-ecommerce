import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { decryptMetaToken, getAnyMetaWhatsAppConnection, recordMetaWhatsAppMessage } from '@/lib/meta-whatsapp';
import { getWhatsAppConversation, markWhatsAppOutbound } from '@/lib/meta-whatsapp-conversations';

type TemplateComponent = {
  type?: string;
  text?: string;
  format?: string;
};

type TemplateRecord = {
  name: string;
  language: string;
  status: string;
  category?: string;
  components?: TemplateComponent[];
};

function normalizeRecipient(value: unknown) {
  return String(value || '').replace(/\D/g, '');
}

function textParameters(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? '').trim());
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId || !['ADMIN', 'STAFF'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const to = normalizeRecipient(body?.to);
  const templateName = String(body?.templateName || '').trim();
  const languageCode = String(body?.languageCode || '').trim() || 'en_US';
  const parameters = textParameters(body?.bodyParameters);

  if (!to || !templateName) {
    return NextResponse.json({ error: 'Recipient, template name and language are required.' }, { status: 400 });
  }

  const connection = await getAnyMetaWhatsAppConnection();
  if (!connection?.wabaId || !connection.phoneNumberId || !connection.accessTokenEncrypted) {
    return NextResponse.json({ error: 'Meta WhatsApp is not connected.' }, { status: 409 });
  }

  try {
    const token = decryptMetaToken(connection.accessTokenEncrypted);
    const version = process.env.META_GRAPH_API_VERSION?.trim() || 'v23.0';
    const templateUrl = new URL(`https://graph.facebook.com/${version}/${connection.wabaId}/message_templates`);
    templateUrl.searchParams.set('name', templateName);
    templateUrl.searchParams.set('language', languageCode);
    templateUrl.searchParams.set('fields', 'name,language,status,category,components');

    const templateResponse = await fetch(templateUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const templateData = await templateResponse.json().catch(() => ({}));
    if (!templateResponse.ok) {
      return NextResponse.json({ error: templateData?.error?.message || 'Unable to validate the WhatsApp template.' }, { status: 502 });
    }

    const template = (templateData?.data || []).find((item: TemplateRecord) =>
      item.name === templateName && item.language === languageCode && String(item.status).toUpperCase() === 'APPROVED'
    ) as TemplateRecord | undefined;

    if (!template) {
      return NextResponse.json({ error: 'Only an APPROVED Meta WhatsApp template can be sent.', code: 'WHATSAPP_TEMPLATE_NOT_APPROVED' }, { status: 409 });
    }

    const bodyComponent = (template.components || []).find((component) => String(component.type).toUpperCase() === 'BODY');
    const bodyText = bodyComponent?.text || '';
    const variableMatches = bodyText.match(/\{\{\s*\d+\s*\}\}/g) || [];
    if (parameters.length !== variableMatches.length) {
      return NextResponse.json({
        error: `This template requires ${variableMatches.length} body parameter${variableMatches.length === 1 ? '' : 's'}, but ${parameters.length} were provided.`,
        code: 'WHATSAPP_TEMPLATE_PARAMETER_MISMATCH',
        requiredParameters: variableMatches.length,
      }, { status: 400 });
    }

    const components = parameters.length
      ? [{ type: 'body', parameters: parameters.map((text) => ({ type: 'text', text })) }]
      : undefined;

    const endpoint = `https://graph.facebook.com/${version}/${encodeURIComponent(connection.phoneNumberId)}/messages`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: template.name,
          language: { code: template.language },
          ...(components ? { components } : {}),
        },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ error: result?.error?.message || `Meta WhatsApp returned HTTP ${response.status}` }, { status: response.status >= 400 && response.status < 500 ? response.status : 502 });
    }

    const messageId = result?.messages?.[0]?.id ? String(result.messages[0].id) : null;
    if (!messageId) return NextResponse.json({ error: 'Meta accepted the template request but returned no message ID.' }, { status: 502 });

    await recordMetaWhatsAppMessage({
      providerMessageId: messageId,
      recipient: to,
      templateName: template.name,
      languageCode: template.language,
    });
    await markWhatsAppOutbound(connection.phoneNumberId, to, `Template: ${template.name}`);

    const conversation = await getWhatsAppConversation(connection.phoneNumberId, to);
    if (conversation) {
      await db.auditLog.create({
        data: {
          action: 'WHATSAPP_TEMPLATE_FALLBACK_SENT',
          entity: 'WhatsAppConversation',
          entityId: conversation.id,
          metadata: { providerMessageId: messageId, recipient: to, templateName: template.name, languageCode: template.language },
        },
      });
    }

    return NextResponse.json({ ok: true, messageId, template: { name: template.name, language: template.language, status: template.status }, renderedBody: parameters.reduce((text, value, index) => text.replace(new RegExp(`\\{\\{\\s*${index + 1}\\s*\\}\\}`), value), bodyText) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to send WhatsApp template.' }, { status: 502 });
  }
}
