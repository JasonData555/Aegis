import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { deriveContributorId, upsertVerification } from './lib/verification-store';

// Node-runtime NextAuth instance. The jwt callback's `account && profile`
// branch runs ONLY during the real OAuth callback (Node), never during edge
// middleware session refresh.
//
// Identity separation: the contributor_id is DERIVED from SHA-256(linkedin_id)
// (one-way; the LinkedIn id is never persisted). Deriving it means login needs
// no storage write, so a storage outage can never block sign-in. The
// verification snapshot write is best-effort for the same reason. Only
// contributor_id flows into the analytical systems.

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  // TEMPORARY diagnostic logger — surfaces the underlying cause of auth errors
  // (the default log truncates it). Remove after diagnosing the callback error.
  logger: {
    error(error) {
      const e = error as Error & { cause?: unknown };
      const cause = e?.cause as { message?: string; name?: string } | undefined;
      const causeMsg =
        cause?.message ?? (typeof cause === 'string' ? cause : JSON.stringify(cause));
      console.error(`AEGIS_AUTHERR cause=${causeMsg} :: name=${e?.name} msg=${e?.message}`);
    },
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // OIDC returns sub/name/email/picture only. headline/company/location
        // are not provided by the `openid profile email` scope — read
        // defensively so the scaffolding activates if richer access is added.
        const p = profile as Record<string, unknown>;
        const linkedinId = String(p.sub ?? '');
        const title = (p.headline as string | undefined) ?? null;

        token.linkedin_id = linkedinId;
        token.linkedin_name = (p.name as string | undefined) ?? null;
        token.linkedin_email = (p.email as string | undefined) ?? null;
        token.linkedin_title = title;
        token.linkedin_picture = (p.picture as string | undefined) ?? null;

        if (linkedinId) {
          const contributor_id = deriveContributorId(linkedinId);
          token.contributor_id = contributor_id;
          // Best-effort: a storage failure here must never block login. The
          // verification snapshot is non-critical (scoring null-safes a missing
          // record) and is refreshed on the next login. company/location are
          // not available from the OIDC scope — null in practice.
          try {
            await upsertVerification(contributor_id, {
              title,
              company: null,
              location: null,
            });
          } catch (e) {
            console.warn(
              `[aegis] verification snapshot write skipped: ${
                e instanceof Error ? e.message : String(e)
              }`,
            );
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.contributor_id = (token.contributor_id as string | undefined) ?? '';
      session.linkedin_id = (token.linkedin_id as string | null | undefined) ?? null;
      session.linkedin_name = (token.linkedin_name as string | null | undefined) ?? null;
      session.linkedin_title = (token.linkedin_title as string | null | undefined) ?? null;
      return session;
    },
  },
});
