import { handlers } from '@/auth';

// NextAuth route handlers (sign-in, callback, signout, session, csrf…).
// All NextAuth HTTP traffic flows through here; the config lives in /auth.ts.

export const { GET, POST } = handlers;
