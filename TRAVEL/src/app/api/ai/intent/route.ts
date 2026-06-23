import { NextResponse } from "next/server";
import { AIService } from "@/services/ai.service";
import type { SessionContext } from "@/services/ai.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/intent
 *
 * Body:
 *   { user_message: string, session_context?: SessionContext }
 *
 * Response:
 *   IntentResult (strict JSON — no natural language)
 *
 * This endpoint is a pure decision engine.
 * It never answers the user directly.
 * All DB / Redis / history operations are handled by the caller.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const userMessage: string  = (body.user_message || "").toString().trim();
    const sessionContext: SessionContext = body.session_context ?? {};

    if (!userMessage) {
      return NextResponse.json(
        {
          intent: "unknown",
          destination: null,
          budget: null,
          dates: null,
          people: null,
          travel_type: null,
          missing_information: ["user_message"],
          action: "ask_user",
        },
        { status: 400 }
      );
    }

    const result = await AIService.extractIntent(userMessage, sessionContext);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/ai/intent", error);
    return NextResponse.json(
      {
        intent: "unknown",
        destination: null,
        budget: null,
        dates: null,
        people: null,
        travel_type: null,
        missing_information: [],
        action: "ask_user",
      },
      { status: 500 }
    );
  }
}
