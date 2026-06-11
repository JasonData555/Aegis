import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import MagicLinkEmail from '@/components/email/MagicLinkEmail';
import { createMagicLinkToken, isWorkEmail, normalizeEmail } from '@/lib/auth';

// POST /api/auth/request — send a magic link to a work email.
// The email lives only in tokens.json (15-minute TTL); nothing else stores it.

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const raw = (body as { email?: unknown })?.email;
  const email = typeof raw === 'string' ? normalizeEmail(raw) : '';

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (!isWorkEmail(email)) {
    return NextResponse.json(
      { error: 'Please use your work email — personal addresses are not accepted.' },
      { status: 400 },
    );
  }

  const token = createMagicLinkToken(email);
  const baseUrl = process.env.AEGIS_BASE_URL ?? 'http://localhost:3001';
  const link = `${baseUrl}/onboarding?token=${token}`;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: process.env.AEGIS_EMAIL_FROM ?? 'Aegis <onboarding@resend.dev>',
        to: email,
        subject: 'Your Aegis sign-in link',
        react: MagicLinkEmail({ url: link }),
      });
    } catch {
      return NextResponse.json(
        { error: "We couldn't send the email just now. Please try again." },
        { status: 502 },
      );
    }
  } else {
    // Dev fallback — no Resend key configured; surface the link in the server log
    console.log(`[aegis dev] magic link for ${email}: ${link}`);
  }

  return NextResponse.json({ message: 'Check your work email' });
}
