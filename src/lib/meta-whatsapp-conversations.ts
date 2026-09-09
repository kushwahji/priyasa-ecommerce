import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

const TABLE = 'PriyasaWhatsAppConversation';
const TABLE_SQL = Prisma.raw(TABLE);

export async function ensureWhatsAppConversationTable() {
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS ${TABLE} (id VARCHAR(191) NOT NULL PRIMARY KEY, phone_number_id VARCHAR(64) NOT NULL, customer_phone VARCHAR(64) NOT NULL, customer_name VARCHAR(255) NULL, last_inbound_at TIMESTAMP NULL, last_outbound_at TIMESTAMP NULL, last_message_preview TEXT NULL, status VARCHAR(32) NOT NULL DEFAULT 'OPEN', created_at TIMESTAMP NOT NULL, updated_at TIMESTAMP NOT NULL, UNIQUE KEY uq_wa_conversation_phone (phone_number_id, customer_phone))`);
}

export async function recordWhatsAppInbound(input: { phoneNumberId: string; customerPhone: string; customerName?: string | null; preview?: string | null; at?: Date }) {
  await ensureWhatsAppConversationTable();
  const now = input.at || new Date();
  const existing = await db.$queryRaw<any[]>`SELECT id FROM ${TABLE_SQL} WHERE phone_number_id=${input.phoneNumberId} AND customer_phone=${input.customerPhone} LIMIT 1`;
  if (existing[0]) {
    await db.$executeRaw`UPDATE ${TABLE_SQL} SET customer_name=${input.customerName || null}, last_inbound_at=${now}, last_message_preview=${input.preview || null}, status='OPEN', updated_at=${now} WHERE id=${existing[0].id}`;
    return String(existing[0].id);
  }
  const id = crypto.randomUUID();
  await db.$executeRaw`INSERT INTO ${TABLE_SQL} (id, phone_number_id, customer_phone, customer_name, last_inbound_at, last_outbound_at, last_message_preview, status, created_at, updated_at) VALUES (${id}, ${input.phoneNumberId}, ${input.customerPhone}, ${input.customerName || null}, ${now}, NULL, ${input.preview || null}, 'OPEN', ${now}, ${now})`;
  return id;
}

export async function getWhatsAppConversation(phoneNumberId: string, customerPhone: string) {
  await ensureWhatsAppConversationTable();
  const rows = await db.$queryRaw<any[]>`SELECT id, phone_number_id as phoneNumberId, customer_phone as customerPhone, customer_name as customerName, last_inbound_at as lastInboundAt, last_outbound_at as lastOutboundAt, last_message_preview as lastMessagePreview, status, created_at as createdAt, updated_at as updatedAt FROM ${TABLE_SQL} WHERE phone_number_id=${phoneNumberId} AND customer_phone=${customerPhone} LIMIT 1`;
  return rows[0] || null;
}

export async function markWhatsAppOutbound(phoneNumberId: string, customerPhone: string, preview?: string | null) {
  await ensureWhatsAppConversationTable();
  const now = new Date();
  await db.$executeRaw`UPDATE ${TABLE_SQL} SET last_outbound_at=${now}, last_message_preview=${preview || null}, updated_at=${now} WHERE phone_number_id=${phoneNumberId} AND customer_phone=${customerPhone}`;
}

export function isWhatsAppCustomerServiceWindowOpen(lastInboundAt: Date | string | null | undefined, now = new Date()) {
  if (!lastInboundAt) return false;
  const timestamp = new Date(lastInboundAt).getTime();
  return Number.isFinite(timestamp) && now.getTime() - timestamp < 24 * 60 * 60 * 1000;
}
