import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { TripsService } from "@/services/trips.service";
import type { PhysicalLevel, TripStatus, TripType } from "@prisma/client";

function parseTripBody(body: Record<string, unknown>) {
  const inclusions = body.inclusionsText
    ? String(body.inclusionsText)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : (body.inclusions as string[]) || [];
  const exclusions = body.exclusionsText
    ? String(body.exclusionsText)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : (body.exclusions as string[]) || [];

  return {
    title: String(body.title),
    destination: String(body.destination),
    tripType: body.tripType as TripType,
    startDate: String(body.startDate),
    endDate: String(body.endDate),
    totalSpots: Number(body.totalSpots),
    meetingPoint: body.meetingPoint ? String(body.meetingPoint) : undefined,
    totalPrice: Number(body.totalPrice),
    depositAmount: Number(body.depositAmount),
    currency: body.currency ? String(body.currency) : "EUR",
    description: String(body.description),
    inclusions,
    exclusions,
    programDays: body.programDays ? String(body.programDays) : undefined,
    physicalLevel: body.physicalLevel as PhysicalLevel | undefined,
    guideLanguages: body.guideLanguages as string[] | undefined,
    coverImage: String(body.coverImage),
    images: body.images as string[] | undefined,
    status: body.status as TripStatus | undefined,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENCY") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const trip = await TripsService.getByIdForAgency(session.user.id, params.id);
    if (!trip) {
      return NextResponse.json({ error: "Voyage introuvable." }, { status: 404 });
    }
    return NextResponse.json({ trip });
  } catch (error) {
    console.error("GET /api/agency/trips/[id]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENCY") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.status && !body.title) {
      const trip = await TripsService.updateStatusForAgency(
        session.user.id,
        params.id,
        body.status as TripStatus,
        body.cancelReason ? String(body.cancelReason) : undefined
      );
      return NextResponse.json({ trip });
    }

    const trip = await TripsService.updateForAgency(
      session.user.id,
      params.id,
      parseTripBody(body)
    );
    return NextResponse.json({ trip });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Mise à jour impossible.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENCY") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    await TripsService.deleteForAgency(session.user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Suppression impossible.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
