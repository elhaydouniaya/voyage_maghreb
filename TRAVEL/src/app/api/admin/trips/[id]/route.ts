import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AdminService } from "@/services/admin.service";
import type { TripStatus } from "@prisma/client";

const ALLOWED: TripStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "FULL",
  "CLOSED",
  "CANCELLED",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const status = body.status as TripStatus;
    if (!ALLOWED.includes(status)) {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }

    const trip = await AdminService.updateTripStatus(id, status);
    return NextResponse.json({ trip: { id: trip.id, status: trip.status } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Mise à jour impossible.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
