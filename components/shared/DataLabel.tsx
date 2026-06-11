// Mono data value with a small-caps label. The mono/sans contrast signals
// "precise data value" vs "human language" — never use mono for narrative.

const VALUE_SIZES = {
  large: 'text-[36px]',
  body: 'text-[14px]',
  small: 'text-[12px]',
} as const;

export default function DataLabel({
  label,
  value,
  size = 'body',
  className = '',
}: {
  label: string;
  value: string | number;
  size?: keyof typeof VALUE_SIZES;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className={`font-mono font-normal text-aegis-text-primary ${VALUE_SIZES[size]}`}>
        {value}
      </div>
      <div className="mt-1 text-[12px] font-medium uppercase tracking-[0.05em] text-aegis-text-muted">
        {label}
      </div>
    </div>
  );
}
