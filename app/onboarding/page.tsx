import Link from 'next/link';
import LinkedInSignIn from '@/components/onboarding/LinkedInSignIn';

// Onboarding entry — LinkedIn OAuth sign-in. Authentication and the first
// verification layer in one step.

export default function OnboardingPage() {
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
        <LinkedInSignIn />
      </div>
    </main>
  );
}
