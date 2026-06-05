import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { TripsService } from "@/services/trips.service";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENCY") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const trip = await TripsService.publishTrip(session.user.id, id);
    return NextResponse.json({ trip });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Publication impossible.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
