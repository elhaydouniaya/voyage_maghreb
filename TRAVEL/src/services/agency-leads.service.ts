import prisma from "@/lib/prisma";

export class AgencyLeadsService {
  static async listForAgencyUser(userId: string) {
    const agency = await prisma.agency.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!agency) return null;

    const leads = await prisma.agencyLead.findMany({
      where: { agencyId: agency.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        travelRequest: true,
      },
    });

    const tripIds = [...new Set(leads.flatMap((l) => l.matchedTripIds))];
    const trips =
      tripIds.length > 0
        ? await prisma.groupTrip.findMany({
            where: { id: { in: tripIds }, agencyId: agency.id },
            select: { id: true, title: true, slug: true },
          })
        : [];
    const tripMap = new Map(trips.map((t) => [t.id, t]));

    return {
      unreadCount: leads.filter((l) => !l.readAt).length,
      leads: leads.map((l) => ({
        id: l.id,
        read: Boolean(l.readAt),
        createdAt: l.createdAt.toISOString(),
        bestCompatibility: l.bestCompatibility,
        request: {
          id: l.travelRequest.id,
          destination: l.travelRequest.destination,
          clientName: l.travelRequest.clientName,
          clientEmail: l.travelRequest.clientEmail,
          clientPhone: l.travelRequest.clientPhone,
          travelers: l.travelRequest.numberOfTravelers,
          budgetMax: Math.round(l.travelRequest.budgetMax),
          summary: l.travelRequest.aiSummary,
          status: l.travelRequest.status,
        },
        matchedTrips: l.matchedTripIds
          .map((id) => tripMap.get(id))
          .filter(Boolean)
          .map((t) => ({ id: t!.id, title: t!.title, slug: t!.slug })),
      })),
    };
  }

  static async markRead(leadId: string, userId: string) {
    const agency = await prisma.agency.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!agency) throw new Error("Agence introuvable.");

    const lead = await prisma.agencyLead.findFirst({
      where: { id: leadId, agencyId: agency.id },
    });
    if (!lead) throw new Error("Prospect introuvable.");

    await prisma.agencyLead.update({
      where: { id: leadId },
      data: { readAt: new Date() },
    });
  }

  static async markAllRead(userId: string) {
    const agency = await prisma.agency.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!agency) throw new Error("Agence introuvable.");

    await prisma.agencyLead.updateMany({
      where: { agencyId: agency.id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  static async getNotifications(userId: string) {
    const data = await this.listForAgencyUser(userId);
    if (!data) return { count: 0, items: [] };

    const items: {
      id: string;
      title: string;
      detail: string;
      href: string;
      unread: boolean;
    }[] = [];

    for (const lead of data.leads.slice(0, 8)) {
      items.push({
        id: lead.id,
        title: `Prospect IA — ${lead.request.destination}`,
        detail: `${lead.request.clientName} · ${lead.request.travelers} voyageur(s) · ${lead.request.budgetMax}€`,
        href: "/agency/leads",
        unread: !lead.read,
      });
    }

    const pendingBookings = await prisma.booking.count({
      where: {
        agency: { userId },
        status: "PENDING_PAYMENT",
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    if (pendingBookings > 0) {
      items.unshift({
        id: "pending-bookings",
        title: "Réservations en attente de paiement",
        detail: `${pendingBookings} réservation(s) cette semaine`,
        href: "/agency/bookings",
        unread: true,
      });
    }

    return {
      count: data.unreadCount + (pendingBookings > 0 ? 1 : 0),
      items,
    };
  }
}
