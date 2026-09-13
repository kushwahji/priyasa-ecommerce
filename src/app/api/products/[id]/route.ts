import { NextResponse } from 'next/server';
import { priyasaApi, apiError } from '@/lib/priyasa-api';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { response, body } = await priyasaApi(`/api/v1/storefront/products/${encodeURIComponent(id)}`);
  if (!response.ok) return NextResponse.json({ error: apiError(body, 'Unable to load product') }, { status: response.status });
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
}
