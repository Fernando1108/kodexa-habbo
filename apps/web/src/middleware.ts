import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export function isStaff(rank: number)            { return rank >= 4; }
export function isAdmin(rank: number)            { return rank >= 7; }
export function isDeveloper(rank: number)        { return rank >= 9; }
export function isFounder(rank: number)          { return rank >= 10; }
export function canAccessDevelopment(rank: number) { return rank >= 9; }

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path       = req.nextUrl.pathname;
  const rank       = (req.auth?.user as { rank?: number })?.rank ?? 1;

  const needsAuth =
    path.startsWith('/hotel')      ||
    path.startsWith('/desarrollo') ||
    path.startsWith('/me')         ||
    path.startsWith('/settings')   ||
    path.startsWith('/admin')      ||
    path.startsWith('/marketplace') ||
    path === '/profile';

  const needsAdmin  = path.startsWith('/admin');
  const needsBeta   = path.startsWith('/hotel-beta');
  const needsDev    = path.startsWith('/desarrollo');
  const betaEnabled = process.env.NEXT_PUBLIC_ENABLE_BETA_HOTEL !== 'false';
  const devEnabled  = process.env.NEXT_PUBLIC_ENABLE_DEV_HOTEL  !== 'false';

  // Unauthenticated → redirect to login
  if (needsAuth && !isLoggedIn) {
    const url = new URL('/login', req.nextUrl);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  // /hotel-beta: requires login + FOUNDER rank + beta feature enabled
  if (needsBeta) {
    if (!isLoggedIn) {
      const url = new URL('/login', req.nextUrl);
      url.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(url);
    }
    if (!betaEnabled || !isFounder(rank)) {
      return NextResponse.redirect(new URL('/unauthorized', req.nextUrl));
    }
  }

  // /desarrollo: requires login + DEVELOPER or FOUNDER rank + dev feature enabled
  if (needsDev) {
    if (!isLoggedIn) {
      const url = new URL('/login', req.nextUrl);
      url.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(url);
    }
    if (!devEnabled || !canAccessDevelopment(rank)) {
      return NextResponse.redirect(new URL('/unauthorized', req.nextUrl));
    }
  }

  // /admin: requires ADMIN rank
  if (needsAdmin && isLoggedIn && !isAdmin(rank)) {
    return NextResponse.redirect(new URL('/hotel', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/hotel/:path*',
    '/hotel-beta/:path*',
    '/desarrollo/:path*',
    '/me/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/marketplace/:path*',
    '/profile',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
