import { createHash } from 'crypto';
import { readJson, writeJson } from './blob-store';

// ---------------------------------------------------------------------------
// LinkedIn identity separation + verification data.
//   contributor_id      — deterministically DERIVED from SHA-256(linkedin_id)
//                          (one-way; the LinkedIn id is never persisted). No
//                          map file is needed, so login requires no storage.
//   verifications.json   — per-contributor LinkedIn verification snapshot,
//                          keyed by contributor_id only.
// verifications.json goes through lib/blob-store (Vercel Blob in prod,
// data/<key> locally) so it works on the read-only serverless filesystem.
// ---------------------------------------------------------------------------

const VERIFICATIONS_KEY = 'verifications.json';

export interface VerificationRecord {
  contributor_id: string;
  linkedin_verified_title: string | null;
  linkedin_verified_company: string | null;
  linkedin_location: string | null;
  linkedin_verified_at: string;
  verification_version: '1.0';
}

export interface LinkedInProfileData {
  title: string | null;
  company: string | null;
  location: string | null;
}

function assertWritesAllowed(): void {
  if (process.env.ALLOW_WRITES !== 'true') {
    throw new Error('Writes are disabled (ALLOW_WRITES != true)');
  }
}

/**
 * Deterministically derive the contributor_id from the LinkedIn `sub`.
 * SHA-256 is one-way, so the LinkedIn id can never be recovered from the id;
 * deriving it (rather than storing a map) keeps a stable contributor_id across
 * logins without any storage write — so login never depends on the data store.
 * The first 32 hex chars of the hash are formatted as a UUID-shaped string.
 */
export function deriveContributorId(linkedinId: string): string {
  const h = createHash('sha256').update(linkedinId).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

async function readVerifications(): Promise<Record<string, VerificationRecord>> {
  const parsed = await readJson<Record<string, VerificationRecord>>(VERIFICATIONS_KEY, {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

export async function getVerification(contributorId: string): Promise<VerificationRecord | null> {
  return (await readVerifications())[contributorId] ?? null;
}

/**
 * Write/refresh the verification snapshot for a contributor. Updates only when
 * the profile data has actually changed (or on first auth). Never stores names
 * or emails — only verified role/company/location and a timestamp.
 */
export async function upsertVerification(
  contributorId: string,
  profile: LinkedInProfileData,
): Promise<void> {
  assertWritesAllowed();
  const all = await readVerifications();
  const existing = all[contributorId];

  const unchanged =
    existing &&
    existing.linkedin_verified_title === profile.title &&
    existing.linkedin_verified_company === profile.company &&
    existing.linkedin_location === profile.location;
  if (unchanged) return;

  all[contributorId] = {
    contributor_id: contributorId,
    linkedin_verified_title: profile.title,
    linkedin_verified_company: profile.company,
    linkedin_location: profile.location,
    linkedin_verified_at: new Date().toISOString(),
    verification_version: '1.0',
  };
  await writeJson(VERIFICATIONS_KEY, all);
}
