import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AgencyLeadsService } from "@/services/agency-leads.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENCY") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const data = await AgencyLeadsService.getNotifications(session.user.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/agency/notifications", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
