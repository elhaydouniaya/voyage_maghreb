/**
 * CDC database conformance check — core entities, migrations, critical columns.
 * Usage: node scripts/db-cdc-check.mjs
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const EXPECTED_MIGRATIONS = [
  "20250523120000_init",
  "20250531120000_newsletter",
  "20250531140000_agency_leads",
  "20250531160000_stripe_connect",
  "20250531180000_payment_payout_agency_notify",
  "20250603120000_behavior_analytics",
  "20250604120000_agency_slug",
  "20250604140000_confirmation_email_sent",
  "20250618120000_overbooking_external_reviews",
  "20250618140000_group_trip_season",
];

const CDC_TABLES = [
  "User",
  "Agency",
  "TravelRequest",
  "GroupTrip",
  "Booking",
  "Payment",
  "AuditLog",
  "BehaviorEvent",
  "NewsletterSubscriber",
  "AgencyLead",
  "Review",
  "ExternalReview",
];

function pass(msg) {
  console.log(`✓ ${msg}`);
}

function fail(msg) {
  console.log(`✗ ${msg}`);
}

async function connectWithRetry(max = 4) {
  for (let i = 1; i <= max; i++) {
    try {
      await p.$connect();
      return true;
    } catch (e) {
      console.log(`  connection attempt ${i}/${max}: ${e.message}`);
      if (i < max) await new Promise((r) => setTimeout(r, 2500));
    }
  }
  return false;
}

async function withDbRetry(fn, max = 3) {
  for (let i = 1; i <= max; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = e?.message || String(e);
      if (i < max && (msg.includes("Can't reach database") || msg.includes("P1001"))) {
        console.log(`  retry ${i}/${max - 1} after transient DB error`);
        await p.$disconnect().catch(() => {});
        await connectWithRetry(2);
        continue;
      }
      throw e;
    }
  }
}

async function main() {
  console.log("=== CDC database check ===\n");
  let ok = true;

  if (!(await connectWithRetry())) {
    fail("Cannot reach PostgreSQL — wake Neon or start local Docker (npm run db:up)");
    process.exit(1);
  }
  pass("Database connection");

  const applied = await withDbRetry(() =>
    p.$queryRaw`
    SELECT migration_name, finished_at
    FROM "_prisma_migrations"
    WHERE rolled_back_at IS NULL
    ORDER BY finished_at
  `
  );
  const names = new Set(applied.map((m) => m.migration_name));
  for (const m of EXPECTED_MIGRATIONS) {
    if (names.has(m)) pass(`Migration applied: ${m}`);
    else {
      fail(`Migration missing: ${m}`);
      ok = false;
    }
  }

  const tables = await withDbRetry(() =>
    p.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `
  );
  const tableSet = new Set(tables.map((t) => t.table_name));
  for (const t of CDC_TABLES) {
    if (tableSet.has(t)) pass(`Table present: ${t}`);
    else {
      fail(`Table missing: ${t}`);
      ok = false;
    }
  }

  const columns = await withDbRetry(() =>
    p.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'GroupTrip'
  `
  );
  const colSet = new Set(columns.map((c) => c.column_name));
  for (const col of ["reservedSpots", "season", "aiTags", "slug"]) {
    if (colSet.has(col)) pass(`GroupTrip.${col}`);
    else {
      fail(`GroupTrip.${col} missing`);
      ok = false;
    }
  }

  const bookingCols = await withDbRetry(() =>
    p.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Booking'
  `
  );
  const bookingColSet = new Set(bookingCols.map((c) => c.column_name));
  for (const col of ["expiresAt", "confirmationEmailSentAt", "cancellationToken"]) {
    if (bookingColSet.has(col)) pass(`Booking.${col}`);
    else {
      fail(`Booking.${col} missing`);
      ok = false;
    }
  }

  const counts = await withDbRetry(() =>
    Promise.all([
      p.user.count(),
      p.travelRequest.count(),
      p.agency.count(),
      p.groupTrip.count(),
      p.booking.count(),
      p.auditLog.count(),
      p.behaviorEvent.count(),
      p.newsletterSubscriber.count(),
    ])
  );
  const labels = [
    "User (Voyageur)",
    "TravelRequest (Demande IA)",
    "Agency",
    "GroupTrip",
    "Booking",
    "AuditLog (CDC §7)",
    "BehaviorEvent (dashboard)",
    "NewsletterSubscriber",
  ];
  counts.forEach((n, i) => pass(`${labels[i]}: ${n} rows`));

  console.log("");
  if (ok) {
    console.log("CDC database schema: OK");
    process.exit(0);
  }
  console.log("CDC database schema: INCOMPLETE — run: npm run db:migrate");
  process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
