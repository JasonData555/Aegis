import Link from 'next/link';
import AegisHeader from '@/components/layout/AegisHeader';
import PageContainer from '@/components/layout/PageContainer';

// Onboarding Step 3 — contribution confirmed.

export default function CompletePage() {
  return (
    <main className="min-h-screen bg-aegis-bg-base">
      <AegisHeader />
      <PageContainer className="py-20">
        <div className="mx-auto max-w-[420px] text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-aegis-brand-soft">
            <svg className="h-7 w-7 text-aegis-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-6 text-[28px] font-semibold leading-[1.2] tracking-[-0.01em] text-aegis-text-primary">
            Your contribution is in.
          </h1>
          <p className="mt-3 text-[15px] leading-[1.7] text-aegis-text-body">
            Thank you. Your data has been anonymized and added to the peer
            dataset. Your personalized scorecard is ready — permanent access,
            starting now.
          </p>
          <Link
            href="/scorecard"
            className="mt-8 inline-flex h-12 items-center rounded-xl bg-aegis-brand px-8 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-aegis-brand-dark"
          >
            View my scorecard
          </Link>
        </div>
      </PageContainer>
    </main>
  );
}
