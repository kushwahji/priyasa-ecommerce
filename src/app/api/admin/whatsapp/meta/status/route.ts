import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { decryptMetaToken, getMetaWhatsAppConnection } from '@/lib/meta-whatsapp';

export async function GET() {
  const session = await getSession();
  if (!session || !['ADMIN', 'STAFF'].includes(session.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const connection = await getMetaWhatsAppConnection(session.userId);
    if (!connection) return NextResponse.json({ connected: false, configured: Boolean(process.env.META_APP_ID && process.env.META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID) });
    const token = decryptMetaToken(connection.accessTokenEncrypted);
    const version = process.env.META_GRAPH_API_VERSION || 'v23.0';
    const response = await fetch(`https://graph.facebook.com/${version}/${connection.phoneNumberId}?fields=id,display_phone_number,verified_name`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ connected: false, configured: true, wabaId: connection.wabaId, phoneNumberId: connection.phoneNumberId, phoneNumber: connection.phoneNumber, businessName: connection.businessName, message: 'Meta connection needs to be reconnected.' });
    return NextResponse.json({ connected: true, configured: true, wabaId: connection.wabaId, phoneNumberId: connection.phoneNumberId, phoneNumber: connection.phoneNumber, businessName: connection.businessName, status: connection.status });
  } catch {
    return NextResponse.json({ connected: false, configured: true, message: 'Unable to verify the saved Meta connection.' });
  }
}
