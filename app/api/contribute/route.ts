import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionValue } from '@/lib/auth';
import { addContribution, scoreContribution } from '@/lib/contribution-store';
import { loadSurveyData } from '@/lib/data-loader';
import type { ContributionRecord } from '@/lib/types';

// POST /api/contribute — validate, score, and store a contribution.
// No email address is ever stored in contributions.json. Enforced here at
// the route (email keys stripped from the body) AND in addContribution,
// which aborts the write if any email field survives.

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
}

export async function POST(req: Request) {
  const session = verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const body = { ...((raw ?? {}) as Record<string, unknown>) };

  // Identity separation — drop any email-bearing key before anything else
  for (const key of Object.keys(body)) {
    if (/email/i.test(key)) delete body[key];
  }

  // Required fields
  const role_title = str(body.role_title);
  const role_tier = str(body.role_tier);
  const size_bucket = str(body.size_bucket);
  const industry = str(body.industry);
  const company_structure = str(body.company_structure);
  const reporting_line = str(body.reporting_line);
  const board_frequency = str(body.board_frequency);
  const annual_base = num(body.annual_base);

  const missing = Object.entries({
    role_title,
    role_tier,
    size_bucket,
    industry,
    company_structure,
    reporting_line,
    board_frequency,
    annual_base,
  })
    .filter(([, v]) => v === null)
    .map(([k]) => k);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing or invalid fields: ${missing.join(', ')}` },
      { status: 400 },
    );
  }

  const annual_bonus = num(body.annual_bonus);
  const annual_equity = num(body.annual_equity);
  const has_signing = body.has_signing === true;
  const signing_amount = has_signing ? num(body.signing_amount) : null;
  const team_size = num(body.team_size);
  const equity_entry_confirmed = body.equity_entry_confirmed === true;
  const functions = Array.isArray(body.functions)
    ? body.functions.filter((f): f is string => typeof f === 'string')
    : [];

  // Score against role_tier + size_bucket peers — never reject, flag and weight
  const peers = (await loadSurveyData()).filter(
    r => r.role_tier === role_tier && r.size_bucket === size_bucket,
  );
  const { contribution_confidence, validation_flags } = scoreContribution(
    {
      size_bucket: size_bucket!,
      company_structure: company_structure!,
      annual_base: annual_base!,
      annual_bonus,
      annual_equity,
      team_size,
      has_accel_vest: body.has_accel_vest === true,
      equity_entry_confirmed,
    },
    peers,
    { email_verified: true, domain_plausible: false },
  );

  const now = new Date();
  const record: ContributionRecord = {
    contributor_id: session.contributor_id,
    submitted_at: now.toISOString(),
    survey_year: now.getFullYear(),
    role_title: role_title!,
    role_tier: role_tier!,
    size_bucket: size_bucket!,
    industry: industry!,
    company_structure: company_structure!,
    reporting_line: reporting_line!,
    board_frequency: board_frequency!,
    annual_base: annual_base!,
    annual_bonus,
    annual_equity,
    has_do: body.has_do === true,
    has_indemnification: body.has_indemnification === true,
    has_severance: body.has_severance === true,
    has_accel_vest: body.has_accel_vest === true,
    has_signing,
    signing_amount,
    functions,
    team_size,
    metro_tier: str(body.metro_tier),
    data_version: '1.0',
    contribution_confidence,
    equity_entry_confirmed,
    validation_flags,
  };

  try {
    await addContribution(record);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to store contribution.' },
      { status: 500 },
    );
  }

  if (validation_flags.length > 0) {
    // Review queue — flagged records are inspected periodically, never excluded
    console.log(
      `[aegis review-queue] contribution ${record.contributor_id} flagged: ${validation_flags.join(', ')} (confidence ${contribution_confidence})`,
    );
  }

  return NextResponse.json({
    ok: true,
    contribution_confidence,
    validation_flags,
  });
}
