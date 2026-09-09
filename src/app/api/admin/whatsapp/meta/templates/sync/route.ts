import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { decryptMetaToken, getAnyMetaWhatsAppConnection, getMetaWhatsAppConnection } from '@/lib/meta-whatsapp';

export async function POST() {
  const session = await getSession();
  if (!session || !['ADMIN', 'STAFF'].includes(session.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const connection = await getMetaWhatsAppConnection(session.userId) || await getAnyMetaWhatsAppConnection();
    if (!connection?.wabaId) return NextResponse.json({ error: 'Connect Meta WhatsApp before syncing templates.' }, { status: 409 });
    const token = decryptMetaToken(connection.accessTokenEncrypted);
    const version = process.env.META_GRAPH_API_VERSION || 'v23.0';
    const url = new URL(`https://graph.facebook.com/${version}/${connection.wabaId}/message_templates`);
    url.searchParams.set('fields', 'name,language,status,category');
    url.searchParams.set('limit', '100');
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || 'Meta template sync failed.' }, { status: response.status });
    return NextResponse.json({ templates: (data.data || []).map((item: { name?: string; language?: string; status?: string; category?: string }) => ({ name: item.name || '', language: item.language, status: item.status, category: item.category })) });
  } catch {
    return NextResponse.json({ error: 'Unable to read the saved Meta connection.' }, { status: 502 });
  }
}
