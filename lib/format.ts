// Display formatting for data values (always rendered in JetBrains Mono)

export function formatDollarsK(value: number): string {
  return `$${Math.round(value / 1000)}k`;
}

export function formatDollars(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

export function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
