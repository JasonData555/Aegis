import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { executeScorecardQuery } from '@/lib/query-engine';
import type { ScorecardParams } from '@/lib/types';

// POST /api/query — scorecard query endpoint.
// K=15 anonymity is enforced inside executeScorecardQuery (server-side,
// before any aggregate is computed); a too-narrow peer group returns the
// suppressed response object, never partial aggregates.

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
}

function parseParams(body: Record<string, unknown>): ScorecardParams | { error: string } {
  const role_tier = str(body.role_tier);
  if (!role_tier) return { error: 'role_tier is required.' };

  const annual_base = num(body.annual_base);
  if (annual_base === null) return { error: 'annual_base must be a non-negative number.' };

  return {
    mode: body.mode === 'prospective' ? 'prospective' : 'current',
    role_tier,
    industry: str(body.industry),
    company_structure: str(body.company_structure),
    size_bucket: str(body.size_bucket),
    metro_tier: str(body.metro_tier),
    reporting_line: str(body.reporting_line),
    board_frequency: str(body.board_frequency),
    functions: Array.isArray(body.functions)
      ? body.functions.filter((f): f is string => typeof f === 'string')
      : [],
    annual_base,
    annual_bonus: num(body.annual_bonus),
    annual_equity: num(body.annual_equity),
    has_do: body.has_do === true,
    has_indemnification: body.has_indemnification === true,
    has_severance: body.has_severance === true,
    has_accel_vest: body.has_accel_vest === true,
  };
}

export async function POST(req: Request) {
  // Middleware is the primary guard; this is the server-side fallback
  const session = await auth();
  if (!session?.contributor_id) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const params = parseParams((body ?? {}) as Record<string, unknown>);
  if ('error' in params) {
    return NextResponse.json({ error: params.error }, { status: 400 });
  }

  return NextResponse.json(await executeScorecardQuery(params));
}
