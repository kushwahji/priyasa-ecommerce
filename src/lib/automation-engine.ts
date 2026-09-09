import { db } from '@/lib/db';
import { sendMetaWhatsAppTemplate } from '@/lib/meta-whatsapp-send';

function get(obj: any, path: string) {
  return path.split('.').reduce((v, k) => v == null ? undefined : v[k], obj);
}

function matches(conditions: any, payload: any) {
  if (!conditions || typeof conditions !== 'object') return true;
  return Object.entries(conditions).every(([k, v]) => {
    const actual = get(payload, k);
    if (Array.isArray(v)) return v.map(String).includes(String(actual));
    return String(actual) === String(v);
  });
}

type AutomationAction = {
  type?: string;
  url?: string;
  message?: string;
  templateKey?: string;
  languageCode?: string;
  parameters?: unknown;
  [key: string]: unknown;
};

function asActions(value: unknown): AutomationAction[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is AutomationAction => !!item && typeof item === 'object' && !Array.isArray(item)) as AutomationAction[];
}

function templateValue(key: string, order: any, payload: any) {
  const normalized = key.replace(/[{}]/g, '').trim();
  const values: Record<string, unknown> = {
    orderId: order?.id,
    orderNumber: order?.orderNumber,
    status: payload?.status,
    previousStatus: payload?.previousStatus,
    customerName: order?.user?.name || '',
    customerPhone: order?.user?.phone || '',
    total: order?.total,
    trackingNumber: order?.shipment?.trackingNumber || '',
    trackingUrl: order?.shipment?.trackingUrl || '',
  };
  return values[normalized] ?? get(payload, normalized) ?? '';
}

async function executeWhatsApp(action: AutomationAction, run: any) {
  const templateKey = typeof action.templateKey === 'string' ? action.templateKey.trim() : '';
  if (!templateKey) throw new Error('SEND_WHATSAPP requires templateKey');
  const orderId = typeof run.payload?.orderId === 'string' ? run.payload.orderId : '';
  if (!orderId) throw new Error('SEND_WHATSAPP requires payload.orderId');

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: true, shipment: true },
  });
  if (!order?.user?.phone) throw new Error('Order customer has no WhatsApp phone number');

  const configuredParameters = Array.isArray(action.parameters) ? action.parameters.map(String) : [];
  const bodyParameters = configuredParameters.length
    ? configuredParameters.map((key) => String(templateValue(key, order, run.payload)))
    : [String(order.orderNumber), String(run.payload?.status || '')];

  return sendMetaWhatsAppTemplate({
    to: order.user.phone,
    templateName: templateKey,
    languageCode: typeof action.languageCode === 'string' ? action.languageCode : undefined,
    bodyParameters,
  });
}

export async function triggerAutomationEvent(trigger: string, payload: any) {
  const rules = await db.automation.findMany({ where: { enabled: true, OR: [{ trigger }, { trigger: '*' }] } });
  for (const rule of rules) {
    if (!matches(rule.conditions, payload)) continue;
    await db.automationRun.create({ data: { automationId: rule.id, status: 'PENDING', payload } });
  }
}

export async function processAutomationRuns(limit = 25) {
  const runs = await db.automationRun.findMany({ where: { status: 'PENDING' }, include: { automation: true }, orderBy: { createdAt: 'asc' }, take: limit });
  let done = 0;
  for (const run of runs) {
    try {
      const actions = asActions(run.automation.actions);
      for (const action of actions) {
        if (action.type === 'webhook' && typeof action.url === 'string' && action.url) {
          const body = JSON.stringify({ event: run.automation.trigger, id: `automation_${run.id}`, timestamp: new Date().toISOString(), data: run.payload });
          const response = await fetch(action.url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-commerce-event': run.automation.trigger }, body, signal: AbortSignal.timeout(10000) });
          if (!response.ok) throw new Error(`Automation webhook returned HTTP ${response.status}`);
        }
        if (action.type === 'SEND_WHATSAPP') {
          const result = await executeWhatsApp(action, run);
          await db.auditLog.create({ data: { action: 'WHATSAPP_MESSAGE_SENT', entity: 'AutomationRun', entityId: run.id, metadata: { templateKey: action.templateKey, providerMessageId: result.messageId, orderId: run.payload && typeof run.payload === 'object' ? (run.payload as any).orderId : null } } });
        }
        if (action.type === 'log') {
          await db.auditLog.create({ data: { action: 'AUTOMATION_ACTION', entity: 'AutomationRun', entityId: run.id, metadata: { message: typeof action.message === 'string' ? action.message : '', payload: run.payload } } });
        }
      }
      await db.automationRun.update({ where: { id: run.id }, data: { status: 'SUCCESS', finishedAt: new Date() } });
      done++;
    } catch (e) {
      await db.automationRun.update({ where: { id: run.id }, data: { status: 'FAILED', error: e instanceof Error ? e.message : 'Automation failed', finishedAt: new Date() } });
    }
  }
  return done;
}
