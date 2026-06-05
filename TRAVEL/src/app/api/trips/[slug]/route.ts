import { NextResponse } from "next/server";
import { TripsService } from "@/services/trips.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const trip = await TripsService.getBySlug(slug);
    if (!trip) {
      return NextResponse.json({ error: "Voyage introuvable." }, { status: 404 });
    }
    const relatedTrips = await TripsService.listRelatedByAgency(
      trip.agencyId,
      trip.id,
      3
    );
    return NextResponse.json({ trip, relatedTrips });
  } catch (error) {
    console.error("GET /api/trips/[slug]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
