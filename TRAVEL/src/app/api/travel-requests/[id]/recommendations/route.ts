import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { TravelRequestsService } from "@/services/travel-requests.service";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ success: false, error: "Identifiant manquant." }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    const request = await prisma.travelRequest.findUnique({
      where: { id: id.trim() },
      select: { id: true, userId: true, clientEmail: true },
    });
    if (!request) {
      return NextResponse.json({ success: false, error: "Demande introuvable." }, { status: 404 });
    }

    if (!TravelRequestsService.canAccessRequest(request, session, email)) {
      return NextResponse.json(
        { success: false, error: "Accès non autorisé à cette demande." },
        { status: 403 }
      );
    }

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
