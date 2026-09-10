import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

const endpoint = '/api/v1/storefront/returns';

export async function GET() {
  const token = (await cookies()).get('priyasa_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { response, body } = await priyasaApi(endpoint, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return NextResponse.json({ error: apiError(body, 'Unable to load returns.'), details: body }, { status: response.status });
  return NextResponse.json((body as any)?.data ?? body);
}
