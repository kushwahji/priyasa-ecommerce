import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const jar = await cookies();
  for (const name of ['priyasa_access_token', 'priyasa_user_id', 'priyasa_mobile']) {
    jar.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }
  return NextResponse.json({ ok: true });
}
