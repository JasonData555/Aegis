import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { readJson, writeJson } from './blob-store';
import {
  MAGIC_LINK_TTL_MS,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from './constants';
import type { MagicLinkToken, SessionPayload } from './types';

// ---------------------------------------------------------------------------
// Identity separation:
//   tokens.json    — {token, email, expires}, 15-minute TTL, deleted on use
//   emailmap.json  — SHA-256(email) → contributor_id (handled in
//                    contribution-store); plaintext email is never persisted
//   aegis_session  — signed cookie carrying contributor_id (UUID) only
// ---------------------------------------------------------------------------

export { SESSION_COOKIE_NAME };

const TOKENS_KEY = 'tokens.json';

function getSessionSecret(): string {
  const secret = process.env.AEGIS_SESSION_SECRET;
  if (!secret) throw new Error('AEGIS_SESSION_SECRET is not set');
  return secret;
}

function assertWritesAllowed(): void {
  if (process.env.ALLOW_WRITES !== 'true') {
    throw new Error('Writes are disabled (ALLOW_WRITES != true)');
  }
}

// ---------------------------------------------------------------------------
// Email helpers
// ---------------------------------------------------------------------------

const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'msn.com',
]);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashEmail(email: string): string {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex');
}

/**
 * Work email check — personal mailbox providers are rejected at onboarding.
 */
export function isWorkEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf('@');
  if (at < 1 || at === normalized.length - 1) return false;
  const domain = normalized.slice(at + 1);
  return !PERSONAL_EMAIL_DOMAINS.has(domain);
}

// ---------------------------------------------------------------------------
// Magic link tokens (data/tokens.json)
// ---------------------------------------------------------------------------

async function readTokens(): Promise<MagicLinkToken[]> {
  const parsed = await readJson<MagicLinkToken[]>(TOKENS_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeTokens(tokens: MagicLinkToken[]): Promise<void> {
  assertWritesAllowed();
  await writeJson(TOKENS_KEY, tokens);
}

function pruneExpired(tokens: MagicLinkToken[], now: Date): MagicLinkToken[] {
  return tokens.filter(t => new Date(t.expires).getTime() > now.getTime());
}

/**
 * 32-byte cryptographically random token, stored with a 15-minute TTL.
 */
export async function createMagicLinkToken(
  email: string,
  now: Date = new Date(),
): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const record: MagicLinkToken = {
    token,
    email: normalizeEmail(email),
    expires: new Date(now.getTime() + MAGIC_LINK_TTL_MS).toISOString(),
  };
  const tokens = pruneExpired(await readTokens(), now);
  tokens.push(record);
  await writeTokens(tokens);
  return token;
}

/**
 * Verify a magic link token: returns the email if valid and unexpired,
 * and deletes the token so it can never be used twice.
 */
export async function consumeMagicLinkToken(
  token: string,
  now: Date = new Date(),
): Promise<string | null> {
  const tokens = pruneExpired(await readTokens(), now);
  const match = tokens.find(t => t.token === token);
  await writeTokens(tokens.filter(t => t.token !== token));
  return match ? match.email : null;
}

// ---------------------------------------------------------------------------
// Session cookie (aegis_session) — contributor_id only, HMAC-signed
// ---------------------------------------------------------------------------

function sign(payload: string): string {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

export function createSessionValue(
  contributorId: string,
  now: Date = new Date(),
): string {
  const payload: SessionPayload = {
    contributor_id: contributorId,
    expires: now.getTime() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionValue(
  value: string | undefined | null,
  now: Date = new Date(),
): SessionPayload | null {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot < 1) return null;
  const encoded = value.slice(0, dot);
  const signature = value.slice(dot + 1);

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as SessionPayload;
    if (typeof payload.contributor_id !== 'string') return null;
    if (typeof payload.expires !== 'number' || payload.expires <= now.getTime()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: SESSION_TTL_MS / 1000,
} as const;
