import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// JSON store abstraction.
//   Production (Vercel): BLOB_READ_WRITE_TOKEN is present → use Vercel Blob.
//   Local dev / scripts: no token → read/write data/<key> on disk, exactly as
//                         the file-based stores did before.
// Each "key" is a stable file name (e.g. 'tokens.json'). Callers handle their
// own shape; this layer only does JSON read/write.
// ---------------------------------------------------------------------------

function useBlob(): boolean {
  // Vercel Blob is available when EITHER a static read-write token is set, OR
  // the project is connected to a Blob store via OIDC. Vercel's current Blob
  // integration no longer auto-injects BLOB_READ_WRITE_TOKEN — it injects
  // BLOB_STORE_ID and provides a per-request OIDC token. The @vercel/blob SDK
  // (resolveBlobAuth) authenticates automatically from BLOB_STORE_ID + that
  // OIDC token, so detecting either credential is enough to prefer Blob over
  // the local-fs fallback.
  return !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function localPath(key: string): string {
  return path.join(process.cwd(), 'data', key);
}

/**
 * Read a JSON value stored under `key`. Returns `fallback` when the store has
 * no value yet or the stored content can't be parsed.
 */
export async function readJson<T>(key: string, fallback: T): Promise<T> {
  if (useBlob()) {
    try {
      const { list } = await import('@vercel/blob');
      const { blobs } = await list({ prefix: key });
      const match = blobs.find(b => b.pathname === key);
      if (!match) return fallback;
      // Cache-bust: overwritten blobs keep the same URL but the CDN may serve a
      // stale copy without this.
      const res = await fetch(`${match.url}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return fallback;
      return (await res.json()) as T;
    } catch {
      return fallback;
    }
  }

  const file = localPath(key);
  if (!existsSync(file)) return fallback;
  try {
    return JSON.parse(readFileSync(file, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

/**
 * Write a JSON value under `key`, overwriting any previous value.
 */
export async function writeJson(key: string, value: unknown): Promise<void> {
  const serialized = JSON.stringify(value, null, 2);

  if (useBlob()) {
    const { put } = await import('@vercel/blob');
    await put(key, serialized, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return;
  }

  writeFileSync(localPath(key), serialized);
}
