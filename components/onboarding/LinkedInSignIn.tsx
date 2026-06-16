'use client';

import { signIn } from 'next-auth/react';

// Onboarding entry point — LinkedIn OAuth sign-in. LinkedIn serves as both
// authentication and the first layer of data verification. After auth the user
// lands on /scorecard, which redirects to /onboarding/contribute when no
// contribution is on file yet.

function LinkedInIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export default function LinkedInSignIn() {
  return (
    <div className="mx-auto w-full max-w-[400px] rounded-2xl bg-aegis-bg-card p-8 shadow-card">
      <div className="text-center text-[18px] font-semibold tracking-[-0.01em] text-aegis-text-primary">
        Aegis
      </div>

      <h1 className="mt-6 text-center text-[24px] font-semibold leading-[1.2] tracking-[-0.01em] text-aegis-text-primary">
        Access your scorecard
      </h1>
      <p className="mt-2 text-center text-[15px] leading-[1.7] text-aegis-text-body">
        Sign in with LinkedIn to verify your professional identity and access
        your personalized Traction Score.
      </p>

      <button
        type="button"
        onClick={() => signIn('linkedin', { callbackUrl: '/scorecard' })}
        style={{ backgroundColor: '#0A66C2', height: 48, borderRadius: 10 }}
        className="mt-8 flex w-full items-center justify-center gap-2.5 text-[15px] font-medium text-white transition-opacity duration-200 hover:opacity-90"
      >
        <LinkedInIcon />
        Continue with LinkedIn
      </button>

      <p className="mt-4 text-center text-[12px] leading-[1.6] text-aegis-text-muted">
        We access your name, email, and current role only. We never post to
        LinkedIn or access your connections.
      </p>
      <p className="mt-3 text-center text-[12px] leading-[1.6] text-aegis-text-muted">
        Your professional data is anonymized and stored separately from your
        identity.
      </p>
    </div>
  );
}
