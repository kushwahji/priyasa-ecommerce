import { getAnyMetaWhatsAppConnection } from '@/lib/meta-whatsapp';
import { getWhatsAppConversation, isWhatsAppCustomerServiceWindowOpen } from '@/lib/meta-whatsapp-conversations';
import { sendMetaWhatsAppTemplate, sendMetaWhatsAppText } from '@/lib/meta-whatsapp-send';

export type WhatsAppOrderStatusMessage = {
  order: any;
  status: string;
  previousStatus?: string;
  templateName?: string;
  languageCode?: string;
  parameters?: string[];
  freeTextMessage?: string;
};

type WhatsAppOrderStatusValues = {
  orderId: string;
  orderNumber: string;
  status: string;
  previousStatus: string;
  customerName: string;
  total: string;
  trackingNumber: string;
  trackingUrl: string;
};

function valuesFor(input: WhatsAppOrderStatusMessage): WhatsAppOrderStatusValues {
  return {
    orderId: String(input.order?.id || ''),
    orderNumber: String(input.order?.orderNumber || ''),
    status: String(input.status || ''),
    previousStatus: String(input.previousStatus || ''),
    customerName: String(input.order?.user?.name || ''),
    total: String(input.order?.total ?? ''),
    trackingNumber: String(input.order?.shipment?.trackingNumber || ''),
    trackingUrl: String(input.order?.shipment?.trackingUrl || ''),
  };
}

function defaultFreeText(input: WhatsAppOrderStatusMessage) {
  const v = valuesFor(input);
  const label = input.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return `Hi ${v.customerName || 'there'}, your Priyasa order #${v.orderNumber} is now ${label}.${v.trackingNumber ? ` Tracking number: ${v.trackingNumber}.` : ''}${v.trackingUrl ? ` ${v.trackingUrl}` : ''}`;
}

export async function sendOrderStatusWhatsApp(input: WhatsAppOrderStatusMessage) {
  const phone = String(input.order?.user?.phone || '').replace(/\D/g, '');
  if (!phone) throw new Error('Order customer has no WhatsApp phone number');
  const connection = await getAnyMetaWhatsAppConnection();
  if (!connection?.phoneNumberId) throw new Error('Meta WhatsApp is not connected');

  const conversation = await getWhatsAppConversation(connection.phoneNumberId, phone);
  const freeWindow = isWhatsAppCustomerServiceWindowOpen(conversation?.lastInboundAt);
  const values = valuesFor(input);

  if (freeWindow) {
    return sendMetaWhatsAppText({ to: phone, body: input.freeTextMessage?.trim() || defaultFreeText(input), orderId: input.order?.id });
  }

  if (!input.templateName) throw new Error(`No approved WhatsApp Utility template is mapped for order status ${input.status}`);
  const parameters = (input.parameters || []).map((key) => values[key.replace(/[{}]/g, '').trim() as keyof WhatsAppOrderStatusValues] ?? key);
  const result = await sendMetaWhatsAppTemplate({ to: phone, templateName: input.templateName, languageCode: input.languageCode || 'en_US', bodyParameters: parameters, orderId: input.order.id });
  return { mode: 'UTILITY_TEMPLATE' as const, skipped: false, ...result };
}
