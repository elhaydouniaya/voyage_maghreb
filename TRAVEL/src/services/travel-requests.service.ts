import prisma from "@/lib/prisma";
import { findOrCreateGuestUser } from "@/lib/guest-user";
import { sendTravelRequestReceivedEmail } from "@/lib/booking-emails";
import { buildMatchDisplay } from "@/lib/build-match-display";
import { AIService, type StructuredDemand } from "@/services/ai.service";
import { TripsService } from "@/services/trips.service";

export class TravelRequestsService {
  static async createFromMatch(
    body: Record<string, unknown>,
    demand: StructuredDemand,
    /** Nombre de voyages avec score IA >= seuil (pas les suggestions fallback). */
    qualifiedMatchCount: number,
    userId?: string
  ) {
    const clientEmail = String(body.clientEmail || "").trim().toLowerCase();
    const clientName = String(body.clientName || "Voyageur").trim();

    let resolvedUserId = userId;
    if (!resolvedUserId && clientEmail) {
      resolvedUserId = await findOrCreateGuestUser(clientEmail, clientName);
    }
    if (!resolvedUserId) {
      throw new Error("Impossible d'enregistrer la demande sans email.");
    }

    const request = await prisma.travelRequest.create({
      data: {
        userId: resolvedUserId,
        destination: String(body.destination || demand.destinationNormalized),
        isDateFlexible: Boolean(body.isDateFlexible),
        startDate: body.startDate ? new Date(String(body.startDate)) : demand.startDate,
        endDate: body.endDate ? new Date(String(body.endDate)) : undefined,
        durationDays: demand.targetDuration,
        numberOfTravelers: Number(body.numberOfTravelers) || demand.numberOfSeats,
        adults: Number(body.adults) || Number(body.numberOfTravelers) || 1,
        children: Number(body.children) || 0,
        budgetMax: Number(body.budgetMax) || demand.budgetMax,
        tripType: Array.isArray(body.tripType)
          ? (body.tripType as string[])
          : [demand.dominantTripType],
        tripStyle: Array.isArray(body.tripStyle) ? (body.tripStyle as string[]) : [],
        accommodation: body.accommodation ? String(body.accommodation) : undefined,
        transportIncluded: Boolean(body.transportIncluded),
        activities: Array.isArray(body.activities) ? (body.activities as string[]) : [],
        constraints: body.constraints ? String(body.constraints) : undefined,
        language: body.language ? String(body.language) : "FR",
        clientName,
        clientEmail,
        clientPhone: body.clientPhone ? String(body.clientPhone) : undefined,
        aiSummary: demand.summary,
        aiTags: demand.tags,
        aiComplexity: demand.complexity,
        destinationNormalized: demand.destinationNormalized,
        budgetLevel: demand.budgetLevel,
        dominantTripType: demand.dominantTripType,
        status: qualifiedMatchCount > 0 ? "MATCH_SUGGESTED" : "AI_PROCESSED",
      },
    });

    if (clientEmail) {
      try {
        await sendTravelRequestReceivedEmail({
          to: clientEmail,
          clientName,
          destination: request.destination,
          summary: demand.summary,
          travelRequestId: request.id,
        });
      } catch (e) {
        console.error("Travel request email E1:", e);
      }
    }

    return request;
  }

  /** Lie une demande IA récente si le booking n'en a pas encore. */
  static async resolveRequestIdForUser(
    userId: string,
    explicitId?: string
  ): Promise<string | undefined> {
    if (explicitId) return explicitId;
    const latest = await prisma.travelRequest.findFirst({
      where: {
        userId,
        status: { in: ["MATCH_SUGGESTED", "AI_PROCESSED", "CLIENT_CONFIRMED"] },
      },
      orderBy: { createdAt: "desc" },
    });
    return latest?.id;
  }

  static async markPaymentPending(travelRequestId: string) {
    await prisma.travelRequest.updateMany({
      where: {
        id: travelRequestId,
        status: {
          in: ["SUBMITTED", "AI_PROCESSED", "MATCH_SUGGESTED", "CLIENT_CONFIRMED"],
        },
      },
      data: { status: "PAYMENT_PENDING" },
    });
  }

