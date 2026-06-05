import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { buildMatchDisplay } from "@/lib/build-match-display";
import { logAiCall, withTimeout } from "@/lib/ai-call-log";
import { buildNextDeparturesScores } from "@/lib/match-fallback";
import { AIService, type TravelRequestData } from "@/services/ai.service";
import { TripsService } from "@/services/trips.service";
import { TravelRequestsService } from "@/services/travel-requests.service";
import { AiNotifyService } from "@/services/ai-notify.service";
import { aiMatchSchema, formatZodError } from "@/lib/api-schemas";

const AI_MATCH_TIMEOUT_MS = 5000;

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`ai-match:${ip}`, 20, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { success: false, error: "Trop de recherches. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const started = Date.now();
  let body: Record<string, unknown> = {};
  let matchBody = {} as TravelRequestData & {
    clientEmail: string;
    clientName: string;
  };

  try {
    const raw = await req.json();
    const parsed = aiMatchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    body = parsed.data as Record<string, unknown>;
    const session = await getServerSession(authOptions);

    const clientEmail =
      String(body.clientEmail || "").trim() ||
      (session?.user?.role === "CLIENT" ? session.user.email?.trim() : "") ||
      "";
    const clientName =
      String(body.clientName || "").trim() ||
      (session?.user?.name?.trim() || "Voyageur");

    matchBody = {
      ...body,
      clientEmail: clientEmail || String(body.clientEmail || ""),
      clientName,
    } as TravelRequestData & { clientEmail: string; clientName: string };

    const trips = await TripsService.listPublished();

    let demand;
    let scored;
    let forcedFallback = false;

    try {
      demand = await withTimeout(
        AIService.structureDemand(matchBody),
        AI_MATCH_TIMEOUT_MS
      );
      scored = await AIService.matchTrips(demand, trips);
    } catch (structError) {
      forcedFallback = true;
      demand = AIService.structureDemandHeuristic(matchBody);
      scored = buildNextDeparturesScores(trips);
      await logAiCall({
        operation: "MATCH",
        success: false,
        durationMs: Date.now() - started,
        error:
          structError instanceof Error ? structError.message : "structure_failed",
      });
    }

    if (!forcedFallback) {
      await logAiCall({
        operation: "MATCH",
        success: true,
        durationMs: Date.now() - started,
      });
    }

    const { results, matchMode, qualifiedCount, summary, fallbackSectionTitle, noExactMatchMessage } =
      buildMatchDisplay(demand, trips, scored);

    const effectiveMode = forcedFallback ? "fallback" : matchMode;
    const qualifiedResults = results.filter((r) => !r.isFallback);

    let savedRequestId: string | undefined;

    if (clientEmail) {
      try {
        const saved = await TravelRequestsService.createFromMatch(
          matchBody as unknown as Record<string, unknown>,
          demand,
          qualifiedResults.length,
          session?.user?.id
        );
        savedRequestId = saved.id;
      } catch (e) {
        console.error("TravelRequest save error:", e);
      }

      if (qualifiedResults.length > 0) {
        void AiNotifyService.notifyAgenciesForMatches(
          qualifiedResults.map((r) => ({
            id: String(r.id),
            title: String(r.title),
            destination: String(r.destination),
            agencyId: String(r.agencyId),
            compatibility:
              typeof r.compatibility === "number" ? r.compatibility : undefined,
          })),
          demand,
          {
            name: clientName,
            email: clientEmail,
            travelers: Number(body.numberOfTravelers) || demand.numberOfSeats,
          },
          savedRequestId
        );
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary,
      matchMode: effectiveMode,
      qualifiedCount: qualifiedCount ?? qualifiedResults.length,
      travelRequestId: savedRequestId,
      fallbackSectionTitle,
      noExactMatchMessage,
    });
  } catch (error) {
    console.error("AI Match Error:", error);
    await logAiCall({
      operation: "MATCH",
      success: false,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : "unknown",
    });

    try {
      const trips = await TripsService.listPublished();
      const fallbackScores = buildNextDeparturesScores(trips);
      const demand = AIService.structureDemandHeuristic(
        matchBody as TravelRequestData
      );
      const { results, summary, fallbackSectionTitle, noExactMatchMessage } =
        buildMatchDisplay(demand, trips, fallbackScores);

      return NextResponse.json({
        success: true,
        results,
        summary: summary || "Voici les prochains départs disponibles.",
        matchMode: "fallback",
        qualifiedCount: 0,
        fallbackSectionTitle,
        noExactMatchMessage,
      });
    } catch {
      return NextResponse.json(
        { success: false, error: "Matching temporairement indisponible." },
        { status: 500 }
      );
    }
  }
}
