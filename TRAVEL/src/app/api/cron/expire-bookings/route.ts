import { NextResponse } from "next/server";
import { BookingsService } from "@/services/bookings.service";

export const dynamic = "force-dynamic";

/**
 * Cron: expire PENDING_PAYMENT bookings whose reservation window has passed.
 *
 * Call every 5 minutes:
 *   GET /api/cron/expire-bookings?secret=<CRON_SECRET>
 *   Authorization: Bearer <CRON_SECRET>
 *
 * For each expired booking:
 *   - status → EXPIRED
 *   - GroupTrip.reservedSpots decremented
 *   - Trip reopened if it was FULL
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");
  const querySecret = new URL(request.url).searchParams.get("secret");
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && !secret) {
    return NextResponse.json(
      { error: "CRON_SECRET requis en production." },
      { status: 503 }
    );
  }

  if (secret) {
    const token = authHeader?.replace(/^Bearer\s+/i, "") || querySecret;
    if (token !== secret) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  try {
    const result = await BookingsService.expireStaleBookings();
    console.log(`[cron/expire-bookings] expired=${result.expired} errors=${result.errors}`);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/expire-bookings]", error);
    return NextResponse.json({ error: "Échec du cron." }, { status: 500 });
  }
}
