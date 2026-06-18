import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { ExternalReviewsService } from "@/services/external-reviews.service";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Accès réservé aux administrateurs." },
      { status: 403 }
    );
  }

  const result = await ExternalReviewsService.ensureAndList(params.id);

  if (!result) {
    return NextResponse.json({ error: "Agence introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    agency: { id: result.agency.id, name: result.agency.name },
    stats: result.stats,
    platforms: result.platforms,
    reviews: result.reviews,
  });
}
