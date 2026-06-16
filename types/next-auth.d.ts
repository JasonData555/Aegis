import type { DefaultSession } from 'next-auth';

// Module augmentation for the custom fields we set in the jwt/session callbacks
// (auth.ts). Identity separation: `contributor_id` is the only field the
// analytical systems use; the linkedin_* fields are convenience profile data
// carried in the encrypted session cookie (never persisted to our JSON stores).

declare module 'next-auth' {
  interface Session {
    contributor_id: string;
    linkedin_id?: string | null;
    linkedin_name?: string | null;
    linkedin_title?: string | null;
    user?: DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    contributor_id?: string;
    linkedin_id?: string | null;
    linkedin_name?: string | null;
    linkedin_email?: string | null;
    linkedin_title?: string | null;
    linkedin_picture?: string | null;
  }
}
