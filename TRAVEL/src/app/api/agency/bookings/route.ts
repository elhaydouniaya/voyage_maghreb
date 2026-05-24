import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AgenciesService } from "@/services/agencies.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENCY") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const bookings = await AgenciesService.listBookingsForUser(session.user.id);
    if (!bookings) {
      return NextResponse.json({ error: "Agence introuvable." }, { status: 404 });
    }
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("GET /api/agency/bookings", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
