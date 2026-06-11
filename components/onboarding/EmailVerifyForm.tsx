'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Onboarding Step 1 — magic link request form.
// When a `token` prop is present (user clicked the email link), it is
// exchanged for a session via /api/auth/verify and the user is redirected.

type Status = 'idle' | 'sending' | 'sent' | 'verifying';

export default function EmailVerifyForm({ token }: { token?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.redirect) {
          router.replace(data.redirect);
        } else {
          setStatus('idle');
          setError(data.error ?? 'This link has expired. Request a new one below.');
        }
      } catch {
        if (!cancelled) {
          setStatus('idle');
          setError('Something went wrong verifying your link. Request a new one below.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus('sending');
    try {
      const res = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('sent');
      } else {
        setStatus('idle');
        setError(data.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('idle');
      setError('Something went wrong. Please try again.');
    }
  }

  if (status === 'verifying') {
    return (
      <div className="text-center">
        <p className="text-[15px] leading-[1.7] text-aegis-text-body">
          Verifying your sign-in link…
        </p>
      </div>
    );
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl bg-aegis-brand-soft p-6 text-center">
        <h2 className="text-[18px] font-medium text-aegis-text-primary">
          Check your work email
        </h2>
        <p className="mt-2 text-[14px] leading-[1.7] text-aegis-text-body">
          We sent a sign-in link to <span className="font-medium">{email}</span>.
          It expires in 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label
        htmlFor="email"
        className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted"
      >
        Work Email
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@company.com"
        className="h-12 w-full rounded-xl border border-aegis-border bg-aegis-bg-card px-4 text-[15px] text-aegis-text-primary outline-none transition-colors duration-200 placeholder:text-aegis-text-subtle focus:border-aegis-brand"
      />
      <p className="mt-1.5 text-[12px] leading-[1.5] text-aegis-text-muted">
        Use your work email — we verify it once and never store it with your data.
      </p>
      {error && (
        <p className="mt-3 text-[13px] leading-[1.5] text-aegis-danger">{error}</p>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-5 h-12 w-full rounded-xl bg-aegis-brand text-[15px] font-medium text-white transition-colors duration-200 hover:bg-aegis-brand-dark disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Send my sign-in link'}
      </button>
    </form>
  );
}
