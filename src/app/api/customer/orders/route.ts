import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';
import { clearSession } from '@/lib/auth';

export async function GET() {
  const jar = await cookies();
  const token = jar.get('priyasa_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { response, body } = await priyasaApi('/api/v1/storefront/orders', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    // A rejected/expired Core token is a real sign-out. Do not turn 5xx Core
    // failures into a fake "please sign in" state.
    if (response.status === 401 || response.status === 403) await clearSession();
    return NextResponse.json({ error: apiError(body, 'Unable to load orders.'), details: body }, { status: response.status });
  }
  return NextResponse.json(body);
}
