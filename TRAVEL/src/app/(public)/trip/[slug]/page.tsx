import { notFound } from "next/navigation";
import { TripsService } from "@/services/trips.service";
import { formatTrip } from "@/lib/trip-format";
import TripDetailClient, { type EnrichedTrip } from "./TripDetailClient";

export const dynamic = "force-dynamic";

function enrichTrip(found: ReturnType<typeof formatTrip>): EnrichedTrip {
  return {
    id: found.id,
    slug: found.slug,
    title: found.title,
    destination: found.destination,
    description: found.description,
    coverImage: found.coverImage,
    startDate: found.startDate,
    tripType: found.tripType,
    totalPrice: found.totalPrice,
    depositAmount: found.depositAmount,
    totalSpots: found.totalSpots,
    bookedSpots: found.bookedSpots,
    meetingPoint: found.meetingPoint,
    duration: found.durationDays
      ? `${found.durationDays} Jours`
      : "7 Jours",
    agency: found.agency
      ? {
          id: found.agency.id,
          name: found.agency.name,
          rating: 4.9,
          reviews: 120,
        }
      : { name: "MaghrebVoyage Partner", rating: 5.0, reviews: 1 },
    images:
      found.images?.length > 0
        ? found.images
        : [
            found.coverImage ||
              "https://images.unsplash.com/photo-1505051508008-923feaf90180?q=80&w=2070&auto=format&fit=crop",
          ],
    inclusions: found.inclusions || [],
    exclusions: found.exclusions || [],
  };
}

export default async function TripDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const raw = await TripsService.getBySlug(params.slug);

  if (
    !raw ||
    !raw.isPublic ||
    !["PUBLISHED", "FULL"].includes(raw.status)
  ) {
    notFound();
  }

  const trip = enrichTrip(raw);
  const relatedTrips = await TripsService.listRelatedByAgency(raw.agencyId, raw.id, 3);

  return <TripDetailClient trip={trip} relatedTrips={relatedTrips} />;
}
