import {NextResponse} from 'next/server';
import {db} from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const configured = (name:string) => Boolean(process.env[name]?.trim());

export async function GET(){
  const startedAt = Date.now();
  const databaseConfigured = configured('DATABASE_URL');
  const environment = {
    databaseUrl:databaseConfigured,
    sessionSecret:configured('SESSION_SECRET'),
  };

  if (!databaseConfigured) {
    return NextResponse.json({
      ok:false,
      service:'priyasa-commerce',
      database:'not_configured',
      environment,
    },{status:503,headers:{'Cache-Control':'no-store'}});
  }

  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok:true,
      service:'priyasa-commerce',
      database:'up',
      latencyMs:Date.now()-startedAt,
      environment,
    },{headers:{'Cache-Control':'no-store'}});
  } catch {
    return NextResponse.json({
      ok:false,
      service:'priyasa-commerce',
      database:'down',
      environment,
    },{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
