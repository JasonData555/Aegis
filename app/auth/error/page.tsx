import Link from 'next/link';
import { cookies } from 'next/headers';
import { signIn } from '@/auth';

// Auth recovery screen (NextAuth `pages.error`). Replaces the default
// /api/auth/error 500. The usual arrival here is a stale or expired OAuth
// `state` cookie that fails to decrypt on callback (InvalidCheck "state value
// could not be parsed"). The retry action clears the leftover authjs.* cookies
// so a fresh sign-in isn't shadowed by the undecodable one, then re-initiates
// LinkedIn auth from a clean cookie state.

async function clearAuthCookiesAndRetry() {
  'use server';
  const store = cookies();
  for (const c of store.getAll()) {
    if (/^(__Secure-|__Host-)?authjs\./.test(c.name)) {
      store.delete(c.name);
    }
  }
  await signIn('linkedin', { redirectTo: '/scorecard' });
}

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen flex-col bg-aegis-bg-base">
      <div className="mx-auto flex h-16 w-full max-w-[760px] items-center px-6 md:px-10">
        <Link
          href="/"
          className="text-[18px] font-semibold tracking-[-0.01em] text-aegis-text-primary"
        >
          Aegis
        </Link>
      </div>

      <div className="flex flex-1 items-start justify-center px-6 pt-16">
        <div className="mx-auto w-full max-w-[400px] rounded-2xl bg-aegis-bg-card p-8 shadow-card">
          <h1 className="text-center text-[24px] font-semibold leading-[1.2] tracking-[-0.01em] text-aegis-text-primary">
            Your sign-in session expired
          </h1>
          <p className="mt-2 text-center text-[15px] leading-[1.7] text-aegis-text-body">
            That can happen if a sign-in was left open too long or interrupted.
            Let&apos;s start fresh — this clears the stale session and sends you
            back to LinkedIn.
          </p>

          <form action={clearAuthCookiesAndRetry}>
            <button
              type="submit"
              style={{ backgroundColor: '#0A66C2', height: 48, borderRadius: 10 }}
              className="mt-8 flex w-full items-center justify-center gap-2.5 text-[15px] font-medium text-white transition-opacity duration-200 hover:opacity-90"
            >
              Try signing in again
            </button>
          </form>

          <p className="mt-4 text-center text-[12px] leading-[1.6] text-aegis-text-muted">
            Still stuck? Clear this site&apos;s cookies (or use a private window)
            and sign in again.
          </p>
        </div>
      </div>
    </main>
  );
}
