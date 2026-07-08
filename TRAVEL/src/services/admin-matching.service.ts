/**
 * Admin Matching Service for Voyage Maghreb
 * Manages the semi-automated matching workflow:
 * - View suggested matches
 * - Override suggestions
 * - Manually select agencies
 * - Track assignment status
 * - Manage status transitions
 */

import prisma from "@/lib/prisma";
import { MatchingService, type MatchResult } from "@/services/matching.service";
import { TripsService } from "@/services/trips.service";
import type { GroupTrip, TravelRequest } from "@prisma/client";

export interface AdminMatchingViewRequest extends TravelRequest {
  user: { id: string; name: string | null; email: string | null };
}

export interface AdminMatchingViewResult {
  requestId: string;
  destination: string;
  budget: number;
  travelers: number;
  status: string;
  summary: string | null;
  clientName: string;
  clientEmail: string;
  suggestions: {
    tripId: string;
    title: string;
    destination: string;
    startDate: Date;
    totalPrice: number;
    compatibility: number;
    reasons: string[];
  }[];
  assignments: {
    agencyId: string;
    agencyName: string;
    assignmentType: string;
    status: string;
    matchScore: number | null;
    assignedAt: Date;
  }[];
}

export class AdminMatchingService {
  /**
   * Get a request with suggested matches for admin review
   * This is what admins see in the matching interface
   */
  static async getRequestWithSuggestions(
    requestId: string
  ): Promise<AdminMatchingViewResult | null> {
    const request = await prisma.travelRequest.findUnique({
      where: { id: requestId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        agencyAssignments: {
          include: { agency: { select: { id: true, name: true } } },
        } as any, // Type will be correct after migration runs
      },
    });

    if (!request) return null;

    // Get all published trips for matching
    const trips = await TripsService.listPublished();

    // Reconstruct structured demand from request
    const demand = {
      summary: request.aiSummary || "",
      tags: request.aiTags || [],
      complexity: (request.aiComplexity || 1) as 1 | 2 | 3 | 4 | 5,
      destinationNormalized: request.destinationNormalized || request.destination,
      budgetLevel:
        (request.budgetLevel as "low" | "medium" | "high" | "premium") || "medium",
      dominantTripType: request.dominantTripType || request.tripType[0] || "AVENTURE",
      targetDuration: request.durationDays || 7,
      startDate: request.startDate || undefined,
      numberOfSeats: request.numberOfTravelers,
      budgetMax: request.budgetMax,
    };

    // Get suggestions from matching engine
    const matches = MatchingService.findMatches(demand, trips);

    // Enrich suggestions with trip details
    const suggestions = matches.slice(0, 3).map((match) => {
      const trip = trips.find((t) => t.id === match.tripId);
      if (!trip) return null;

      return {
        tripId: trip.id,
        title: trip.title,
        destination: trip.destination,
        startDate: new Date(trip.startDate),
        totalPrice: Number(trip.totalPrice),
        compatibility: match.compatibility,
        reasons: match.reasons,
      };
    }).filter((s): s is AdminMatchingViewResult["suggestions"][number] => s !== null);

    // Get existing assignments (cast to any since types will be correct after migration)
    const assignments = ((request as any).agencyAssignments || []).map((assignment: any) => ({
      agencyId: assignment.agencyId,
      agencyName: assignment.agency.name,
      assignmentType: assignment.assignmentType,
      status: assignment.status,
      matchScore: assignment.matchScore,
      assignedAt: assignment.createdAt,
    }));

    return {
      requestId: request.id,
      destination: request.destination,
      budget: request.budgetMax,
      travelers: request.numberOfTravelers,
      status: request.status,
      summary: request.aiSummary,
      clientName: request.clientName,
      clientEmail: request.clientEmail,
      suggestions,
      assignments,
    };
  }

