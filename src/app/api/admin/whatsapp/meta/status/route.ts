import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || !['ADMIN','STAFF'].includes(session.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const wabaId = process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID;
  const version = process.env.META_GRAPH_API_VERSION;
  if (!token || !phoneNumberId || !wabaId || !version) return NextResponse.json({ connected:false, configured:false, phoneNumberId:wabaId?phoneNumberId:undefined, wabaId:wabaId? wabaId:undefined, message:'Meta WhatsApp credentials are not fully configured.' });
  try {
    const r = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}?fields=id,display_phone_number,verified_name`, { headers:{ Authorization:`Bearer ${token}` }, cache:'no-store' });
    if (!r.ok) return NextResponse.json({ connected:false, configured:true, phoneNumberId, wabaId, message:'Meta credentials are configured but verification failed.' });
    return NextResponse.json({ connected:true, configured:true, phoneNumberId, wabaId });
  } catch { return NextResponse.json({ connected:false, configured:true, phoneNumberId, wabaId, message:'Meta verification request failed.' }); }
}
