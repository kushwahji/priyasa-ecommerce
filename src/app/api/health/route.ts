import {NextResponse} from 'next/server';
import {db} from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const configured = (name:string) => Boolean(process.env[name]?.trim());

export async function GET(){
  const startedAt = Date.now();
  const databaseConfigured = configured('DATABASE_URL');
  const sessionSecretConfigured = configured('SESSION_SECRET');
  const adminEnvironmentConfigured = configured('ADMIN_EMAIL') && configured('ADMIN_PASSWORD') && configured('ADMIN_PHONE');
  const environment = {
    databaseUrl:databaseConfigured,
    sessionSecret:sessionSecretConfigured,
    adminCredentials:adminEnvironmentConfigured,
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
    const admin = adminEnvironmentConfigured
      ? await db.user.findFirst({where:{role:'ADMIN'},select:{id:true}})
      : null;
    return NextResponse.json({
      ok:true,
      service:'priyasa-commerce',
      database:'up',
      adminUser:adminEnvironmentConfigured ? (admin ? 'present' : 'missing') : 'not_configured',
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
