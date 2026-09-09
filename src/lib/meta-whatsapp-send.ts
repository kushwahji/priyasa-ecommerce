import { decryptMetaToken, getAnyMetaWhatsAppConnection, recordMetaWhatsAppMessage } from '@/lib/meta-whatsapp';

export type WhatsAppTemplateParameter = { type: 'text'; text: string };

export async function sendMetaWhatsAppTemplate(input: {
  to: string;
  templateName: string;
  languageCode?: string;
  bodyParameters?: string[];
  orderId?: string;
  automationRunId?: string;
}) {
  const connection = await getAnyMetaWhatsAppConnection();
  if (!connection?.phoneNumberId || !connection.accessTokenEncrypted) throw new Error('Meta WhatsApp is not connected');
  const to = input.to.replace(/\D/g, '');
  if (!to) throw new Error('Customer WhatsApp number is invalid');
  if (!input.templateName.trim()) throw new Error('WhatsApp template name is required');
  const languageCode = input.languageCode?.trim() || 'en_US';
  const bodyParameters = (input.bodyParameters || []).map((text): WhatsAppTemplateParameter => ({ type: 'text', text: String(text) }));
  const template: Record<string, unknown> = { name: input.templateName.trim(), language: { code: languageCode } };
  if (bodyParameters.length) template.components = [{ type: 'body', parameters: bodyParameters }];
  const version = process.env.META_GRAPH_API_VERSION?.trim() || 'v23.0';
  const token = decryptMetaToken(connection.accessTokenEncrypted);
  const endpoint = `https://graph.facebook.com/${version}/${encodeURIComponent(connection.phoneNumberId)}/messages`;
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'template', template }), cache: 'no-store', signal: AbortSignal.timeout(15000) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.error?.message || `Meta WhatsApp returned HTTP ${response.status}`);
  const messageId = result?.messages?.[0]?.id ? String(result.messages[0].id) : null;
  if (!messageId) throw new Error('Meta accepted the request but returned no message ID');
  await recordMetaWhatsAppMessage({ providerMessageId: messageId, orderId: input.orderId, automationRunId: input.automationRunId, recipient: to, templateName: input.templateName.trim(), languageCode });
  return { messageId, response: result };
}
