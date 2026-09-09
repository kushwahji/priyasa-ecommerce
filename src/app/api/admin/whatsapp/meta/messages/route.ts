import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listMetaWhatsAppMessages } from '@/lib/meta-whatsapp';

export async function GET() {
  const session = await getSession();
  if (!session || !['ADMIN', 'STAFF'].includes(session.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json({ messages: await listMetaWhatsAppMessages(50) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load WhatsApp delivery status' }, { status: 500 });
  }
}
