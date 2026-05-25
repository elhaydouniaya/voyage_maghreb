import prisma from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slug";
import { generateTripAiTags } from "@/lib/trip-tags";
import { formatTrip } from "@/lib/trip-format";
import { sendTripCancelledToClientEmail } from "@/lib/booking-emails";
import { sortTripsBySeason } from "@/lib/seasons";
import type { PhysicalLevel, TripStatus, TripType } from "@prisma/client";

export interface CreateTripInput {
  title: string;
  destination: string;
  tripType: TripType;
  startDate: string;
  endDate: string;
  totalSpots: number;
  meetingPoint?: string;
  totalPrice: number;
  depositAmount: number;
  currency?: string;
  description: string;
  inclusions?: string[];
  exclusions?: string[];
  programDays?: string;
  physicalLevel?: PhysicalLevel;
  guideLanguages?: string[];
  coverImage: string;
  images?: string[];
  publish?: boolean;
}

function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function validateTripInput(input: CreateTripInput) {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const minStart = new Date();
  minStart.setDate(minStart.getDate() + 7);

  if (input.title.trim().length < 10) {
    throw new Error("Le titre doit contenir au moins 10 caractères.");
  }
  if (input.description.trim().length < 200) {
    throw new Error("La description doit contenir au moins 200 caractères.");
  }
  if (start <= minStart) {
    throw new Error("La date de départ doit être dans plus de 7 jours.");
  }
  if (end <= start) {
    throw new Error("La date de retour doit être après la date de départ.");
  }
  if (input.totalPrice <= 0) {
    throw new Error("Le prix total doit être supérieur à 0.");
  }
  if (input.depositAmount >= input.totalPrice) {
    throw new Error("L'acompte doit être inférieur au prix total.");
  }
  if (!input.coverImage?.trim()) {
    throw new Error("Une image de couverture est requise.");
  }

  return { start, end };
}

export class TripsService {
  static async listPublished(filters?: {
    destination?: string;
    tripType?: string;
    budgetMax?: number;
    month?: string;
  }) {
    const now = new Date();
    let trips;
    try {
      trips = await prisma.groupTrip.findMany({
      where: {
        status: { in: ["PUBLISHED", "FULL"] },
        isPublic: true,
        startDate: { gt: now },
      },
      include: { agency: true },
      orderBy: [
        { season: "asc" },
        { startDate: "asc" }
      ],
    });
    } catch (error) {
      console.error("TripsService.listPublished DB error:", error);
      return [];
    }

    let filtered = trips;

    if (filters?.destination && filters.destination !== "Toutes les destinations") {
      filtered = filtered.filter((t) =>
        t.destination.toLowerCase().includes(filters.destination!.toLowerCase())
      );
    }
    if (filters?.tripType && filters.tripType !== "TOUS") {
      filtered = filtered.filter((t) => t.tripType === filters.tripType);
    }
    if (filters?.budgetMax) {
      filtered = filtered.filter((t) => Number(t.totalPrice) <= filters.budgetMax!);
    }

    return filtered.map(formatTrip);
  }

  static async getBySlug(slug: string) {
    const trip = await prisma.groupTrip.findUnique({
      where: { slug },
      include: { agency: true },
    });
    if (!trip) return null;
    return formatTrip(trip);
  }

  static async listRelatedByAgency(
    agencyId: string,
    excludeTripId: string,
    limit = 3
  ) {
    const trips = await prisma.groupTrip.findMany({
      where: {
        agencyId,
        id: { not: excludeTripId },
        status: { in: ["PUBLISHED", "FULL"] },
        isPublic: true,
      },
      include: { agency: true },
      take: limit,
      orderBy: { startDate: "asc" },
    });
    return trips.map(formatTrip);
  }

  static async listForAgency(userId: string) {
    const agency = await prisma.agency.findUnique({ where: { userId } });
    if (!agency) return null;

    const trips = await prisma.groupTrip.findMany({
      where: { agencyId: agency.id },
      orderBy: { createdAt: "desc" },
      include: { agency: true },
    });

    return trips.map(formatTrip);
  }

