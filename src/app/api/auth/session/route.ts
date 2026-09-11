import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { priyasaApi } from '@/lib/priyasa-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  const jar = await cookies();
  const token = jar.get('priyasa_access_token')?.value;
  if (!token) return NextResponse.json({ authenticated: false, role: null });

  const { response, body } = await priyasaApi('/api/v1/storefront/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok || !(body as any)?.data) {
    return NextResponse.json({ authenticated: false, role: null });
  }

  const user: any = (body as any).data;
  return NextResponse.json({
    authenticated: true,
    role: 'CUSTOMER',
    user: {
      id: String(user.id),
      phone: user.phone,
      email: user.email || null,
      name: [user.first_name, user.last_name].filter(Boolean).join(' '),
    },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
