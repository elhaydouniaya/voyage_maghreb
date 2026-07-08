/**
 * Matching Algorithm Tests
 * Ensures deterministic behavior and correct scoring
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { MatchingService } from "@/services/matching.service";
import type { GroupTrip } from "@prisma/client";
import type { StructuredDemand } from "@/services/ai.service";
import { Decimal } from "@prisma/client/runtime/library";

// Helper to create a mock trip
function createMockTrip(overrides: Partial<GroupTrip> = {}): GroupTrip {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  return {
    id: "trip-1",
    agencyId: "agency-1",
    title: "Test Trip",
    slug: "test-trip",
    destination: "Marrakech",
    description: "A test trip",
    coverImage: "",
    images: [],
    startDate: futureDate,
    endDate: new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000),
    durationDays: 7,
    totalPrice: new Decimal(1500),
    depositAmount: new Decimal(500),
    currency: "EUR",
    totalSpots: 10,
    bookedSpots: 2,
    reservedSpots: 0,
    tripType: "DESERT",
    season: "SPRING",
    inclusions: [],
    exclusions: [],
    meetingPoint: null,
    programDays: null,
    guideLanguages: [],
    physicalLevel: null,
    aiTags: ["desert", "adventure"],
    status: "PUBLISHED",
    isPublic: true,
    cancelledAt: null,
    cancelReason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// Helper to create a mock demand
function createMockDemand(overrides: Partial<StructuredDemand> = {}): StructuredDemand {
  return {
    summary: "Test demand",
    tags: ["adventure", "desert"],
    complexity: 2,
    destinationNormalized: "marrakech",
    budgetLevel: "medium",
    dominantTripType: "DESERT",
    targetDuration: 7,
    startDate: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    numberOfSeats: 2,
    budgetMax: 2000,
    ...overrides,
  };
}

describe("MatchingService", () => {
  describe("Phase 1: Eliminatory Filters", () => {
    it("should exclude unpublished trips", () => {
      const trip = createMockTrip({ status: "DRAFT" } as any);
      const demand = createMockDemand();

      const result = MatchingService.scoreTrip(trip, demand);

      assert.strictEqual(result, null);
    });

    it("should exclude trips with no available spots", () => {
      const trip = createMockTrip({
        totalSpots: 10,
        bookedSpots: 10,
        reservedSpots: 0,
      } as any);
      const demand = createMockDemand({ numberOfSeats: 2 });

      const result = MatchingService.scoreTrip(trip, demand);

      assert.strictEqual(result, null);
    });

    it("should include trips that pass all filters", () => {
      const trip = createMockTrip({
        status: "PUBLISHED",
        totalSpots: 10,
        bookedSpots: 0,
        reservedSpots: 0,
      } as any);
      const demand = createMockDemand({ numberOfSeats: 2 });

      const result = MatchingService.scoreTrip(trip, demand);

      assert.notStrictEqual(result, null);
      assert.strictEqual(result?.passed, true);
    });
  });

  describe("Phase 2: Scoring System", () => {
    it("should give 4 points for exact destination match", () => {
      const trip = createMockTrip({ destination: "Marrakech" });
      const demand = createMockDemand({ destinationNormalized: "marrakech" });

      const result = MatchingService.scoreTrip(trip, demand);

      assert.ok(result && result.score >= 4);
      assert.ok(result?.reasons.includes("Destination correspondante"));
    });

    it("should calculate compatibility percentage correctly", () => {
      const trip = createMockTrip({
        destination: "Marrakech",
        tripType: "DESERT",
        totalPrice: new Decimal(1200),
      });
      const demand = createMockDemand({
        destinationNormalized: "marrakech",
        dominantTripType: "DESERT",
        budgetMax: 2000,
      });

      const result = MatchingService.scoreTrip(trip, demand);

      if (result?.score && result?.maxScore) {
        const expectedCompatibility = Math.min(
          Math.round((result.score / result.maxScore) * 100),
          100
        );
        assert.strictEqual(result.compatibility, expectedCompatibility);
      }
    });
  });

  describe("Phase 3: Ranking", () => {
    it("should return max 3 results", () => {
      const trips = Array.from({ length: 10 }, (_, i) => {
        const futureDate = new Date(new Date().getTime() + (i + 1) * 24 * 60 * 60 * 1000);
        return createMockTrip({
          id: `trip-${i}`,
          startDate: futureDate,
        });
      });

      const demand = createMockDemand();
      const results = MatchingService.findMatches(demand, trips);

      assert.ok(results.length <= 3);
    });
  });

  describe("Determinism", () => {
    it("should produce same results for same input", () => {
      const trip = createMockTrip({
        destination: "Marrakech",
        tripType: "DESERT",
        totalPrice: new Decimal(1500),
      });
      const demand = createMockDemand({
        destinationNormalized: "marrakech",
        dominantTripType: "DESERT",
        budgetMax: 2000,
      });

      const result1 = MatchingService.scoreTrip(trip, demand);
      const result2 = MatchingService.scoreTrip(trip, demand);

      assert.strictEqual(result1?.score, result2?.score);
      assert.strictEqual(result1?.compatibility, result2?.compatibility);
      assert.deepStrictEqual(result1?.reasons, result2?.reasons);
    });
  });
});
