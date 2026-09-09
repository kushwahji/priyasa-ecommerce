import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET?.trim() || 'development-only-change-me');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/admin') || pathname === '/admin/login') return NextResponse.next();

  const token = request.cookies.get('priyasa_session')?.value;
  if (!token) return NextResponse.redirect(new URL('/admin/login', request.url));

  try {
    const { payload } = await jwtVerify(token, secret());
    const role = String(payload.role || 'CUSTOMER');
    if (!payload.sub || !['ADMIN', 'STAFF'].includes(role)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