  static async createForAgency(userId: string, input: CreateTripInput) {
    const agency = await prisma.agency.findUnique({ where: { userId } });
    if (!agency) {
      throw new Error("Agence introuvable.");
    }
    if (agency.verificationStatus !== "VERIFIED") {
      throw new Error(
        "Votre compte doit être vérifié avant de publier un voyage."
      );
    }

    const { start, end } = validateTripInput(input);

    const existingSlugs = (
      await prisma.groupTrip.findMany({ select: { slug: true } })
    ).map((t) => t.slug);

    const slug = generateUniqueSlug(input.title, existingSlugs);
    const status: TripStatus = input.publish ? "PUBLISHED" : "DRAFT";

    const tagInput = {
      destination: input.destination.trim(),
      tripType: input.tripType,
      inclusions: input.inclusions || [],
      exclusions: input.exclusions || [],
      physicalLevel: input.physicalLevel,
      guideLanguages: input.guideLanguages || [],
      description: input.description.trim(),
    };

    const trip = await prisma.groupTrip.create({
      data: {
        agencyId: agency.id,
        title: input.title.trim(),
        slug,
        destination: tagInput.destination,
        description: tagInput.description,
        coverImage: input.coverImage.trim(),
        images: input.images || [],
        startDate: start,
        endDate: end,
        durationDays: daysBetween(start, end),
        totalPrice: input.totalPrice,
        depositAmount: input.depositAmount,
        currency: input.currency || "EUR",
        totalSpots: input.totalSpots,
        tripType: input.tripType,
        inclusions: tagInput.inclusions,
        exclusions: tagInput.exclusions,
        meetingPoint: input.meetingPoint,
        programDays: input.programDays,
        physicalLevel: input.physicalLevel,
        guideLanguages: tagInput.guideLanguages,
        aiTags: status === "PUBLISHED" ? generateTripAiTags(tagInput) : [],
        status,
        isPublic: true,
      },
      include: { agency: true },
    });

    if (status === "PUBLISHED") {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      try {
        const { sendTripPublishedEmail } = await import("@/lib/agency-emails");
        await sendTripPublishedEmail({
          agencyEmail: trip.agency.email,
          agencyName: trip.agency.name,
          tripTitle: trip.title,
          magicLink: `${appUrl}/trip/${trip.slug}`,
        });
      } catch (e) {
        console.error("Trip published email:", e);
      }
    }

    return formatTrip(trip);
  }

