/** Normalise pour comparaison CDC (minuscules, sans accents). */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Distance de Levenshtein entre deux chaînes. */
export function levenshtein(a: string, b: string): number {
  const s = a.length ? a : "";
  const t = b.length ? b : "";
  const m = s.length;
  const n = t.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return dp[n];
}

/** Correspondance destination CDC : inclusion ou tolérance orthographique (Levenshtein). */
export function destinationsMatch(
  tripDestination: string,
  demandNormalized: string,
  maxDistance = 3
): boolean {
  const trip = normalizeForMatch(tripDestination);
  const demand = normalizeForMatch(demandNormalized);
  if (!trip || !demand) return false;
  if (trip.includes(demand) || demand.includes(trip)) return true;

  const tripWords = trip.split(/\s+/).filter(Boolean);
  const demandWords = demand.split(/\s+/).filter(Boolean);
  for (const dw of demandWords) {
    if (dw.length < 3) continue;
    for (const tw of tripWords) {
      if (tw.includes(dw) || dw.includes(tw)) return true;
      if (levenshtein(dw, tw) <= maxDistance) return true;
    }
    if (levenshtein(dw, trip) <= maxDistance + 1) return true;
  }
  return levenshtein(trip, demand) <= maxDistance + 2;
}
