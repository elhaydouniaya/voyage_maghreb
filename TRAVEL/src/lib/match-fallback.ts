import type { TripScore } from "@/services/ai.service";

export const CDC_FALLBACK_SECTION_TITLE = "Nos prochaines dates disponibles";
export const CDC_NO_EXACT_MATCH_MSG =
  "Aucun voyage ne correspond exactement à vos critères pour l'instant.";

type TripLike = {
  id: string;
  status: string;
  startDate: string | Date;
};

/** CDC C.2 — 3 prochains départs PUBLISHED sans score IA. */
export function buildNextDeparturesScores(trips: TripLike[]): TripScore[] {
  const now = new Date();
  return trips
    .filter((t) => t.status === "PUBLISHED" && new Date(t.startDate) > now)
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    .slice(0, 3)
    .map((t) => ({
      tripId: t.id,
      score: 0,
      compatibility: 0,
      reasons: ["Prochain départ disponible"],
    }));
}
