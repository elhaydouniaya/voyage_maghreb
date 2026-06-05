import { NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { ReviewsService } from "@/services/reviews.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = getClientIp(_request);
  const limited = rateLimit(`review-helpful:${ip}`, 30, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de votes. Réessayez plus tard." },
      { status: 429 }
    );
  }

  try {
    const count = await ReviewsService.incrementHelpful(id);
    return NextResponse.json({ helpful: count });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible d'enregistrer le vote.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
