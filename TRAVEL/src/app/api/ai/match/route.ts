import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { AIService } from "@/services/ai.service";
import { TripsService } from "@/services/trips.service";
import { TravelRequestsService } from "@/services/travel-requests.service";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`ai-match:${ip}`, 20, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { success: false, error: "Trop de recherches. Réessayez plus tard." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const session = await getServerSession(authOptions);

    const demand = await AIService.structureDemand(body);
    const trips = await TripsService.listPublished();
    const matches = await AIService.matchTrips(demand, trips);

    const results = matches
      .map((m) => {
        const trip = trips.find((t) => t.id === m.tripId);
        if (!trip) return null;
        return {
          ...trip,
          compatibility: m.compatibility,
          matchReasons: m.reasons,
        };
      })
      .filter(Boolean);

    if (body.clientEmail) {
      try {
        await TravelRequestsService.createFromMatch(
          body,
          demand,
          results.length,
          session?.user?.id
        );
      } catch (e) {
        console.error("TravelRequest save error:", e);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: demand.summary,
    });
  } catch (error) {
    console.error("AI Match Error:", error);
    return NextResponse.json(
      { success: false, error: "Matching temporairement indisponible." },
      { status: 500 }
    );
  }
}
