import type { TractionResult } from './types';

// ---------------------------------------------------------------------------
// Scorecard narrative — the four card headlines.
// Voice: warm, direct, personal. "You're in the top third," not
// "Your compensation is at the 68th percentile."
// ---------------------------------------------------------------------------

export interface NarrativeInput {
  total_comp_percentile: number;
  comp_position: 'above_market' | 'at_market' | 'below_market';
  peer_n: number;
  traction: TractionResult;
  protection_count: number;
  protection_percentile: number;
}

export interface Narrative {
  compensation_headline: string;
  structure_headline: string;
  protection_headline: string;
  traction_headline: string;
}

function compensationHeadline(percentile: number): string {
  if (percentile >= 90) {
    return "You're in the top 10% of your peer group — your package leads the market.";
  }
  if (percentile >= 75) {
    return "You're in the top quarter of your peer group.";
  }
  if (percentile >= 60) {
    return "You're earning above the typical peer in your group.";
  }
  if (percentile >= 40) {
    return 'Your package is right in line with your peers.';
  }
  if (percentile >= 25) {
    return "You're below the midpoint of your peer group — there may be room to move.";
  }
  return 'Your package trails most of your peers — worth a closer look.';
}

function structureHeadline(traction: TractionResult): string {
  switch (traction.traction_zone) {
    case 'Paragon Leader':
      return 'Broad scope on a high-surface road — your role is built for maximum traction.';
    case 'Specialist Surgeon':
      return 'A focused mandate gripping a demanding environment — precision over breadth.';
    case 'Utility Player':
      return "You're carrying broad scope on a low-surface road — your capability is outrunning your environment.";
    case 'Generalist':
      return 'A foundational role profile — traction builds as your scope and surface grow.';
  }
}

function protectionHeadline(count: number, percentile: number): string {
  if (count === 4) {
    return 'Fully covered — you hold all four key protections.';
  }
  if (count >= 2) {
    return `You hold ${count} of the 4 key protections — stronger coverage than ${percentile}% of your peers.`;
  }
  if (count === 1) {
    return 'You hold 1 of the 4 key protections — most of your downside is uncovered.';
  }
  return 'You have none of the four key protections — this is the first thing to fix.';
}

function tractionHeadline(traction: TractionResult): string {
  const score = traction.traction_score.toFixed(1);
  switch (traction.traction_zone) {
    case 'Paragon Leader':
      return `Your Traction Score of ${score} puts you in the Paragon Leader zone — maximum grip, fully engaged.`;
    case 'Specialist Surgeon':
      return `Your Traction Score of ${score} puts you in the Specialist Surgeon zone — narrow contact, maximum grip.`;
    case 'Utility Player':
      return `Your Traction Score of ${score} puts you in the Utility Player zone — wide tires on a slick road.`;
    case 'Generalist':
      return `Your Traction Score of ${score} puts you in the Generalist zone — building toward productive traction.`;
  }
}

export function generateNarrative(input: NarrativeInput): Narrative {
  return {
    compensation_headline: compensationHeadline(input.total_comp_percentile),
    structure_headline: structureHeadline(input.traction),
    protection_headline: protectionHeadline(
      input.protection_count,
      input.protection_percentile,
    ),
    traction_headline: tractionHeadline(input.traction),
  };
}
