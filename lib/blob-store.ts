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
  return !!process.env.BLOB_READ_WRITE_TOKEN;
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
