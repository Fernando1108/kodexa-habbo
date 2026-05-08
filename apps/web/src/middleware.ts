import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export function isStaff(rank: number) { return rank >= 4; }
export function isAdmin(rank: number) { return rank >= 7; }

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path       = req.nextUrl.pathname;

  const needsAuth =
    path.startsWith('/hotel')    ||
    path.startsWith('/me')       ||
    path.startsWith('/settings') ||
    path.startsWith('/admin')    ||
    path.startsWith('/marketplace') ||
    path === '/profile';

  const needsAdmin = path.startsWith('/admin');

  if (needsAuth && !isLoggedIn) {
    const url = new URL('/login', req.nextUrl);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  if (needsAdmin && isLoggedIn) {
    const rank = (req.auth?.user as { rank?: number })?.rank ?? 1;
    if (!isAdmin(rank)) {
      return NextResponse.redirect(new URL('/hotel', req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/hotel/:path*',
    '/me/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/marketplace/:path*',
    '/profile',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
