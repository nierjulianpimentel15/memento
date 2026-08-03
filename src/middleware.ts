import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/invite'];
const PUBLIC_API_PREFIXES = ['/api/auth', '/api/invite'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/uploads') || pathname === '/favicon.ico';

  const res = NextResponse.next();

  // Basic security headers (defense in depth alongside app-level protections).
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (isPublicPage || isPublicApi || isStatic) {
    return res;
  }

  const token = req.cookies.get('memento_access')?.value;
  const session = token ? await verifyAccessToken(token) : null;

  if (!session) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads).*)'],
};