  /**
   * Assign an agency to a request
   * Can be either from suggested matches or manual selection
   */
  static async assignAgencyToRequest(
    requestId: string,
    agencyId: string,
    assignmentType: "suggested" | "manual" = "manual",
    matchScore?: number,
    matchReasons: string[] = [],
    assignedByUserId?: string
  ): Promise<void> {
    try {
      // Check if assignment already exists
      const existing = await (prisma as any).travelRequestAgencyAssignment.findUnique({
        where: { requestId_agencyId: { requestId, agencyId } },
      });

      if (existing) {
        throw new Error(`Agency ${agencyId} is already assigned to request ${requestId}`);
      }

      // Create assignment
      await (prisma as any).travelRequestAgencyAssignment.create({
        data: {
          requestId,
          agencyId,
          assignmentType,
          matchScore: matchScore || null,
          matchReasons,
          assignedByUserId,
          status: "PENDING",
        },
      });

      // Update request status to ASSIGNED if not already
      const request = await prisma.travelRequest.findUnique({
        where: { id: requestId },
      });

      if (request && request.status === "MATCH_SUGGESTED") {
        await this.updateRequestStatus(
          requestId,
          "ASSIGNED",
          assignedByUserId,
          "Admin assigned agencies to request"
        );
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove an agency assignment
   */
  static async removeAgencyAssignment(
    requestId: string,
    agencyId: string
  ): Promise<void> {
    try {
      await (prisma as any).travelRequestAgencyAssignment.delete({
        where: { requestId_agencyId: { requestId, agencyId } },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update the status of a request and create audit trail
   */
  static async updateRequestStatus(
    requestId: string,
    newStatus: string,
    changedByUserId?: string,
    reason?: string
  ): Promise<void> {
    const request = await prisma.travelRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    const previousStatus = request.status;

    // Update request status
    await prisma.travelRequest.update({
      where: { id: requestId },
      data: { status: newStatus as any },
    });

    // Create status history record (immutable audit trail)
    try {
      await (prisma as any).travelRequestStatusHistory.create({
        data: {
          requestId,
          previousStatus,
          newStatus,
          changedByUserId,
          reason,
        },
      });
    } catch (error) {
      console.error("Status history creation error:", error);
    }
  }

  /**
   * Add an admin note to a request
   */
  static async addNote(
    requestId: string,
    content: string,
    createdByUserId: string,
    isInternal: boolean = true
  ): Promise<void> {
    try {
      await (prisma as any).adminNote.create({
        data: {
          requestId,
          content,
          createdByUserId,
          isInternal,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all notes for a request
   */
  static async getNotes(requestId: string, includeInternal = true) {
    try {
      const notes = await (prisma as any).adminNote.findMany({
        where: {
          requestId,
          ...(includeInternal ? {} : { isInternal: false }),
        },
        orderBy: { createdAt: "desc" },
        include: {
          request: { select: { id: true } },
        },
      });

      return notes;
    } catch (error) {
      console.error("Get notes error:", error);
      return [];
    }
  }

  /**
   * Get status history for a request (immutable audit trail)
   */
  static async getStatusHistory(requestId: string) {
    try {
      const history = await (prisma as any).travelRequestStatusHistory.findMany({
        where: { requestId },
        orderBy: { createdAt: "asc" },
      });

      return history;
    } catch (error) {
      console.error("Get status history error:", error);
      return [];
    }
  }

  /**
   * Get all requests in a specific status (for admin dashboard filtering)
   */
  static async listRequestsByStatus(status: string, limit = 50) {
    const requests = await prisma.travelRequest.findMany({
      where: { status: status as any },
      include: {
        user: { select: { name: true, email: true } },
        agencyAssignments: {
          include: { agency: { select: { name: true } } },
        } as any,
      },
    });

    return requests.map((req: any) => ({
      id: req.id,
      destination: req.destination,
      clientName: req.clientName,
      clientEmail: req.clientEmail,
      budget: req.budgetMax,
      travelers: req.numberOfTravelers,
      status: req.status,
      summary: req.aiSummary,
      createdAt: req.createdAt,
      assignedAgencies: req.agencyAssignments?.map((a: any) => a.agency.name) || [],
    }));
  }

  /**
   * Get admin dashboard overview
   */
  static async getDashboardOverview() {
    const statuses = [
      "SUBMITTED",
      "AI_PROCESSED",
      "MATCH_SUGGESTED",
      "UNDER_REVIEW",
      "ASSIGNED",
      "AGENCY_ACCEPTED",
      "OFFER_RECEIVED",
      "CLIENT_CONFIRMED",
      "PAYMENT_PENDING",
      "PAID",
    ];

    const counts = await Promise.all(
      statuses.map(async (status) => {
        const count = await prisma.travelRequest.count({
          where: { status: status as any },
        });
        return { status, count };
      })
    );

    // Get recent activity
    const recentRequests = await prisma.travelRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    });

    const totalRequests = await prisma.travelRequest.count();

    let assignedCount = 0;
    try {
      const assignedRequests = await (prisma as any).travelRequestAgencyAssignment.groupBy({
        by: ["requestId"],
      });
      assignedCount = assignedRequests.length;
    } catch (error) {
      // Table doesn't exist yet
      assignedCount = 0;
    }

    return {
      totalRequests,
      statusCounts: Object.fromEntries(counts.map((c) => [c.status, c.count])),
      totalAssignedRequests: assignedCount,
      recentRequests: recentRequests.map((r: any) => ({
        id: r.id,
        destination: r.destination,
        clientName: r.clientName,
        status: r.status,
        createdAt: r.createdAt,
      })),
    };
  }

  /**
   * Suggest agencies for a request (called by auto-suggestion)
   * Returns the suggested agencies to be assigned by admin
   */
  static async suggestAgenciesForRequest(requestId: string): Promise<{
    requestId: string;
    suggestions: Array<{
      agencyId: string;
      agencyName: string;
      compatibility: number;
      reasons: string[];
    }>;
  }> {
    const request = await prisma.travelRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    // Reconstruct demand
    const demand = {
      summary: request.aiSummary || "",
      tags: request.aiTags || [],
      complexity: (request.aiComplexity || 1) as 1 | 2 | 3 | 4 | 5,
      destinationNormalized: request.destinationNormalized || request.destination,
      budgetLevel:
        (request.budgetLevel as "low" | "medium" | "high" | "premium") || "medium",
      dominantTripType: request.dominantTripType || request.tripType[0] || "AVENTURE",
      targetDuration: request.durationDays || 7,
      startDate: request.startDate || undefined,
      numberOfSeats: request.numberOfTravelers,
      budgetMax: request.budgetMax,
    };

    // Get trips and match
    const trips = await TripsService.listPublished();
    const matches = MatchingService.findMatches(demand, trips);

    // Build suggestions with best match per agency
    const suggestions: Array<{
      agencyId: string;
      agencyName: string;
      compatibility: number;
      reasons: string[];
    }> = [];

    for (const match of matches) {
      const trip = trips.find((t) => t.id === match.tripId);
      if (!trip) continue;

      const agency = await prisma.agency.findUnique({
        where: { id: trip.agencyId },
      });

      if (!agency) continue;

      // Check if already suggested
      if (!suggestions.some((s) => s.agencyId === trip.agencyId)) {
        suggestions.push({
          agencyId: trip.agencyId,
          agencyName: agency.name,
          compatibility: match.compatibility,
          reasons: match.reasons,
        });
      }

      if (suggestions.length >= 3) break;
    }

    return {
      requestId,
      suggestions,
    };
  }
}
