import type { Agency, GroupTrip } from "@prisma/client";
import { sanitizeImageUrl } from "@/lib/images";
import { getSeasonFromDate } from "@/lib/seasons";

export type TripWithAgency = GroupTrip & { agency?: Agency | null };

export function formatTrip(trip: TripWithAgency) {
  const coverImage = sanitizeImageUrl(trip.coverImage, trip.destination);
  const images = (trip.images?.length ? trip.images : [coverImage]).map((img) =>
    sanitizeImageUrl(img, trip.destination)
  );

  return {
    id: trip.id,
    agencyId: trip.agencyId,
    title: trip.title,
    slug: trip.slug,
    destination: trip.destination,
    description: trip.description,
    coverImage,
    images,
    startDate: trip.startDate.toISOString().split("T")[0],
    endDate: trip.endDate.toISOString().split("T")[0],
    durationDays: trip.durationDays,
    totalPrice: Number(trip.totalPrice),
    depositAmount: Number(trip.depositAmount),
    currency: trip.currency,
    totalSpots: trip.totalSpots,
    bookedSpots: trip.bookedSpots,
    tripType: trip.tripType,
    season: getSeasonFromDate(trip.startDate),
    inclusions: trip.inclusions,
    exclusions: trip.exclusions,
    meetingPoint: trip.meetingPoint,
    programDays: trip.programDays,
    guideLanguages: trip.guideLanguages,
    physicalLevel: trip.physicalLevel,
    aiTags: trip.aiTags,
    status: trip.status,
    isPublic: trip.isPublic,
    agency: trip.agency
      ? {
          id: trip.agency.id,
          name: trip.agency.name,
          email: trip.agency.email,
          phone: trip.agency.phoneNumber,
        }
      : undefined,
  };
}
