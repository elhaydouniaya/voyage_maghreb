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
    const dashboard = await AgenciesService.getDashboardForUser(session.user.id);
    if (!dashboard) {
      return NextResponse.json({ error: "Agence introuvable." }, { status: 404 });
    }
    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("GET /api/agency/dashboard", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
