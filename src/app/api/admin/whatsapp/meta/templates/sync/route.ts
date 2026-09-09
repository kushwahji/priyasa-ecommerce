import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST() {
  const session = await getSession();
  if (!session || !['ADMIN','STAFF'].includes(session.role)) return NextResponse.json({ error:'Unauthorized' }, { status:401 });
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const wabaId = process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID;
  const version = process.env.META_GRAPH_API_VERSION;
  if (!token || !wabaId || !version) return NextResponse.json({ error:'Meta WhatsApp credentials are not fully configured.' }, { status:503 });
  try {
    const url = new URL(`https://graph.facebook.com/${version}/${wabaId}/message_templates`);
    url.searchParams.set('fields','name,language,status,category'); url.searchParams.set('limit','100');
    const r = await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
    const d = await r.json();
    if (!r.ok) return NextResponse.json({ error:d?.error?.message||'Meta template sync failed.' },{status:r.status});
    return NextResponse.json({ templates:(d.data||[]).map((x:{name?:string;language?:string;status?:string;category?:string})=>({name:x.name||'',language:x.language,status:x.status,category:x.category})) });
  } catch { return NextResponse.json({ error:'Unable to reach Meta Graph API.' },{status:502}); }
}
