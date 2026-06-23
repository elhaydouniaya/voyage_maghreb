/**
 * Smoke test for booking/email/season changes.
 * Usage: npx tsx scripts/verify-booking-changes.ts [baseUrl]
 */
import prisma from "../src/lib/prisma";
import { resolveAccountEmail, resolveAccountEmailForBooking } from "../src/lib/account-email";
import { resolveEmailDeliveryTarget, isEmailConfigured } from "../src/lib/email-config";
import { BookingsService } from "../src/services/bookings.service";
import { groupTripsBySeason } from "../src/lib/seasons";
import { TripsService } from "../src/services/trips.service";

const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");

async function checkHttp() {
  const results: { name: string; ok: boolean; detail?: string }[] = [];

  async function get(path: string) {
    const res = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* html */
    }
    return { status: res.status, json, text };
  }

  const home = await get("/");
  results.push({
    name: "GET /",
    ok: home.status === 200,
    detail: `status ${home.status}`,
  });

  const trips = await get("/api/trips");
  const tripList =
    trips.json && typeof trips.json === "object" && "trips" in trips.json
      ? (trips.json as { trips: unknown[] }).trips
      : [];
  results.push({
    name: "GET /api/trips",
    ok: trips.status === 200 && Array.isArray(tripList),
    detail: `${tripList.length} trips`,
  });

  const firstTrip = tripList[0] as { season?: string; slug?: string } | undefined;
  results.push({
    name: "Trips include season field",
    ok: Boolean(firstTrip?.season),
    detail: firstTrip?.season || "no trips",
  });

  const grouped = groupTripsBySeason(
    (tripList as { season?: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER" | "OTHER" }[]) || []
  );
  const seasonCount = Object.values(grouped).reduce((n, arr) => n + arr.length, 0);
  results.push({
    name: "groupTripsBySeason",
    ok: seasonCount === tripList.length,
    detail: `${seasonCount} grouped`,
  });

  const lookupMissing = await get("/api/bookings/lookup");
  results.push({
    name: "GET /api/bookings/lookup (no params → 400)",
    ok: lookupMissing.status === 400,
    detail: `status ${lookupMissing.status}`,
  });

  const initiateNoAuth = await fetch(`${baseUrl}/api/bookings/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      groupTripId: "00000000-0000-4000-8000-000000000001",
      clientName: "Test User",
      numberOfSeats: 1,
      acceptCgu: true,
      acceptRgpd: true,
    }),
  });
  results.push({
    name: "POST /api/bookings/initiate (no session → 401)",
    ok: initiateNoAuth.status === 401,
    detail: `status ${initiateNoAuth.status}`,
  });

  return results;
}

async function checkDb() {
  const results: { name: string; ok: boolean; detail?: string }[] = [];

  const client = await prisma.user.findUnique({
    where: { email: "client@test.com" },
    select: { id: true, email: true },
  });
  results.push({
    name: "Demo client account exists",
    ok: Boolean(client?.email),
    detail: client?.email || "missing",
  });

  if (client) {
    const resolved = await resolveAccountEmail({ userId: client.id });
    results.push({
      name: "resolveAccountEmail(userId)",
      ok: resolved === "client@test.com",
      detail: resolved,
    });
  }

  const confirmed = await prisma.booking.findFirst({
    where: { status: "CONFIRMED" },
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, clientEmail: true, confirmationCode: true },
  });

  results.push({
    name: "Confirmed booking in DB",
    ok: Boolean(confirmed),
    detail: confirmed?.confirmationCode || "none",
  });

  if (confirmed) {
    const accountEmail = await resolveAccountEmailForBooking(confirmed);
    results.push({
      name: "resolveAccountEmailForBooking",
      ok: accountEmail.includes("@"),
      detail: accountEmail,
    });

    const delivery = resolveEmailDeliveryTarget(accountEmail);
    results.push({
      name: "resolveEmailDeliveryTarget",
      ok: Boolean(delivery.deliveredTo),
      detail: `${delivery.intendedTo} → ${delivery.deliveredTo}`,
    });

    try {
      const emailResult = await BookingsService.ensureConfirmationEmailsSent(confirmed.id);
      results.push({
        name: "ensureConfirmationEmailsSent (idempotent)",
        ok: emailResult.alreadySent || emailResult.sent,
        detail: `sent=${emailResult.sent} alreadySent=${emailResult.alreadySent}`,
      });
    } catch (e) {
      results.push({
        name: "ensureConfirmationEmailsSent",
        ok: false,
        detail: e instanceof Error ? e.message : "error",
      });
    }

    const lookupRes = await fetch(
      `${baseUrl}/api/bookings/lookup?bookingId=${encodeURIComponent(confirmed.id)}`
    );
    const lookupJson = (await lookupRes.json()) as {
      booking?: { confirmationCode?: string };
      emailSent?: boolean;
      error?: string;
    };
    results.push({
      name: "GET /api/bookings/lookup?bookingId",
      ok:
        lookupRes.status === 200 &&
        lookupJson.booking?.confirmationCode === confirmed.confirmationCode,
      detail: lookupRes.status === 200 ? `emailSent=${lookupJson.emailSent}` : lookupJson.error,
    });
  }

  const seasonCol = await prisma.groupTrip.findFirst({
    select: { season: true, startDate: true },
  });
  results.push({
    name: "GroupTrip.season column",
    ok: Boolean(seasonCol?.season),
    detail: seasonCol?.season || "missing",
  });

  const published = await TripsService.listPublished();
  const withSeason = published.filter((t) => t.season);
  results.push({
    name: "TripsService.listPublished season",
    ok: published.length === 0 || withSeason.length === published.length,
    detail: `${withSeason.length}/${published.length}`,
  });

  results.push({
    name: "Email configured (Resend)",
    ok: isEmailConfigured(),
    detail: isEmailConfigured() ? "resend" : "console-only",
  });

  return results;
}

async function main() {
  console.log(`\n=== Booking changes smoke test (${baseUrl}) ===\n`);

  const http = await checkHttp();
  const db = await checkDb();
  const all = [...http, ...db];

  let failed = 0;
  for (const r of all) {
    const mark = r.ok ? "PASS" : "FAIL";
    if (!r.ok) failed++;
    console.log(`[${mark}] ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }

  await prisma.$disconnect();
  console.log(`\n${all.length - failed}/${all.length} checks passed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
