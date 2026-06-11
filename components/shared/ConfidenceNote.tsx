// Peer count + confidence note shown at the bottom of scorecard cards.

const ATTRIBUTE_LABELS: Record<string, string> = {
  metro_tier: 'metro area',
  company_structure: 'company structure',
  industry: 'industry',
  board_frequency: 'board access frequency',
};

export default function ConfidenceNote({
  weightedN,
  rawN,
  suppressedAttributes = [],
}: {
  weightedN: number;
  rawN: number;
  suppressedAttributes?: string[];
}) {
  const suppressedText =
    suppressedAttributes.length > 0
      ? ` Some filters were broadened to protect anonymity: ${suppressedAttributes
          .map(a => ATTRIBUTE_LABELS[a] ?? a)
          .join(', ')}.`
      : '';

  return (
    <p className="text-[12px] leading-[1.5] text-aegis-text-subtle">
      Based on <span className="font-mono">{weightedN}</span> verified peers (
      <span className="font-mono">{rawN}</span> total).{suppressedText}
    </p>
  );
}
