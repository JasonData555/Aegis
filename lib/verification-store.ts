import { createHash, randomUUID } from 'crypto';
import { readJson, writeJson } from './blob-store';

// ---------------------------------------------------------------------------
// LinkedIn identity separation + verification data.
//   linkedin_map.json   — SHA-256(linkedin_id) → contributor_id (UUID). NO
//                          names, emails, or profile data — only the mapping.
//   verifications.json   — per-contributor LinkedIn verification snapshot,
//                          keyed by contributor_id (UUID) only.
// Both go through lib/blob-store (Vercel Blob in prod, data/<key> locally) so
// they work on the read-only serverless filesystem.
// ---------------------------------------------------------------------------

const LINKEDIN_MAP_KEY = 'linkedin_map.json';
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

/** SHA-256 of the LinkedIn `sub` — only the hash is ever persisted. */
export function hashLinkedInId(linkedinId: string): string {
  return createHash('sha256').update(linkedinId).digest('hex');
}

/**
 * Existing hash → returns the stored contributor_id.
 * New hash → generates a UUID contributor_id and stores the mapping.
 */
export async function getOrCreateContributorIdByLinkedIn(linkedinIdHash: string): Promise<{
  contributor_id: string;
  is_new: boolean;
}> {
  const map = await readJson<Record<string, string>>(LINKEDIN_MAP_KEY, {});
  const existing = map[linkedinIdHash];
  if (existing) return { contributor_id: existing, is_new: false };

  assertWritesAllowed();
  const contributor_id = randomUUID();
  map[linkedinIdHash] = contributor_id;
  await writeJson(LINKEDIN_MAP_KEY, map);
  return { contributor_id, is_new: true };
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
