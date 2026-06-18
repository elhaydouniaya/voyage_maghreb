import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { ReviewsService } from "@/services/reviews.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [reviews, stats] = await Promise.all([
      ReviewsService.listApproved(),
      ReviewsService.getStats(),
    ]);
    return NextResponse.json({ reviews, stats });
  } catch (error) {
    console.error("GET /api/reviews", error);
    return NextResponse.json({ reviews: [], stats: { count: 0, average: 0 } });
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`reviews-post:${ip}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop d'avis soumis. Réessayez plus tard." },
      { status: 429 }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Connexion requise pour publier un avis." },
        { status: 401 }
      );
    }
    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Seuls les voyageurs peuvent publier des avis." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const review = await ReviewsService.create({
      userId: session.user.id,
      authorName: String(body.name || session?.user?.name || ""),
      authorEmail: String(body.email || session?.user?.email || ""),
      rating: Number(body.rating) || 5,
      title: String(body.title || ""),
      content: String(body.content || ""),
      destination: String(body.destination || ""),
      tripDate: body.tripDate ? String(body.tripDate) : undefined,
      groupTripId: body.groupTripId ? String(body.groupTripId) : undefined,
    });

    return NextResponse.json({
      review: { id: review.id, status: review.status },
      message:
        review.status === "APPROVED"
          ? "Merci ! Votre avis est publié."
          : "Merci ! Votre avis sera visible après validation par notre équipe.",
    }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible d'enregistrer l'avis.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
