/**
 * Matching Service for Voyage Maghreb
 * Implements the deterministic 2-Phase matching algorithm from the CDC:
 * Phase 1: Eliminatory Filters
 * Phase 2: Scoring System (Max 18 points)
 * Phase 3: Ranking & Selection
 * Phase 4: Fallback mechanism
 */

import type { GroupTrip } from "@prisma/client";
import type { StructuredDemand } from "@/services/ai.service";

/**
 * Represents a matched trip with score and reasoning
 */
export interface MatchResult {
  tripId: string;
  score: number;
  maxScore: number;
  compatibility: number; // 0-100%
  reasons: string[];
  passed: boolean; // Did it pass Phase 1 filters?
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for destination name matching with tolerance ≤ 2
 */
function levenshteinDistance(a: string, b: string): number {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();

  const matrix: number[][] = Array(bLower.length + 1)
    .fill(null)
    .map(() => Array(aLower.length + 1).fill(0));

  for (let i = 0; i <= aLower.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= bLower.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= bLower.length; j++) {
    for (let i = 1; i <= aLower.length; i++) {
      const indicator = aLower[i - 1] === bLower[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[bLower.length][aLower.length];
}

/**
 * Normalize destination string for comparison
 */
function normalizeDestination(dest: string): string {
  return dest
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove accents
}

/**
 * Check if two destinations are compatible
 * Returns true if:
 * - Exact normalized match
 * - One is substring of other (normalized)
 * - Levenshtein distance ≤ 2
 */
function areDestinationsCompatible(
  tripDest: string,
  demandDest: string
): boolean {
  const trip = normalizeDestination(tripDest);
  const demand = normalizeDestination(demandDest);

  // Exact match
  if (trip === demand) return true;

  // Substring match
  if (trip.includes(demand) || demand.includes(trip)) return true;

  // Levenshtein distance tolerance
  if (levenshteinDistance(trip, demand) <= 2) return true;

  return false;
}

/**
 * Calculate days difference between two dates
 */
function daysDifference(date1: Date, date2: Date): number {
  return Math.abs(
    Math.ceil((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24))
  );
}

/**
 * Check if trip start date is compatible with demand dates
 * Window: [demandDate - 7, demandDate + 14] (per CDC)
 */
function areDatesCompatible(
  tripStartDate: Date,
  demandStartDate: Date | undefined,
  isDateFlexible: boolean
): { compatible: boolean; daysOff: number } {
  if (!demandStartDate) {
    return { compatible: true, daysOff: 0 };
  }

  const diff = daysDifference(tripStartDate, demandStartDate);

  // Minimum flexibility: ±7 days
  const minWindow = 7;
  // Available flexibility (if client allows): ±14 days
  const maxWindow = isDateFlexible ? 14 : minWindow;

  const compatible = diff <= maxWindow;

  return { compatible, daysOff: diff };
}

/**
 * Check if budget is compatible
 */
function isBudgetCompatible(
  tripPrice: number,
  demandBudgetMax: number
): { compatible: boolean; ratio: number } {
  const ratio = tripPrice / demandBudgetMax;
  const compatible = ratio <= 1.0; // Trip price must be ≤ client budget

  return { compatible, ratio };
}

/**
 * Main matching algorithm
 * Returns sorted list of matches (top 3, or fallback if no matches)
 */
export class MatchingService {
  /**
   * Score a single trip against demand
   * Returns null if it doesn't pass Phase 1 filters
   */
  static scoreTrip(
    trip: GroupTrip,
    demand: StructuredDemand
  ): MatchResult | null {
    let score = 0;
    const reasons: string[] = [];

    // ─── PHASE 1: Eliminatory Filters ──────────────────────────────────
    // All conditions must be true to proceed

    // Filter 1: Trip must be published
    if (trip.status !== "PUBLISHED") {
      return null;
    }

    // Filter 2: Trip must have available spots
    const availableSpots = trip.totalSpots - trip.bookedSpots - trip.reservedSpots;
    if (availableSpots < demand.numberOfSeats) {
      return null;
    }

    // Filter 3: Trip must be in the future
    const now = new Date();
    if (new Date(trip.startDate) <= now) {
      return null;
    }

    // ─── PHASE 2: Scoring System (Max 18 points) ──────────────────────
    const maxScore = 18;

    // Criterion 1: Compatible destination (+4)
    if (areDestinationsCompatible(trip.destination, demand.destinationNormalized)) {
      score += 4;
      reasons.push("Destination correspondante");
    }

    // Criterion 2: Compatible dates (+3 base, +1 bonus)
    const dateCompat = areDatesCompatible(
      new Date(trip.startDate),
      demand.startDate,
      false // Will be updated if we have isDateFlexible from request
    );
    if (dateCompat.compatible) {
      score += 3;
      reasons.push("Dates compatibles");

      // Bonus: If within ±7 days and client allows flexibility
      if (dateCompat.daysOff <= 7) {
        score += 1;
        reasons.push("Dates très proches");
      }
    }

    // Criterion 3: Compatible budget (+3 base, +1 bonus)
    const budgetCompat = isBudgetCompatible(
      Number(trip.totalPrice),
      demand.budgetMax
    );
    if (budgetCompat.compatible) {
      score += 3;
      reasons.push("Respecte votre budget");

      // Bonus: If price is 80% or less of budget (great deal)
      if (budgetCompat.ratio <= 0.8) {
        score += 1;
        reasons.push("Excellent rapport qualité/prix");
      }
    }

    // Criterion 4: Matching trip type (+2)
    if (trip.tripType === demand.dominantTripType) {
      score += 2;
      reasons.push(`${trip.tripType}: Votre style favori`);
    }

    // Criterion 5: Common tags (+1 per tag, max +4)
    const tripTags = (trip.aiTags || []).map((t) => t.toLowerCase());
    const demandTags = (demand.tags || []).map((t) => t.toLowerCase());
    const commonTags = tripTags.filter((t) => demandTags.includes(t));
    const tagPoints = Math.min(commonTags.length, 4);
    score += tagPoints;
    if (tagPoints > 0) {
      reasons.push(`Intérêts communs: ${commonTags.join(", ")}`);
    }

    // Criterion 6: Available spots (+1)
    // Already passed in Phase 1, so add bonus point
    score += 1;
    // (reason already implicit: trip has spots)

    // ─── Calculate Compatibility Percentage ──────────────────────────
    const compatibility = Math.min(Math.round((score / maxScore) * 100), 100);

    return {
      tripId: trip.id,
      score,
      maxScore,
      compatibility,
      reasons: Array.from(new Set(reasons)), // Remove duplicates
      passed: true,
    };
  }

  /**
   * Match trips against a demand
   * Returns top 3 matches, or fallback if no matches found
   */
  static findMatches(
    demand: StructuredDemand,
    trips: GroupTrip[]
  ): MatchResult[] {
    // ─── PHASE 2: Score all valid trips ───────────────────────────────
    const scoredTrips = trips
      .map((trip) => this.scoreTrip(trip, demand))
      .filter((result): result is MatchResult => result !== null);

    // ─── PHASE 3: Rank and Select ─────────────────────────────────────
    let results = scoredTrips
      .sort((a, b) => {
        // Sort by score descending
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        // Tiebreaker: closest departure date
        const tripA = trips.find((t) => t.id === a.tripId);
        const tripB = trips.find((t) => t.id === b.tripId);

        if (!tripA || !tripB) return 0;

        return (
          new Date(tripA.startDate).getTime() -
          new Date(tripB.startDate).getTime()
        );
      })
      .slice(0, 3); // Top 3 results

    // ─── PHASE 4: Fallback Mechanism ──────────────────────────────────
    // If no matches found, return next 3 published future departures
    if (results.length === 0) {
      const maxScore = 18;
      const nextTrips = trips
        .filter((t) => t.status === "PUBLISHED" && new Date(t.startDate) > new Date())
        .sort((a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        )
        .slice(0, 3)
        .map((trip) => ({
          tripId: trip.id,
          score: 0,
          maxScore,
          compatibility: 0,
          reasons: ["Prochain départ disponible"],
          passed: false,
        }));

      results = nextTrips;
    }

    return results;
  }

  /**
   * Get detailed debugging info for a match (for admin/testing)
   */
  static getMatchDebugInfo(
    trip: GroupTrip,
    demand: StructuredDemand
  ): Record<string, unknown> {
    return {
      trip: {
        id: trip.id,
        destination: trip.destination,
        startDate: trip.startDate,
        totalPrice: trip.totalPrice,
        tripType: trip.tripType,
        aiTags: trip.aiTags,
        availableSpots: trip.totalSpots - trip.bookedSpots - trip.reservedSpots,
      },
      demand: {
        destination: demand.destinationNormalized,
        startDate: demand.startDate,
        budgetMax: demand.budgetMax,
        dominantTripType: demand.dominantTripType,
        tags: demand.tags,
        numberOfSeats: demand.numberOfSeats,
      },
      matching: {
        destinationMatch: areDestinationsCompatible(
          trip.destination,
          demand.destinationNormalized
        ),
        dateMatch: areDatesCompatible(
          new Date(trip.startDate),
          demand.startDate,
          false
        ),
        budgetMatch: isBudgetCompatible(
          Number(trip.totalPrice),
          demand.budgetMax
        ),
        typeMatch: trip.tripType === demand.dominantTripType,
      },
    };
  }
}
