import prisma from "@/lib/prisma";
import { sendAgencyAiMatchLeadEmail } from "@/lib/agency-emails";
import type { StructuredDemand } from "@/services/ai.service";

type MatchedTrip = {
  id: string;
  title: string;
  destination: string;
  agencyId: string;
  compatibility?: number;
};

/**
 * Notifie chaque agence concernée lorsqu'un voyageur obtient un match IA
 * sur au moins un de leurs voyages publiés.
 */
export class AiNotifyService {
  static async notifyAgenciesForMatches(
    matches: MatchedTrip[],
    demand: StructuredDemand,
    client: { name: string; email: string; travelers?: number },
    travelRequestId?: string
  ) {
    if (matches.length === 0) return;

    const byAgency = new Map<string, MatchedTrip[]>();
    for (const trip of matches) {
      const list = byAgency.get(trip.agencyId) || [];
      list.push(trip);
      byAgency.set(trip.agencyId, list);
    }

    const agencies = await prisma.agency.findMany({
      where: {
        id: { in: [...byAgency.keys()] },
        verificationStatus: "VERIFIED",
      },
      select: { id: true, email: true, name: true, managerName: true, notifyBookingsEmail: true },
    });

    await Promise.all(
      agencies.map(async (agency) => {
        if (!agency.notifyBookingsEmail) return;
        const trips = byAgency.get(agency.id) || [];
        if (trips.length === 0) return;

        const bestCompatibility = Math.max(
          ...trips.map((t) => t.compatibility ?? 0)
        );

        const resolvedRequestId =
          travelRequestId ||
          (
            await prisma.travelRequest.findFirst({
              where: { clientEmail: client.email.toLowerCase() },
              orderBy: { createdAt: "desc" },
              select: { id: true },
            })
          )?.id;

        if (resolvedRequestId) {
          try {
            await prisma.agencyLead.upsert({
              where: {
                agencyId_travelRequestId: {
                  agencyId: agency.id,
                  travelRequestId: resolvedRequestId,
                },
              },
              create: {
                agencyId: agency.id,
                travelRequestId: resolvedRequestId,
                matchedTripIds: trips.map((t) => t.id),
                bestCompatibility: bestCompatibility || null,
              },
              update: {
                matchedTripIds: trips.map((t) => t.id),
                bestCompatibility: bestCompatibility || null,
              },
            });
          } catch (e) {
            console.error("AgencyLead upsert:", e);
          }
        }

        try {
          await sendAgencyAiMatchLeadEmail({
            agencyEmail: agency.email,
            agencyName: agency.name,
            managerName: agency.managerName,
            clientName: client.name,
            clientEmail: client.email,
            destination: demand.destinationNormalized || trips[0].destination,
            travelers: client.travelers ?? demand.numberOfSeats,
            budgetMax: demand.budgetMax,
            summary: demand.summary,
            matchedTrips: trips.map((t) => ({
              title: t.title,
              compatibility: t.compatibility,
            })),
            travelRequestId: resolvedRequestId || undefined,
          });
        } catch (e) {
          console.error(`Agency match email (${agency.id}):`, e);
        }
      })
    );
  }
}
