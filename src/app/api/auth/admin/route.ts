import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { setSession } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if ((!email && !phone) || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const user = email
    ? await db.user.findUnique({ where: { email } })
    : await db.user.findUnique({ where: { phone } });

  if (
    !user ||
    !['ADMIN', 'STAFF'].includes(user.role) ||
    !user.passwordHash ||
    !(await bcrypt.compare(password, user.passwordHash))
  ) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  await setSession(user);
  return NextResponse.json({ ok: true, role: user.role });
}
