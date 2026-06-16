import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// TEMPORARY one-time admin route — seeds the survey dataset into the connected
// Blob store from within Vercel's runtime (where Blob auth works via OIDC),
// avoiding the need for a local static token. Protected by ADMIN_UPLOAD_SECRET.
// REMOVE this route (and the ADMIN_UPLOAD_SECRET env var) after seeding.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const key = new URL(req.url).searchParams.get('key');
  const secret = process.env.ADMIN_UPLOAD_SECRET;
  if (!secret || key !== secret) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await req.text();

  // Validate it's the sanitized survey array with no emails before storing.
  let records: unknown;
  try {
    records = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }
  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: 'expected a non-empty array' }, { status: 400 });
  }
  const withEmail = (records as Array<Record<string, unknown>>).filter(
    r => r && r.email != null,
  ).length;
  if (withEmail > 0) {
    return NextResponse.json(
      { error: `refusing: ${withEmail} records still carry an email` },
      { status: 400 },
    );
  }

  try {
    const blob = await put('survey.json', body, {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
      addRandomSuffix: false,
    });
    return NextResponse.json({ url: blob.url, records: records.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
