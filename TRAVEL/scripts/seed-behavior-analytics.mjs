/**
 * Seed realistic BehaviorEvent data for the decision dashboard demo.
 * Usage: node scripts/seed-behavior-analytics.mjs [--days=30] [--sessions=150] [--clear]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const days = Number(args.find((a) => a.startsWith("--days="))?.split("=")[1] ?? 30);
const sessionCount = Number(
  args.find((a) => a.startsWith("--sessions="))?.split("=")[1] ?? 150
);
const clear = args.includes("--clear");

/** Drop-off between funnel steps (conditional: P(continue | reached previous step)). */
const FUNNEL = [
  { step: "PAGE_VIEW", path: "/", continueRate: 1 },
  { step: "SEARCH_START", path: "/recherche", continueRate: 0.63 },
  { step: "AI_MATCH_SUBMIT", path: "/recherche", continueRate: 0.48 },
  { step: "TRIP_VIEW", path: null, continueRate: 0.55 },
  { step: "CHECKOUT_START", path: "/booking/checkout", continueRate: 0.35 },
  { step: "BOOKING_CONFIRMED", path: "/booking/receipt/seed", continueRate: 0.72 },
];

const MIN_BOOKING_CONFIRMED = 10;

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function pickDateWithinDays(maxDays) {
  const now = Date.now();
  const bias = Math.pow(Math.random(), 0.65);
  const offsetMs = bias * maxDays * 24 * 60 * 60 * 1000;
  return new Date(now - offsetMs);
}

function sessionRole() {
  const r = Math.random();
  if (r < 0.82) return "CLIENT";
  if (r < 0.95) return "AGENCY";
  return "ADMIN";
}

async function main() {
  const trips = await prisma.groupTrip.findMany({
    where: { status: { in: ["PUBLISHED", "FULL"] } },
    select: { slug: true, title: true },
    take: 8,
  });

  if (trips.length === 0) {
    console.error("No published trips — run npm run seed first.");
    process.exit(1);
  }

  const client = await prisma.user.findFirst({
    where: { email: "client@test.com" },
    select: { id: true },
  });

  if (clear) {
    const deleted = await prisma.behaviorEvent.deleteMany({});
    console.log(`Cleared ${deleted.count} existing behavior event(s).`);
  }

  const rows = [];
  let guideChats = 0;
  let bookingConfirmed = 0;

  function pushEvent(sessionId, userId, role, stage, tripSlug, createdBase, elapsed, code) {
    const path =
      stage.step === "TRIP_VIEW"
        ? `/trip/${tripSlug}`
        : stage.step === "BOOKING_CONFIRMED"
          ? `/booking/receipt/${code}`
          : stage.path;

    rows.push({
      step: stage.step,
      path,
      sessionId,
      userId,
      role,
      metadata:
        stage.step === "AI_MATCH_SUBMIT"
          ? { matchMode: Math.random() < 0.75 ? "qualified" : "fallback", seeded: true }
          : stage.step === "BOOKING_CONFIRMED"
            ? { confirmationCode: code, seeded: true }
            : { seeded: true },
      ipHash: `seed${(Math.abs(sessionId.charCodeAt(0)) % 40).toString(16).padStart(4, "0")}`,
      durationMs: elapsed,
      createdAt: new Date(createdBase.getTime() + elapsed),
    });
    if (stage.step === "BOOKING_CONFIRMED") bookingConfirmed++;
  }

  for (let i = 0; i < sessionCount; i++) {
    const sessionId = randomUUID();
    const role = sessionRole();
    const userId = role === "CLIENT" && client && Math.random() < 0.55 ? client.id : null;
    const createdBase = pickDateWithinDays(days);
    const tripSlug = trips[Math.floor(Math.random() * trips.length)].slug;
    const receiptCode = `MV-SEED-${String(i + 1).padStart(4, "0")}`;
    let elapsed = 0;

    for (let s = 0; s < FUNNEL.length; s++) {
      const stage = FUNNEL[s];
      if (s > 0 && Math.random() > stage.continueRate) break;

      elapsed += Math.floor(randBetween(8000, 120000));
      pushEvent(sessionId, userId, role, stage, tripSlug, createdBase, elapsed, receiptCode);
    }

    if (role === "CLIENT" && Math.random() < 0.22) {
      guideChats++;
      elapsed += Math.floor(randBetween(15000, 90000));
      rows.push({
        step: "GUIDE_CHAT",
        path: "/profile",
        sessionId,
        userId,
        role: "CLIENT",
        metadata: { mode: "llm", seeded: true },
        ipHash: `seed${(i % 40).toString(16).padStart(4, "0")}`,
        durationMs: elapsed,
        createdAt: new Date(createdBase.getTime() + elapsed),
      });
    }

    if (Math.random() < 0.08) {
      rows.push({
        step: Math.random() < 0.5 ? "LOGIN" : "REGISTER",
        path: Math.random() < 0.5 ? "/login" : "/register",
        sessionId,
        userId,
        role,
        metadata: { seeded: true },
        ipHash: `seed${(i % 40).toString(16).padStart(4, "0")}`,
        durationMs: elapsed,
        createdAt: new Date(createdBase.getTime() + Math.max(0, elapsed - 5000)),
      });
    }
  }

  while (bookingConfirmed < MIN_BOOKING_CONFIRMED) {
    const sessionId = randomUUID();
    const userId = client?.id ?? null;
    const createdBase = pickDateWithinDays(Math.min(days, 14));
    const tripSlug = trips[Math.floor(Math.random() * trips.length)].slug;
    const receiptCode = `MV-DEMO-${String(bookingConfirmed + 1).padStart(3, "0")}`;
    let elapsed = 0;
    for (const stage of FUNNEL) {
      elapsed += Math.floor(randBetween(12000, 90000));
      pushEvent(sessionId, userId, "CLIENT", stage, tripSlug, createdBase, elapsed, receiptCode);
    }
  }

  const batchSize = 200;
  for (let i = 0; i < rows.length; i += batchSize) {
    await prisma.behaviorEvent.createMany({ data: rows.slice(i, i + batchSize) });
  }

  const total = await prisma.behaviorEvent.count();
  const byStep = await prisma.behaviorEvent.groupBy({
    by: ["step"],
    _count: { step: true },
    orderBy: { _count: { step: "desc" } },
  });

  console.log(`Seeded ${rows.length} behavior event(s) across ~${sessionCount} sessions (${days} days).`);
  console.log(`Guide chat events: ${guideChats}`);
  console.log(`Booking confirmed: ${bookingConfirmed}`);
  console.log(`Total in DB: ${total}`);
  console.log("By step:");
  for (const g of byStep) {
    console.log(`  ${g.step}: ${g._count.step}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
