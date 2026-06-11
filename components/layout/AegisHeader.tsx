'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Wordmark left; right side is "Sign In" on the landing variant or
// avatar + logout when authenticated.

export default function AegisHeader({
  variant = 'app',
}: {
  variant?: 'landing' | 'app';
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  const onDark = variant === 'landing';

  return (
    <header className={onDark ? 'bg-aegis-bg-dark' : 'border-b border-aegis-border bg-aegis-bg-card'}>
      <div className="mx-auto flex h-16 w-full max-w-[760px] items-center justify-between px-6 md:px-10">
        <Link
          href="/"
          className={`text-[18px] font-semibold tracking-[-0.01em] ${
            onDark ? 'text-white' : 'text-aegis-text-primary'
          }`}
        >
          Aegis
        </Link>

        {variant === 'landing' ? (
          <Link
            href="/onboarding"
            className="text-[14px] font-medium text-aegis-text-subtle transition-colors duration-200 hover:text-white"
          >
            Sign In
          </Link>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-aegis-brand-soft">
              <svg className="h-4 w-4 text-aegis-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
              </svg>
            </div>
            <button
              onClick={handleLogout}
              className="text-[14px] font-medium text-aegis-text-muted transition-colors duration-200 hover:text-aegis-text-primary"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
