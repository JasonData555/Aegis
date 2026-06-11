import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Session middleware — protects authenticated routes:
//   /scorecard/*, /compare/*, /onboarding/contribute, /api/query, /api/contribute
// Pages redirect to / when no valid session; API routes return 401.
//
// Middleware runs on the Edge runtime, where Node's crypto module is
// unavailable — so the aegis_session HMAC is verified here with Web Crypto.
// The signing logic mirrors lib/auth.ts exactly (HMAC-SHA256, base64url).

const SESSION_COOKIE_NAME = 'aegis_session';

function toBase64Url(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded);
}

async function hasValidSession(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const secret = process.env.AEGIS_SESSION_SECRET;
  if (!secret) return false;

  const dot = value.lastIndexOf('.');
  if (dot < 1) return false;
  const encoded = value.slice(0, dot);
  const signature = value.slice(dot + 1);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expected = toBase64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(encoded)));
  if (expected !== signature) return false;

  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as {
      contributor_id?: unknown;
      expires?: unknown;
    };
    return (
      typeof payload.contributor_id === 'string' &&
      typeof payload.expires === 'number' &&
      payload.expires > Date.now()
    );
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const valid = await hasValidSession(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (valid) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/', req.url));
}

export const config = {
  matcher: [
    '/scorecard/:path*',
    '/compare/:path*',
    '/onboarding/contribute',
    '/api/query',
    '/api/contribute',
  ],
};
