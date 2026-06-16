import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from './auth.config';

// Session middleware (NextAuth, Edge runtime). Imports ONLY the edge-safe
// auth.config (no fs/Blob), so the LinkedIn session cookie is verified without
// pulling Node-only code into the edge bundle.
//
// Protects: /scorecard/*, /compare/*, /onboarding/contribute, /api/query,
// /api/contribute. Unauthenticated pages → redirect /; APIs → 401.
// /api/auth/* is intentionally excluded from the matcher (it runs the OAuth flow).

const { auth } = NextAuth(authConfig);

export default auth(req => {
  if (req.auth) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/', req.url));
});

export const config = {
  matcher: [
    '/scorecard/:path*',
    '/compare/:path*',
    '/onboarding/contribute',
    '/api/query',
    '/api/contribute',
  ],
};
