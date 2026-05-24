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
    const agency = await AgenciesService.getByUserId(session.user.id);
    if (!agency) {
      return NextResponse.json({ error: "Agence introuvable." }, { status: 404 });
    }

    return NextResponse.json({
      agency: {
        id: agency.id,
        name: agency.name,
        managerName: agency.managerName,
        email: agency.email,
        city: agency.city,
        country: agency.country,
        siret: agency.siret,
        verificationStatus: agency.verificationStatus,
        verificationNote: agency.verificationNote,
        tripCount: agency._count.trips,
        confirmedBookings: agency._count.bookings,
      },
    });
  } catch (error) {
    console.error("GET /api/agency/me", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
