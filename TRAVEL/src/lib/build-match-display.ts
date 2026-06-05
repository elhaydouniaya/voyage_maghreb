import { isQualifiedMatch } from "@/lib/matching-config";
import {
  CDC_FALLBACK_SECTION_TITLE,
  CDC_NO_EXACT_MATCH_MSG,
} from "@/lib/match-fallback";
import type { StructuredDemand, TripScore } from "@/services/ai.service";

export type PublishedTripForMatch = {
  id: string;
  slug: string;
  title: string;
  destination: string;
  startDate: string | Date;
  totalPrice: number | string;
  bookedSpots: number;
  totalSpots: number;
  tripType: string;
  status?: string;
  coverImage?: string;
  inclusions?: string[];
  agencyId?: string;
  [key: string]: unknown;
};

export function buildMatchDisplay(
  demand: StructuredDemand,
  trips: PublishedTripForMatch[],
  scored: TripScore[]
) {
  const qualifiedScored = scored.filter((m) => isQualifiedMatch(m));
  const usedFallback = qualifiedScored.length === 0 && scored.length > 0;
  const toDisplay = qualifiedScored.length > 0 ? qualifiedScored : scored;

  const results = toDisplay
    .map((m) => {
      const trip = trips.find((t) => t.id === m.tripId);
      if (!trip) return null;
      return {
        ...trip,
        compatibility: m.compatibility,
        matchReasons: m.reasons,
        matchScore: m.score,
        isFallback: usedFallback,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r != null)
    .slice(0, 3);

  const qualifiedResults = results.filter((r) => !r.isFallback);

  return {
    results,
    summary: demand.summary,
    matchMode: usedFallback ? ("fallback" as const) : ("qualified" as const),
    qualifiedCount: qualifiedResults.length,
    fallbackSectionTitle: usedFallback ? CDC_FALLBACK_SECTION_TITLE : undefined,
    noExactMatchMessage: usedFallback ? CDC_NO_EXACT_MATCH_MSG : undefined,
  };
}
