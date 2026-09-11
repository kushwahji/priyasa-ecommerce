import { NextRequest, NextResponse } from 'next/server';

/**
 * PRIYASA Store is storefront-only. Administration lives in priyasa-admin.
 * Legacy embedded admin URLs are explicitly disabled so they cannot reach
 * obsolete local-database handlers.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return NextResponse.json(
      { success: false, message: 'Administration has moved to the PRIYASA Admin application.' },
      { status: 410 },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
