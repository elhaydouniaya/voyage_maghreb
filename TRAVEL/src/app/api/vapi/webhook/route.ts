import { NextResponse } from "next/server";
import crypto from "crypto";
import { isQualifiedMatch } from "@/lib/matching-config";
import { AIService } from "@/services/ai.service";
import { TripsService } from "@/services/trips.service";
import { TravelRequestsService } from "@/services/travel-requests.service";
import { AiNotifyService } from "@/services/ai-notify.service";
import { sendTravelRequestReceivedEmail } from "@/lib/booking-emails";

export const dynamic = "force-dynamic";

/** VAPI / browser health probe (tool calls use POST). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "maghrebvoyage-vapi-webhook",
    methods: ["POST"],
  });
}

const IGNORED_MESSAGE_TYPES = new Set([
  "ping",
  "status-update",
  "conversation-update",
  "speech-update",
  "transcript",
  "hang",
  "end-of-call-report",
]);

function normalizeSignature(signature: string): string {
  const trimmed = signature.trim();
  if (trimmed.includes("=")) {
    const [, value] = trimmed.split("=", 2);
    return (value || trimmed).trim();
  }
  return trimmed;
}

function verifyVapiSignature(raw: string, signature: string | null): boolean {
  const secret = process.env.VAPI_WEBHOOK_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(raw)
    .digest("hex");

  const received = normalizeSignature(signature);

  try {
    const a = Buffer.from(received, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return received === expected;
  }
}

function extractToolCalls(body: Record<string, unknown>) {
  const message = body.message as Record<string, unknown> | undefined;
  const list =
    (message?.toolCallList as unknown[]) ||
    (message?.toolCalls as unknown[]) ||
    (body.toolCallList as unknown[]) ||
    [];

  return list.map((item) => {
    const call = item as Record<string, unknown>;
    const fn = (call.function as Record<string, unknown>) || call;
    const name = String(fn.name || call.name || "");
    let args: Record<string, unknown> = {};
    const rawArgs = fn.arguments ?? call.arguments;
    if (typeof rawArgs === "string") {
      try {
        args = JSON.parse(rawArgs);
      } catch {
        args = {};
      }
    } else if (rawArgs && typeof rawArgs === "object") {
      args = rawArgs as Record<string, unknown>;
    }
    return {
      id: String(call.id || call.toolCallId || ""),
      name,
      args,
    };
  });
}

async function runSearchTrips(args: Record<string, unknown>) {
  const demand = await AIService.structureDemand({
    destination: String(args.destination || "Maghreb"),
    isDateFlexible: Boolean(args.isDateFlexible),
    startDate: args.startDate ? String(args.startDate) : undefined,
    endDate: args.endDate ? String(args.endDate) : undefined,
    duration: Number(args.duration) || 7,
    budgetMax: Number(args.budgetMax) || 1500,
    tripType: Array.isArray(args.tripType)
      ? (args.tripType as string[])
      : ["AVENTURE"],
    numberOfTravelers: Number(args.numberOfTravelers) || 2,
    activities: [],
  });

  const trips = await TripsService.listPublished();
  const matches = await AIService.matchTrips(demand, trips);
  const top = matches.slice(0, 3).map((m) => {
    const trip = trips.find((t) => t.id === m.tripId);
    return trip
      ? {
          title: trip.title,
          destination: trip.destination,
          price: trip.totalPrice,
          compatibility: m.compatibility,
          slug: trip.slug,
        }
      : null;
  });

  return {
    summary: demand.summary,
    trips: top.filter(Boolean),
  };
}

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-vapi-signature");

  if (!verifyVapiSignature(raw, signature)) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const message = body.message as Record<string, unknown> | undefined;
  const messageType = String(message?.type || body.type || "").toLowerCase();
  if (messageType && IGNORED_MESSAGE_TYPES.has(messageType)) {
    return NextResponse.json({ ok: true });
  }

  const toolCalls = extractToolCalls(body);
  if (toolCalls.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const results: { toolCallId: string; result: string }[] = [];

  for (const call of toolCalls) {
    try {
      if (call.name === "search_trips" || call.name === "searchTrips") {
        const data = await runSearchTrips(call.args);
        results.push({
          toolCallId: call.id,
          result: JSON.stringify(data),
        });
        continue;
      }

      if (call.name === "save_travel_request" || call.name === "saveTravelRequest") {
        const clientEmail = String(call.args.clientEmail || "").trim();
        const clientName = String(call.args.clientName || "Voyageur");
        if (!clientEmail) {
          results.push({
            toolCallId: call.id,
            result: "Email client requis.",
          });
          continue;
        }

        const demand = await AIService.structureDemand({
          destination: String(call.args.destination || "Maghreb"),
          isDateFlexible: true,
          budgetMax: Number(call.args.budgetMax) || 1500,
          tripType: ["AVENTURE"],
          numberOfTravelers: Number(call.args.numberOfTravelers) || 2,
        });

        const trips = await TripsService.listPublished();
        const matches = await AIService.matchTrips(demand, trips);
        const qualified = matches.filter((m) => isQualifiedMatch(m));
        const matchResults = qualified
          .slice(0, 5)
          .map((m) => trips.find((t) => t.id === m.tripId))
          .filter(Boolean);

        const saved = await TravelRequestsService.createFromMatch(
          call.args,
          demand,
          matchResults.length,
          undefined
        );

        await sendTravelRequestReceivedEmail({
          to: clientEmail,
          clientName,
          destination: String(call.args.destination || demand.destinationNormalized),
          summary: demand.summary,
          travelRequestId: saved.id,
        });

        if (matchResults.length > 0) {
          void AiNotifyService.notifyAgenciesForMatches(
            matchResults.map((t) => ({
              id: t!.id,
              title: t!.title,
              destination: t!.destination,
              agencyId: t!.agencyId,
            })),
            demand,
            { name: clientName, email: clientEmail },
            saved.id
          );
        }

        results.push({
          toolCallId: call.id,
          result: `Demande enregistrée. ${matchResults.length} voyage(s) avec score IA suffisant. Email de confirmation envoyé.`,
        });
        continue;
      }

      results.push({
        toolCallId: call.id,
        result: `Outil inconnu: ${call.name}`,
      });
    } catch (e) {
      console.error("VAPI tool error:", call.name, e);
      results.push({
        toolCallId: call.id,
        result: "Erreur serveur lors du traitement.",
      });
    }
  }

  return NextResponse.json({ results });
}
