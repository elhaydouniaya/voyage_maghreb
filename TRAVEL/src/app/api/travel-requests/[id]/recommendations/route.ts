import { NextResponse } from "next/server";
import { TravelRequestsService } from "@/services/travel-requests.service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ success: false, error: "Identifiant manquant." }, { status: 400 });
  }

  try {
    const payload = await TravelRequestsService.getRecommendationsForRequest(id.trim());
    if (!payload) {
      return NextResponse.json({ success: false, error: "Demande introuvable." }, { status: 404 });
    }
    return NextResponse.json({ success: true, ...payload });
  } catch (error) {
    console.error("GET travel-requests recommendations:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger les recommandations." },
      { status: 500 }
    );
  }
}
