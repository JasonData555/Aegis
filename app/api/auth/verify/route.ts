import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  consumeMagicLinkToken,
  createSessionValue,
  hashEmail,
} from '@/lib/auth';
import { getOrCreateContributorId } from '@/lib/contribution-store';

// POST /api/auth/verify — exchange a magic link token for a session.
// Identity separation: the email is hashed here and discarded; only the
// contributor_id UUID enters the session cookie.

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const token = (body as { token?: unknown })?.token;
  if (typeof token !== 'string' || token.length === 0) {
    return NextResponse.json({ error: 'Missing token.' }, { status: 400 });
  }

  const email = await consumeMagicLinkToken(token);
  if (!email) {
    return NextResponse.json(
      { error: 'This link has expired or already been used. Request a new one.' },
      { status: 400 },
    );
  }

  const { contributor_id, is_new } = await getOrCreateContributorId(hashEmail(email));

  const res = NextResponse.json({
    redirect: is_new ? '/onboarding/contribute' : '/scorecard',
  });
  res.cookies.set(
    SESSION_COOKIE_NAME,
    createSessionValue(contributor_id),
    SESSION_COOKIE_OPTIONS,
  );
  return res;
}
