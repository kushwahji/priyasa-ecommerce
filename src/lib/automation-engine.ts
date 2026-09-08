import { db } from '@/lib/db';

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
  [key: string]: unknown;
};

function asActions(value: unknown): AutomationAction[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is AutomationAction => !!item && typeof item === 'object' && !Array.isArray(item)) as AutomationAction[];
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
