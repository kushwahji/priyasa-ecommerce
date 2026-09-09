import { decryptMetaToken, getAnyMetaWhatsAppConnection, recordMetaWhatsAppMessage } from '@/lib/meta-whatsapp';
import { markWhatsAppOutbound } from '@/lib/meta-whatsapp-conversations';

export type WhatsAppTemplateParameter = { type: 'text'; text: string };

async function graphSend(input: { to: string; payload: Record<string, unknown> }) {
  const connection = await getAnyMetaWhatsAppConnection();
  if (!connection?.phoneNumberId || !connection.accessTokenEncrypted) throw new Error('Meta WhatsApp is not connected');
  const to = input.to.replace(/\D/g, '');
  if (!to) throw new Error('Customer WhatsApp number is invalid');
  const version = process.env.META_GRAPH_API_VERSION?.trim() || 'v23.0';
  const token = decryptMetaToken(connection.accessTokenEncrypted);
  const endpoint = `https://graph.facebook.com/${version}/${encodeURIComponent(connection.phoneNumberId)}/messages`;
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, ...input.payload }), cache: 'no-store', signal: AbortSignal.timeout(15000) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.error?.message || `Meta WhatsApp returned HTTP ${response.status}`);
  const messageId = result?.messages?.[0]?.id ? String(result.messages[0].id) : null;
  if (!messageId) throw new Error('Meta accepted the request but returned no message ID');
  return { connection, to, messageId, response: result };
}

export async function sendMetaWhatsAppText(input: { to: string; body: string; orderId?: string; automationRunId?: string }) {
  const body = input.body.trim();
  if (!body) throw new Error('WhatsApp text message is required');
  const result = await graphSend({ to: input.to, payload: { type: 'text', text: { preview_url: false, body } } });
  await markWhatsAppOutbound(result.connection.phoneNumberId, result.to, body);
  return { messageId: result.messageId, response: result.response, mode: 'FREE_WINDOW' as const };
}

export async function sendMetaWhatsAppTemplate(input: { to: string; templateName: string; languageCode?: string; bodyParameters?: string[]; orderId?: string; automationRunId?: string }) {
  const templateName = input.templateName.trim();
  if (!templateName) throw new Error('WhatsApp template name is required');
  const languageCode = input.languageCode?.trim() || 'en_US';
  const bodyParameters = (input.bodyParameters || []).map((text): WhatsAppTemplateParameter => ({ type: 'text', text: String(text) }));
  const template: Record<string, unknown> = { name: templateName, language: { code: languageCode } };
  if (bodyParameters.length) template.components = [{ type: 'body', parameters: bodyParameters }];
  const result = await graphSend({ to: input.to, payload: { type: 'template', template } });
  await recordMetaWhatsAppMessage({ providerMessageId: result.messageId, orderId: input.orderId, automationRunId: input.automationRunId, recipient: result.to, templateName, languageCode });
  await markWhatsAppOutbound(result.connection.phoneNumberId, result.to, `Template: ${templateName}`);
  return { messageId: result.messageId, response: result.response };
}
