import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AegisHeader from '@/components/layout/AegisHeader';
import PageContainer from '@/components/layout/PageContainer';
import ContributionForm from '@/components/onboarding/ContributionForm';
import { getVerification } from '@/lib/verification-store';

// Onboarding Step 2 — the data contribution form. Session-protected by
// middleware. role_title is pre-filled from the LinkedIn verification snapshot
// when a title is available (null under the current OIDC scope).

export default async function ContributePage() {
  const session = await auth();
  if (!session?.contributor_id) redirect('/');

  const verification = await getVerification(session.contributor_id);

  return (
    <main className="min-h-screen bg-aegis-bg-base">
      <AegisHeader />
      <PageContainer className="py-10">
        <ContributionForm initialRoleTitle={verification?.linkedin_verified_title ?? ''} />
      </PageContainer>
    </main>
  );
}
