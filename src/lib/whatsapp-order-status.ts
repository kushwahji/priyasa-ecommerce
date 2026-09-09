import { getAnyMetaWhatsAppConnection } from '@/lib/meta-whatsapp';
import { getWhatsAppConversation, isWhatsAppCustomerServiceWindowOpen } from '@/lib/meta-whatsapp-conversations';
import { sendMetaWhatsAppTemplate } from '@/lib/meta-whatsapp-send';

export type WhatsAppOrderStatusMessage = {
  order: any;
  status: string;
  previousStatus?: string;
  templateName?: string;
  languageCode?: string;
  parameters?: string[];
};

export async function sendOrderStatusWhatsApp(input: WhatsAppOrderStatusMessage) {
  const phone = String(input.order?.user?.phone || '').replace(/\D/g, '');
  if (!phone) throw new Error('Order customer has no WhatsApp phone number');
  const connection = await getAnyMetaWhatsAppConnection();
  if (!connection?.phoneNumberId) throw new Error('Meta WhatsApp is not connected');

  const conversation = await getWhatsAppConversation(connection.phoneNumberId, phone);
  const freeWindow = isWhatsAppCustomerServiceWindowOpen(conversation?.lastInboundAt);
  if (freeWindow) return { mode: 'FREE_WINDOW', skipped: true, reason: 'Customer-service window is open; transactional automation should not force a template.' };
  if (!input.templateName) throw new Error(`No approved WhatsApp Utility template is mapped for order status ${input.status}`);

  const values: Record<string, string> = {
    orderId: String(input.order?.id || ''),
    orderNumber: String(input.order?.orderNumber || ''),
    status: String(input.status || ''),
    previousStatus: String(input.previousStatus || ''),
    customerName: String(input.order?.user?.name || ''),
    total: String(input.order?.total ?? ''),
    trackingNumber: String(input.order?.shipment?.trackingNumber || ''),
    trackingUrl: String(input.order?.shipment?.trackingUrl || ''),
  };
  const parameters = (input.parameters || []).map((key) => values[key.replace(/[{}]/g, '').trim()] ?? key);
  const result = await sendMetaWhatsAppTemplate({ to: phone, templateName: input.templateName, languageCode: input.languageCode || 'en_US', bodyParameters: parameters, orderId: input.order.id });
  return { mode: 'UTILITY_TEMPLATE', skipped: false, ...result };
}
