import LinkedIn from 'next-auth/providers/linkedin';
import type { NextAuthConfig } from 'next-auth';

// Edge-safe NextAuth config: providers + pages only. NO Node-only imports
// (fs / Blob / crypto stores) — this module is bundled into the Edge
// middleware. The jwt/session callbacks that touch storage live in `auth.ts`,
// which is only loaded in the Node runtime (route handlers, server components).
//
// LinkedIn uses "Sign In with LinkedIn using OpenID Connect": scope
// `openid profile email`. The OIDC userinfo returns sub/name/email/picture/locale
// only — it does NOT return headline/title, company, location, or tenure.

export default {
  providers: [
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      authorization: {
        params: { scope: 'openid profile email' },
      },
    }),
  ],
  pages: {
    signIn: '/',
  },
} satisfies NextAuthConfig;
