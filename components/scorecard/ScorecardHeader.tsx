// Role and company profile strip — context line above the cards.

export default function ScorecardHeader({
  roleTitle,
  roleTier,
  industry,
  sizeBucket,
  companyStructure,
}: {
  roleTitle: string;
  roleTier: string;
  industry: string | null;
  sizeBucket: string | null;
  companyStructure: string | null;
}) {
  const parts = [roleTier, industry, sizeBucket, companyStructure].filter(Boolean);
  return (
    <div>
      <h1 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.01em] text-aegis-text-primary">
        {roleTitle}
      </h1>
      <p className="mt-1 text-[13px] text-aegis-text-muted">{parts.join(' · ')}</p>
    </div>
  );
}
