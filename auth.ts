import NextAuth from 'next-auth';
import authConfig from './auth.config';
import {
  getOrCreateContributorIdByLinkedIn,
  hashLinkedInId,
  upsertVerification,
} from './lib/verification-store';

// Node-runtime NextAuth instance. The jwt callback's `account && profile`
// branch runs ONLY during the real OAuth callback (Node), never during edge
// middleware session refresh — so it is safe to touch the Blob/fs stores here.
//
// Identity separation: on first auth we hash the LinkedIn `sub`, map it to a
// contributor_id UUID (linkedin_map.json), and snapshot verification data
// (verifications.json). Only contributor_id flows into the analytical systems.

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
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
          const { contributor_id } = await getOrCreateContributorIdByLinkedIn(
            hashLinkedInId(linkedinId),
          );
          token.contributor_id = contributor_id;
          // company/location are not available from the OIDC scope — null in
          // practice; populated only if richer LinkedIn access is added later.
          await upsertVerification(contributor_id, {
            title,
            company: null,
            location: null,
          });
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
