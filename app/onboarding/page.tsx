import Link from 'next/link';
import EmailVerifyForm from '@/components/onboarding/EmailVerifyForm';

// Onboarding Step 1 — email verification. Magic links land here with
// ?token=…, which EmailVerifyForm exchanges for a session.

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
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
        <div className="w-full max-w-[420px]">
          <h1 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.01em] text-aegis-text-primary">
            Get your scorecard.
          </h1>
          <p className="mt-2 text-[15px] leading-[1.7] text-aegis-text-body">
            Verify your work email and we&apos;ll take you to a 4-minute
            contribution. Your data is anonymized and never linked to your name
            or employer.
          </p>
          <div className="mt-8">
            <EmailVerifyForm token={searchParams.token} />
          </div>
        </div>
      </div>
    </main>
  );
}
