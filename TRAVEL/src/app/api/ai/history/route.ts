import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { TravelRequestsService } from "@/services/travel-requests.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }
  if (session.user.role !== "CLIENT") {
    return NextResponse.json(
      { error: "Historique réservé aux comptes voyageurs." },
      { status: 403 }
    );
  }

  try {
    const history = await TravelRequestsService.listForUser(session.user.id);
    return NextResponse.json({ history });
  } catch (error) {
    console.error("GET /api/ai/history", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
