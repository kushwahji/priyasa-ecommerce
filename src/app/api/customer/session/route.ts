import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const jar = await cookies();
  const token = jar.get('priyasa_access_token')?.value;
  const userId = jar.get('priyasa_user_id')?.value;
  const phone = jar.get('priyasa_mobile')?.value;
  const name = jar.get('priyasa_user_name')?.value || '';
  const email = jar.get('priyasa_user_email')?.value || '';

  if (!token && !userId && !phone) return NextResponse.json({ authenticated: false });

  return NextResponse.json({
    authenticated: true,
    user: { id: userId || null, externalId: userId || null, name, email: email || null, phone: phone || null },
  });
}
