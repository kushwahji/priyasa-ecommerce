import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

const TABLE = 'PriyasaMetaWhatsAppConnection';
const MESSAGE_TABLE = 'PriyasaMetaWhatsAppMessage';
const TABLE_SQL = Prisma.raw(TABLE);
const MESSAGE_TABLE_SQL = Prisma.raw(MESSAGE_TABLE);

function key() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptMetaToken(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
}

export function decryptMetaToken(value: string) {
  const [ivRaw, tagRaw, ciphertextRaw] = value.split('.');
  if (!ivRaw || !tagRaw || !ciphertextRaw) throw new Error('Invalid encrypted Meta token');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivRaw, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextRaw, 'base64url')), decipher.final()]).toString('utf8');
}

export async function ensureMetaWhatsAppTable() {
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS ${TABLE} (id VARCHAR(191) NOT NULL PRIMARY KEY, user_id VARCHAR(191) NOT NULL UNIQUE, access_token_encrypted TEXT NOT NULL, waba_id VARCHAR(64), phone_number_id VARCHAR(64), phone_number VARCHAR(64), business_name VARCHAR(255), status VARCHAR(32) NOT NULL, connected_at TIMESTAMP NULL, updated_at TIMESTAMP NOT NULL)`);
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS ${MESSAGE_TABLE} (id VARCHAR(191) NOT NULL PRIMARY KEY, provider_message_id VARCHAR(191) NULL UNIQUE, order_id VARCHAR(191) NULL, automation_run_id VARCHAR(191) NULL, recipient VARCHAR(64) NOT NULL, template_name VARCHAR(255) NOT NULL, language_code VARCHAR(32) NOT NULL, status VARCHAR(32) NOT NULL, error TEXT NULL, sent_at TIMESTAMP NULL, delivered_at TIMESTAMP NULL, read_at TIMESTAMP NULL, updated_at TIMESTAMP NOT NULL)`);
}

type Connection = {
  id: string;
  userId: string;
  accessTokenEncrypted: string;
  wabaId: string | null;
  phoneNumberId: string | null;
  phoneNumber: string | null;
  businessName: string | null;
  status: string;
  connectedAt: Date | null;
  updatedAt: Date;
};

export async function getMetaWhatsAppConnection(userId: string) {
  await ensureMetaWhatsAppTable();
  const rows = await db.$queryRaw<Connection[]>`SELECT id, user_id as userId, access_token_encrypted as accessTokenEncrypted, waba_id as wabaId, phone_number_id as phoneNumberId, phone_number as phoneNumber, business_name as businessName, status, connected_at as connectedAt, updated_at as updatedAt FROM ${TABLE_SQL} WHERE user_id = ${userId} LIMIT 1`;
  return rows[0] ?? null;
}

export async function getAnyMetaWhatsAppConnection() {
  await ensureMetaWhatsAppTable();
  const rows = await db.$queryRaw<Connection[]>`SELECT id, user_id as userId, access_token_encrypted as accessTokenEncrypted, waba_id as wabaId, phone_number_id as phoneNumberId, phone_number as phoneNumber, business_name as businessName, status, connected_at as connectedAt, updated_at as updatedAt FROM ${TABLE_SQL} WHERE status = 'CONNECTED' ORDER BY connected_at DESC LIMIT 1`;
  return rows[0] ?? null;
}

export async function saveMetaWhatsAppConnection(input: Omit<Connection, 'updatedAt'>) {
  await ensureMetaWhatsAppTable();
  const now = new Date();
  await db.$executeRaw`DELETE FROM ${TABLE_SQL} WHERE user_id = ${input.userId}`;
  await db.$executeRaw`INSERT INTO ${TABLE_SQL} (id, user_id, access_token_encrypted, waba_id, phone_number_id, phone_number, business_name, status, connected_at, updated_at) VALUES (${input.id}, ${input.userId}, ${input.accessTokenEncrypted}, ${input.wabaId}, ${input.phoneNumberId}, ${input.phoneNumber}, ${input.businessName}, ${input.status}, ${input.connectedAt}, ${now})`;
}

export async function recordMetaWhatsAppMessage(input: { providerMessageId: string; orderId?: string; automationRunId?: string; recipient: string; templateName: string; languageCode: string }) {
  await ensureMetaWhatsAppTable();
  await db.$executeRaw`INSERT INTO ${MESSAGE_TABLE_SQL} (id, provider_message_id, order_id, automation_run_id, recipient, template_name, language_code, status, sent_at, updated_at) VALUES (${crypto.randomUUID()}, ${input.providerMessageId}, ${input.orderId || null}, ${input.automationRunId || null}, ${input.recipient}, ${input.templateName}, ${input.languageCode}, 'SENT', ${new Date()}, ${new Date()})`;
}

export async function updateMetaWhatsAppMessage(providerMessageId: string, status: string, error?: string) {
  await ensureMetaWhatsAppTable();
  const now = new Date();
  if (status === 'DELIVERED') await db.$executeRaw`UPDATE ${MESSAGE_TABLE_SQL} SET status=${status}, delivered_at=${now}, updated_at=${now} WHERE provider_message_id=${providerMessageId}`;
  else if (status === 'READ') await db.$executeRaw`UPDATE ${MESSAGE_TABLE_SQL} SET status=${status}, read_at=${now}, updated_at=${now} WHERE provider_message_id=${providerMessageId}`;
  else await db.$executeRaw`UPDATE ${MESSAGE_TABLE_SQL} SET status=${status}, error=${error || null}, updated_at=${now} WHERE provider_message_id=${providerMessageId}`;
}

export async function listMetaWhatsAppMessages(limit = 25) {
  await ensureMetaWhatsAppTable();
  return db.$queryRaw<any[]>`SELECT id, provider_message_id as providerMessageId, order_id as orderId, automation_run_id as automationRunId, recipient, template_name as templateName, language_code as languageCode, status, error, sent_at as sentAt, delivered_at as deliveredAt, read_at as readAt, updated_at as updatedAt FROM ${MESSAGE_TABLE_SQL} ORDER BY updated_at DESC LIMIT ${Math.min(Math.max(limit, 1), 100)}`;
}
