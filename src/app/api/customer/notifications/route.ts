import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ data: [], unread: 0 });
}

export async function PATCH() {
  return NextResponse.json({ success: true });
}
