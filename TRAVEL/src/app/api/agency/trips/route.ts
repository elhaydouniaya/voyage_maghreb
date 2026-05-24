import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { TripsService } from "@/services/trips.service";
import type { TripType, PhysicalLevel } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENCY") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const trips = await TripsService.listForAgency(session.user.id);
    if (!trips) {
      return NextResponse.json({ error: "Agence introuvable." }, { status: 404 });
    }
    return NextResponse.json({ trips });
  } catch (error) {
    console.error("GET /api/agency/trips", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENCY") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const inclusions = body.inclusionsText
      ? String(body.inclusionsText)
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : body.inclusions || [];
    const exclusions = body.exclusionsText
      ? String(body.exclusionsText)
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : body.exclusions || [];

    const trip = await TripsService.createForAgency(session.user.id, {
      title: body.title,
      destination: body.destination,
      tripType: body.tripType as TripType,
      startDate: body.startDate,
      endDate: body.endDate,
      totalSpots: Number(body.totalSpots),
      meetingPoint: body.meetingPoint,
      totalPrice: Number(body.totalPrice),
      depositAmount: Number(body.depositAmount),
      currency: body.currency || "EUR",
      description: body.description,
      inclusions,
      exclusions,
      programDays: body.programDays,
      physicalLevel: body.physicalLevel as PhysicalLevel | undefined,
      guideLanguages: body.guideLanguages,
      coverImage: body.coverImage,
      images: body.images,
      publish: body.publish !== false,
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la création.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
