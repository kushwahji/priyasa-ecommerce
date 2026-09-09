import crypto from 'node:crypto';
import { db } from '@/lib/db';

const TABLE = 'PriyasaMetaWhatsAppConnection';

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
  const rows = await db.$queryRawUnsafe<Connection[]>(`SELECT id, user_id as userId, access_token_encrypted as accessTokenEncrypted, waba_id as wabaId, phone_number_id as phoneNumberId, phone_number as phoneNumber, business_name as businessName, status, connected_at as connectedAt, updated_at as updatedAt FROM ${TABLE} WHERE user_id = ? LIMIT 1`, userId);
  return rows[0] ?? null;
}

export async function saveMetaWhatsAppConnection(input: Omit<Connection, 'updatedAt'>) {
  await ensureMetaWhatsAppTable();
  const now = new Date();
  await db.$executeRawUnsafe(`DELETE FROM ${TABLE} WHERE user_id = ?`, input.userId);
  await db.$executeRawUnsafe(`INSERT INTO ${TABLE} (id, user_id, access_token_encrypted, waba_id, phone_number_id, phone_number, business_name, status, connected_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, input.id, input.userId, input.accessTokenEncrypted, input.wabaId, input.phoneNumberId, input.phoneNumber, input.businessName, input.status, input.connectedAt, now);
}
