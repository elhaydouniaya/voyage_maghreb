/** Score minimum (sur 18 pts CDC) pour considérer un vrai match IA. */
export const MATCH_MIN_SCORE = 6;

/** Compatibilité % minimale affichée comme « vrai » match (≈ 6/18). */
export const MATCH_MIN_COMPATIBILITY = 34;

export type TripScoreLike = {
  score: number;
  compatibility: number;
  reasons?: string[];
};

export function isQualifiedMatch(match: TripScoreLike): boolean {
  return (
    match.score >= MATCH_MIN_SCORE ||
    match.compatibility >= MATCH_MIN_COMPATIBILITY
  );
}

export function isFallbackMatch(match: TripScoreLike): boolean {
  const reasons = match.reasons || [];
  return (
    match.score === 0 &&
    reasons.length === 1 &&
    reasons[0] === "Prochain départ disponible"
  );
}
