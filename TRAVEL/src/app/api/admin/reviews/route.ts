import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { ReviewsService } from "@/services/reviews.service";
import type { ReviewStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "ALL";

  try {
    const reviews = await ReviewsService.listForAdmin(status);
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("GET /api/admin/reviews", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const status = body.status as ReviewStatus;
    if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }

    const review = await ReviewsService.updateStatus(body.id, status);
    return NextResponse.json({ review: { id: review.id, status: review.status } });
  } catch (error) {
    console.error("PATCH /api/admin/reviews", error);
    return NextResponse.json({ error: "Mise à jour impossible." }, { status: 400 });
  }
}