  static async publishTrip(userId: string, tripId: string) {
    const agency = await prisma.agency.findUnique({ where: { userId } });
    if (!agency || agency.verificationStatus !== "VERIFIED") {
      throw new Error("Publication non autorisée.");
    }

    const trip = await prisma.groupTrip.findFirst({
      where: { id: tripId, agencyId: agency.id },
    });
    if (!trip) throw new Error("Voyage introuvable.");
    if (trip.status !== "DRAFT") {
      throw new Error("Seuls les brouillons peuvent être publiés.");
    }

    const aiTags = generateTripAiTags({
      destination: trip.destination,
      tripType: trip.tripType,
      inclusions: trip.inclusions,
      exclusions: trip.exclusions,
      physicalLevel: trip.physicalLevel,
      guideLanguages: trip.guideLanguages,
      description: trip.description,
    });

    const updated = await prisma.groupTrip.update({
      where: { id: tripId },
      data: { status: "PUBLISHED", aiTags },
      include: { agency: true },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    try {
      const { sendTripPublishedEmail } = await import("@/lib/agency-emails");
      await sendTripPublishedEmail({
        agencyEmail: updated.agency.email,
        agencyName: updated.agency.name,
        tripTitle: updated.title,
        magicLink: `${appUrl}/trip/${updated.slug}`,
      });
    } catch (e) {
      console.error("Trip published email:", e);
    }

    return formatTrip(updated);
  }

  static async getByIdForAgency(userId: string, tripId: string) {
    const agency = await prisma.agency.findUnique({ where: { userId } });
    if (!agency) return null;

    const trip = await prisma.groupTrip.findFirst({
      where: { id: tripId, agencyId: agency.id },
      include: { agency: true },
    });
    return trip ? formatTrip(trip) : null;
  }

  static async updateStatusForAgency(
    userId: string,
    tripId: string,
    status: TripStatus,
    cancelReason?: string
  ) {
    const agency = await prisma.agency.findUnique({ where: { userId } });
    if (!agency) throw new Error("Agence introuvable.");

    const existing = await prisma.groupTrip.findFirst({
      where: { id: tripId, agencyId: agency.id },
    });
    if (!existing) throw new Error("Voyage introuvable.");

    if (status === "CANCELLED") {
      return this.cancelTripForAgency(userId, tripId, cancelReason);
    }

    if (status === "PUBLISHED" && agency.verificationStatus !== "VERIFIED") {
      throw new Error("Votre agence doit être vérifiée pour publier un voyage.");
    }

    const updated = await prisma.groupTrip.update({
      where: { id: tripId },
      data: { status },
      include: { agency: true },
    });

    return formatTrip(updated);
  }

  static async cancelTripForAgency(
    userId: string,
    tripId: string,
    cancelReason?: string
  ) {
    const agency = await prisma.agency.findUnique({ where: { userId } });
    if (!agency) throw new Error("Agence introuvable.");

    const trip = await prisma.groupTrip.findFirst({
      where: { id: tripId, agencyId: agency.id },
    });
    if (!trip) throw new Error("Voyage introuvable.");
    if (trip.status === "CANCELLED") {
      throw new Error("Ce voyage est déjà annulé.");
    }

    const reason = cancelReason?.trim() || "Annulation par l'agence";

    const confirmedBookings = await prisma.booking.findMany({
      where: { groupTripId: tripId, status: "CONFIRMED" },
    });

    await prisma.$transaction(async (tx) => {
      await tx.groupTrip.update({
        where: { id: tripId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: reason,
          bookedSpots: 0,
        },
      });

      for (const b of confirmedBookings) {
        await tx.booking.update({
          where: { id: b.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancellationReason: reason,
          },
        });
      }
    });

    for (const b of confirmedBookings) {
      try {
        await sendTripCancelledToClientEmail({
          to: b.clientEmail,
          clientName: b.clientName,
          tripTitle: trip.title,
          cancelReason: reason,
        });
      } catch (e) {
        console.error("Trip cancel email:", e);
      }
    }

    const updated = await prisma.groupTrip.findUnique({
      where: { id: tripId },
      include: { agency: true },
    });
    return formatTrip(updated!);
  }

  static async updateForAgency(
    userId: string,
    tripId: string,
    input: CreateTripInput & { status?: TripStatus }
  ) {
    const agency = await prisma.agency.findUnique({ where: { userId } });
    if (!agency) throw new Error("Agence introuvable.");

    const existing = await prisma.groupTrip.findFirst({
      where: { id: tripId, agencyId: agency.id },
    });
    if (!existing) throw new Error("Voyage introuvable.");

    if (existing.status === "DRAFT") {
      const { start, end } = validateTripInput(input);
      const nextStatus = input.status ?? existing.status;
      const tagInput = {
        destination: input.destination.trim(),
        tripType: input.tripType,
        inclusions: input.inclusions || [],
        exclusions: input.exclusions || [],
        physicalLevel: input.physicalLevel,
        guideLanguages: input.guideLanguages || existing.guideLanguages,
        description: input.description.trim(),
      };
      const updated = await prisma.groupTrip.update({
        where: { id: tripId },
        data: {
          title: input.title.trim(),
          destination: tagInput.destination,
          description: tagInput.description,
          coverImage: input.coverImage.trim(),
          images: input.images ?? existing.images,
          startDate: start,
          endDate: end,
          durationDays: daysBetween(start, end),
          totalPrice: input.totalPrice,
          depositAmount: input.depositAmount,
          currency: input.currency || existing.currency,
          totalSpots: input.totalSpots,
          tripType: input.tripType,
          inclusions: tagInput.inclusions,
          exclusions: tagInput.exclusions,
          meetingPoint: input.meetingPoint,
          programDays: input.programDays,
          physicalLevel: input.physicalLevel,
          guideLanguages: tagInput.guideLanguages,
          status: nextStatus,
          ...(nextStatus === "PUBLISHED" && existing.status === "DRAFT"
            ? { aiTags: generateTripAiTags(tagInput) }
            : {}),
        },
        include: { agency: true },
      });
      return formatTrip(updated);
    }

    if (!["PUBLISHED", "FULL"].includes(existing.status)) {
      throw new Error("Ce voyage ne peut plus être modifié.");
    }

    const tagInput = {
      destination: existing.destination,
      tripType: existing.tripType,
      inclusions: input.inclusions || [],
      exclusions: input.exclusions || [],
      physicalLevel: input.physicalLevel ?? existing.physicalLevel,
      guideLanguages: input.guideLanguages || existing.guideLanguages,
      description: input.description.trim(),
    };

    const updated = await prisma.groupTrip.update({
      where: { id: tripId },
      data: {
        description: tagInput.description,
        coverImage: input.coverImage.trim(),
        images: input.images ?? existing.images,
        meetingPoint: input.meetingPoint,
        programDays: input.programDays,
        inclusions: tagInput.inclusions,
        exclusions: tagInput.exclusions,
        physicalLevel: tagInput.physicalLevel,
        guideLanguages: tagInput.guideLanguages,
        aiTags: generateTripAiTags(tagInput),
      },
      include: { agency: true },
    });

    return formatTrip(updated);
  }

  static async deleteForAgency(userId: string, tripId: string) {
    const agency = await prisma.agency.findUnique({ where: { userId } });
    if (!agency) throw new Error("Agence introuvable.");

    const trip = await prisma.groupTrip.findFirst({
      where: { id: tripId, agencyId: agency.id },
      include: {
        _count: {
          select: {
            bookings: {
              where: { status: { in: ["CONFIRMED", "PENDING_PAYMENT"] } },
            },
          },
        },
      },
    });

    if (!trip) throw new Error("Voyage introuvable.");

    if (trip._count.bookings > 0) {
      throw new Error(
        "Ce voyage a des réservations actives. Annulez-les avant de supprimer."
      );
    }

    await prisma.groupTrip.delete({ where: { id: tripId } });
    return { success: true };
  }
}
