import AegisHeader from '@/components/layout/AegisHeader';
import PageContainer from '@/components/layout/PageContainer';
import ContributionForm from '@/components/onboarding/ContributionForm';

// Onboarding Step 2 — the data contribution form.
// Session-protected by middleware.

export default function ContributePage() {
  return (
    <main className="min-h-screen bg-aegis-bg-base">
      <AegisHeader />
      <PageContainer className="py-10">
        <ContributionForm />
      </PageContainer>
    </main>
  );
}
