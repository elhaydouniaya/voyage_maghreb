import prisma from "@/lib/prisma";
import { findOrCreateGuestUser } from "@/lib/guest-user";
import { sendTravelRequestReceivedEmail } from "@/lib/booking-emails";
import type { StructuredDemand } from "@/services/ai.service";

export class TravelRequestsService {
  static async createFromMatch(
    body: Record<string, unknown>,
    demand: StructuredDemand,
    matchCount: number,
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
        status: matchCount > 0 ? "MATCH_SUGGESTED" : "AI_PROCESSED",
      },
    });

    if (clientEmail) {
      try {
        await sendTravelRequestReceivedEmail({
          to: clientEmail,
          clientName,
          destination: request.destination,
          summary: demand.summary,
        });
      } catch (e) {
        console.error("Travel request email E1:", e);
      }
    }

    return request;
  }

  static async listForUser(userId: string) {
    const requests = await prisma.travelRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return requests.map((r) => ({
      id: r.id,
      date: r.createdAt.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      summary: r.aiSummary || `Voyage ${r.destination}`,
      destination: r.destination,
      status: r.status,
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
