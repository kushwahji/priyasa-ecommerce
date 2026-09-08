import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

async function getUser() {
  const jar = await cookies();
  const id = jar.get('priyasa_local_user_id')?.value;
  const phone = jar.get('priyasa_mobile')?.value;
  if (id) return db.user.findUnique({ where: { id }, select: { id: true } });
  if (phone) return db.user.findUnique({ where: { phone }, select: { id: true } });
  return null;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const notifications = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50, include: { deliveries: true } });
  const unread = notifications.filter((item) => !item.readAt).length;
  return NextResponse.json({ data: notifications, unread });
}

export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.id) {
    await db.notification.updateMany({ where: { id: String(body.id), userId: user.id }, data: { readAt: new Date() } });
  } else {
    await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  }
  return NextResponse.json({ success: true });
}
