import { K_ANONYMITY, SUPPRESSION_ORDER } from './constants';
import type { ScorecardParams, SuppressedResult, WeightedRecord } from './types';

// ---------------------------------------------------------------------------
// K-anonymity (K = 15)
// No aggregate output is ever derived from fewer than 15 matched records.
// When a filter combination narrows the peer group below K, attributes are
// suppressed in a fixed order and the match retried. role_tier and
// size_bucket are never suppressed.
// ---------------------------------------------------------------------------

export { K_ANONYMITY };

export interface PeerMatchResult {
  suppressed: false;
  records: WeightedRecord[];
  suppressed_attributes: string[];
}

export type PeerMatch = PeerMatchResult | SuppressedResult;

type SuppressibleAttribute = (typeof SUPPRESSION_ORDER)[number];

const BOARD_ACCESS_NONE = /do(?:n't| not) report to the board/i;

function hasBoardAccess(boardFrequency: string | null | undefined): boolean {
  if (!boardFrequency) return false;
  return !BOARD_ACCESS_NONE.test(boardFrequency);
}

function filterPeers(
  records: WeightedRecord[],
  params: ScorecardParams,
  suppressed: Set<SuppressibleAttribute>,
): WeightedRecord[] {
  return records.filter(r => {
    // Never suppressed
    if (r.role_tier !== params.role_tier) return false;
    if (params.size_bucket && r.size_bucket !== params.size_bucket) return false;

    if (!suppressed.has('metro_tier') && params.metro_tier) {
      if (r.metro_tier !== params.metro_tier) return false;
    }
    if (!suppressed.has('company_structure') && params.company_structure) {
      if (r.company_structure !== params.company_structure) return false;
    }
    if (!suppressed.has('industry') && params.industry) {
      if (r.industry !== params.industry) return false;
    }
    if (params.board_frequency) {
      if (suppressed.has('board_frequency')) {
        // Generalize to has/no board access rather than exact frequency
        if (hasBoardAccess(r.board_frequency) !== hasBoardAccess(params.board_frequency)) {
          return false;
        }
      } else if (r.board_frequency !== params.board_frequency) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Match peers under K-anonymity. Suppresses attributes in SUPPRESSION_ORDER
 * until the peer group reaches K=15, or returns a suppressed response if it
 * never does. Suppressed attributes are reported for the ConfidenceNote.
 */
export function matchPeers(
  records: WeightedRecord[],
  params: ScorecardParams,
): PeerMatch {
  const suppressed = new Set<SuppressibleAttribute>();

  let matched = filterPeers(records, params, suppressed);

  for (const attribute of SUPPRESSION_ORDER) {
    if (matched.length >= K_ANONYMITY) break;
    suppressed.add(attribute);
    matched = filterPeers(records, params, suppressed);
  }

  if (matched.length < K_ANONYMITY) {
    return {
      suppressed: true,
      suppression_reason: `Only ${matched.length} peers match this profile — fewer than the ${K_ANONYMITY} required to display aggregates safely.`,
      suggestion: 'Try removing the industry filter to broaden your peers.',
    };
  }

  return {
    suppressed: false,
    records: matched,
    suppressed_attributes: Array.from(suppressed),
  };
}

/**
 * Server-side guard for any aggregate output (fallback for ad-hoc counts).
 */
export function meetsKAnonymity(n: number): boolean {
  return n >= K_ANONYMITY;
}