  /** Appelé après confirmation de paiement (Stripe ou démo). */
  static async markPaidForBooking(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, travelRequestId: true, userId: true },
    });
    if (!booking) return;

    const requestId =
      booking.travelRequestId ||
      (await this.resolveRequestIdForUser(booking.userId));

    if (!requestId) return;

    await prisma.travelRequest.update({
      where: { id: requestId },
      data: { status: "PAID" },
    });

    if (!booking.travelRequestId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { travelRequestId: requestId },
      });
    }
  }

  static demandFromStoredRequest(
    r: Awaited<ReturnType<typeof prisma.travelRequest.findUnique>>
  ): StructuredDemand | null {
    if (!r) return null;
    const budgetLevel = r.budgetLevel;
    return {
      summary: r.aiSummary || `Voyage à ${r.destination} pour ${r.numberOfTravelers} personnes.`,
      tags: r.aiTags?.length ? r.aiTags : r.tripType.map((t) => t.toLowerCase()),
      complexity:
        r.aiComplexity >= 1 && r.aiComplexity <= 5
          ? (r.aiComplexity as 1 | 2 | 3 | 4 | 5)
          : 2,
      destinationNormalized:
        r.destinationNormalized ||
        r.destination
          .toLowerCase()
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""),
      budgetLevel:
        budgetLevel === "low" ||
        budgetLevel === "medium" ||
        budgetLevel === "high" ||
        budgetLevel === "premium"
          ? budgetLevel
          : r.budgetMax < 800
            ? "low"
            : r.budgetMax < 1800
              ? "medium"
              : r.budgetMax < 3500
                ? "high"
                : "premium",
      dominantTripType: r.dominantTripType || r.tripType[0] || "AVENTURE",
      targetDuration: r.durationDays || 7,
      startDate: r.startDate ?? undefined,
      numberOfSeats: r.numberOfTravelers,
      budgetMax: r.budgetMax,
    };
  }

  static canAccessRequest(
    request: { userId: string; clientEmail: string },
    session?: { user?: { id?: string; role?: string } | null } | null,
    email?: string | null
  ): boolean {
    if (session?.user?.role === "ADMIN") return true;
    if (session?.user?.id && session.user.id === request.userId) return true;
    const normalized = email?.trim().toLowerCase();
    if (normalized && normalized === request.clientEmail.toLowerCase()) {
      return true;
    }
    return false;
  }

  /** Recharge les voyages recommandés pour un lien email / voyages?request=… */
  static async getRecommendationsForRequest(requestId: string) {
    const request = await prisma.travelRequest.findUnique({
      where: { id: requestId },
    });
    const demand = this.demandFromStoredRequest(request);
    if (!demand) return null;

    const trips = await TripsService.listPublished();
    const scored = await AIService.matchTrips(demand, trips);
    const display = buildMatchDisplay(demand, trips, scored);

    return {
      ...display,
      travelRequestId: request!.id,
      destination: request!.destination,
    };
  }

  static statusLabel(status: string): string {
    const map: Record<string, string> = {
      SUBMITTED: "Soumise",
      AI_PROCESSED: "Analysée",
      MATCH_SUGGESTED: "Correspondances trouvées",
      CLIENT_CONFIRMED: "Confirmée",
      PAYMENT_PENDING: "Paiement en cours",
      PAID: "Acompte payé",
      CLOSED: "Clôturée",
      CANCELLED: "Annulée",
    };
    return map[status] || status;
  }

  static async listForUser(userId: string) {
    const requests = await prisma.travelRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return requests.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      date: r.createdAt.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      summary: r.aiSummary || `Voyage ${r.destination}`,
      destination: r.destination,
      status: r.status,
      statusLabel: TravelRequestsService.statusLabel(r.status),
    }));
  }

  static async listForAdmin() {
    const requests = await prisma.travelRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    const statusLabel: Record<string, string> = {
      SUBMITTED: "Soumise",
      AI_PROCESSED: "IA traitée",
      MATCH_SUGGESTED: "Correspondances",
      CLIENT_CONFIRMED: "Confirmée client",
      PAYMENT_PENDING: "Paiement en cours",
      PAID: "Payée",
      CLOSED: "Clôturée",
      CANCELLED: "Annulée",
    };

    return requests.map((r) => {
      const displayStatus =
        r.status === "MATCH_SUGGESTED"
          ? "MATCHED"
          : r.status === "AI_PROCESSED"
            ? "NO_MATCH"
            : r.status === "SUBMITTED"
              ? "NEW"
              : r.status === "PAID" ||
                  r.status === "CLIENT_CONFIRMED" ||
                  r.status === "PAYMENT_PENDING"
                ? "BOOKED"
                : r.status;

      return {
        id: r.id,
        date: r.createdAt.toLocaleString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        destination: r.destination,
        travelers: r.numberOfTravelers,
        budget: `${Math.round(r.budgetMax)}€`,
        status: displayStatus,
        statusRaw: r.status,
        statusLabel: statusLabel[r.status] || r.status,
        clientName: r.clientName || r.user?.name || "Invité",
        clientEmail: r.clientEmail || r.user?.email || "—",
        summary: r.aiSummary,
      };
    });
  }
}
