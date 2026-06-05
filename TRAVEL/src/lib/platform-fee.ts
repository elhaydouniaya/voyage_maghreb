/** Commission plateforme sur les acomptes (Stripe Connect). */
export function getPlatformFeePercent(): number {
  const raw = process.env.PLATFORM_FEE_PERCENT?.trim();
  const n = raw ? Number(raw) : 12;
  if (!Number.isFinite(n) || n < 0 || n > 50) return 12;
  return n;
}

export function computePlatformFeeCents(totalCents: number): number {
  const percent = getPlatformFeePercent();
  return Math.round(totalCents * (percent / 100));
}

export function computeAgencyNetCents(totalCents: number): number {
  return totalCents - computePlatformFeeCents(totalCents);
}
