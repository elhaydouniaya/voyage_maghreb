import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { BehaviorAnalyticsService } from "@/services/behavior-analytics.service";
import { hashIp, inferJourneyStepFromPath } from "@/lib/behavior-events";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import type { JourneyStep, Prisma } from "@prisma/client";

const ALLOWED_STEPS: JourneyStep[] = [
  "PAGE_VIEW",
  "SEARCH_START",
  "AI_MATCH_SUBMIT",
  "TRIP_VIEW",
  "CHECKOUT_START",
  "BOOKING_CONFIRMED",
  "LOGIN",
  "REGISTER",
  "GUIDE_CHAT",
];

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`analytics:${ip}`, 120, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec ?? 60) } }
    );
  }

  try {
    const body = (await request.json()) as {
      step?: JourneyStep;
      path?: string;
      sessionId?: string;
      metadata?: Record<string, unknown>;
      durationMs?: number;
    };

    const session = await getServerSession(authOptions);
    let step = body.step;
    if (!step && body.path) {
      step = inferJourneyStepFromPath(body.path) ?? undefined;
    }

    if (!step || !ALLOWED_STEPS.includes(step)) {
      return NextResponse.json({ error: "Événement invalide." }, { status: 400 });
    }

    await BehaviorAnalyticsService.recordEvent({
      step,
      path: body.path?.slice(0, 500),
      sessionId: body.sessionId?.slice(0, 64),
      userId: session?.user?.id,
      role: session?.user?.role,
      metadata: body.metadata as Prisma.InputJsonValue | undefined,
      ipHash: hashIp(ip),
      durationMs: body.durationMs,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/analytics/track", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
