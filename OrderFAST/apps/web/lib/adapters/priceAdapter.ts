/**
 * Converts price from backend Piasters (e.g. 2000) to frontend EGP (20.00).
 */
export function piastersToEgp(piasters: number | string | null | undefined): number {
  if (piasters === null || piasters === undefined) return 0;
  const num = typeof piasters === 'string' ? parseFloat(piasters) : piasters;
  return Math.round((num / 100) * 100) / 100;
}

/**
 * Converts price from frontend EGP (e.g. 20.5) to backend Piasters (2050).
 */
export function egpToPiasters(egp: number | string | null | undefined): number {
  if (egp === null || egp === undefined) return 0;
  const num = typeof egp === 'string' ? parseFloat(egp) : egp;
  return Math.round(num * 100);
}
