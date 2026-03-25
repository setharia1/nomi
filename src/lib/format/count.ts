/** Consistent engagement number formatting from real numeric state */
export function formatEngagementCount(n: number): string {
  const v = Math.max(0, Math.floor(n));
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}
