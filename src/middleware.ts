import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Detect if hostname starts with 'admin.'
  const isSubdomainAdmin = hostname.startsWith('admin.');

  if (isSubdomainAdmin) {
    // Rewrite path internally to folder structure under `/admin/*`
    if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/api')) {
      url.pathname = `/admin${url.pathname === '/' ? '' : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  } else {
    // Prevent direct access to /admin paths on the main domain; redirect to subdomain
    if (url.pathname.startsWith('/admin')) {
      const redirectUrl = new URL(request.url);
      // Construct admin subdomain
      redirectUrl.hostname = `admin.${redirectUrl.hostname.replace('admin.', '')}`;
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
