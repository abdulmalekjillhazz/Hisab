import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const canonicalHost = 'hisab-rakhbo-nirapod.vercel.app';
const legacyHost = 'hisab-nu-sable.vercel.app';
const protectedPath = /^\/(dashboard|products|sales|customers|reports|profile|admin)(\/|$)/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (req.nextUrl.hostname === legacyHost) {
    const canonicalUrl = req.nextUrl.clone();
    canonicalUrl.protocol = 'https:';
    canonicalUrl.hostname = canonicalHost;
    canonicalUrl.port = '';
    return NextResponse.redirect(canonicalUrl, 308);
  }

  if (protectedPath.test(pathname)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin') || '';
    const allowed = new Set([
      process.env.NEXT_PUBLIC_APP_URL,
      'capacitor://localhost',
      'http://localhost',
      'https://localhost',
    ].filter(Boolean));
    const headers = new Headers({
      Vary: 'Origin',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization,Content-Type',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    });
    if (allowed.has(origin)) headers.set('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS') return new NextResponse(null, { status: 204, headers });
    const response = NextResponse.next();
    headers.forEach((value, key) => response.headers.set(key, value));
    return response;
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
