/**
 * Production readiness report — env, DB, migrations, data, optional HTTP.
 * Usage: node scripts/prod-ready.mjs [baseUrl]
 *   baseUrl optional — if dev server running, runs HTTP smoke subset.
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const travelRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.argv[2] || process.env.SMOKE_BASE_URL || "").replace(/\/$/, "");
const prisma = new PrismaClient();
const report = { critical: [], warnings: [], passed: [] };

function pass(name, detail = "") {
  report.passed.push({ name, detail });
}
function warn(name, detail = "") {
  report.warnings.push({ name, detail });
}
function fail(name, detail = "") {
  report.critical.push({ name, detail });
}

function runNpm(script) {
  const cmd = process.platform === "win32" ? `npm run ${script}` : `npm run ${script}`;
  const r = spawnSync(cmd, {
    cwd: travelRoot,
    stdio: "pipe",
    encoding: "utf8",
    shell: true,
  });
  return { ok: r.status === 0, out: (r.stdout || "") + (r.stderr || "") };
}

async function dbChecks() {
  try {
    const [
      users,
      trips,
      agenciesVerified,
      bookings,
      behaviorEvents,
      auditLogs,
      connectReady,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.groupTrip.count({ where: { status: "PUBLISHED" } }),
      prisma.agency.count({ where: { verificationStatus: "VERIFIED" } }),
      prisma.booking.count(),
      prisma.behaviorEvent.count(),
      prisma.auditLog.count(),
      prisma.agency.count({
        where: { stripeConnectChargesEnabled: true },
      }),
    ]);

    pass("database", `${users} users, ${trips} published trips`);
    if (trips > 0) pass("catalog_db");
    else fail("catalog_db", "No published trips — run npm run seed");

    if (behaviorEvents >= 50) pass("behavior_analytics", `${behaviorEvents} events`);
    else
      warn(
        "behavior_analytics",
        `${behaviorEvents} events — run: npm run analytics:seed`
      );

    if (auditLogs > 0) pass("audit_logs", `${auditLogs} entries`);
    else warn("audit_logs", "Empty — run: npm run seed (includes demo audit logs)");

    if (connectReady > 0) pass("stripe_connect", `${connectReady} agency(ies) charges_enabled`);
    else
      warn(
        "stripe_connect",
        "No agency with Stripe Connect active — complete onboarding in agency settings"
      );

    pass("data_volume", `bookings=${bookings} verified_agencies=${agenciesVerified}`);

    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at FROM "_prisma_migrations"
      ORDER BY finished_at DESC NULLS LAST
      LIMIT 8
    `.catch(() => null);

    if (migrations?.length) {
      const latest = migrations[0]?.migration_name;
      const needsBehavior = !migrations.some((m) =>
        String(m.migration_name).includes("behavior_analytics")
      );
      pass("migrations_applied", `latest: ${latest}`);
      if (needsBehavior)
        warn("migrations_applied", "Run: npm run db:migrate (behavior_analytics missing)");
    } else {
      warn("migrations_applied", "Could not read _prisma_migrations — run db:migrate");
    }
  } catch (e) {
    fail("database", e.message);
  }
}

function envChecks() {
  const required = ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"];
  for (const k of required) {
    if (!process.env[k]?.trim()) fail("env_required", `Missing ${k}`);
  }
  if (!report.critical.some((c) => c.name === "env_required")) pass("env_required");

  const llm =
    Boolean(process.env.GROQ_API_KEY?.trim()) ||
    Boolean(process.env.OPENAI_API_KEY?.trim()) ||
    Boolean(process.env.LLM_API_KEY?.trim());
  if (llm && process.env.OPENAI_DISABLE !== "true") {
    if (process.env.GROQ_API_KEY?.trim()) pass("llm_groq");
    else warn("llm_groq", "GROQ_API_KEY unset — using OpenAI/LLM fallback");
    pass("llm_configured");
  } else fail("llm_configured", "Set GROQ_API_KEY or OPENAI_API_KEY");

  if (process.env.RESEND_API_KEY?.trim()) {
    const from = process.env.RESEND_FROM || "";
    if (from.includes("onboarding@resend.dev"))
      warn("resend_domain", "Use a verified domain in RESEND_FROM for production");
    else pass("email_resend");
  } else warn("email_resend", "RESEND_API_KEY missing — console-only emails");

  const stripe =
    Boolean(process.env.STRIPE_SECRET_KEY?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY?.trim());
  if (stripe) pass("stripe_keys");
  else warn("stripe_keys", "Stripe keys missing — demo payments only");

  if (process.env.STRIPE_WEBHOOK_SECRET?.trim()) pass("stripe_webhook");
  else warn("stripe_webhook", "STRIPE_WEBHOOK_SECRET missing");

  if (process.env.CRON_SECRET?.trim()) pass("cron_secret");
  else warn("cron_secret", "CRON_SECRET missing — cron routes return 503 in production");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl && !appUrl.includes("localhost")) pass("public_app_url", appUrl);
  else warn("public_app_url", "Set NEXT_PUBLIC_APP_URL to production domain before deploy");

  const vapi =
    Boolean(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID?.trim());
  if (vapi && process.env.VAPI_WEBHOOK_SECRET?.trim()) pass("vapi");
  else warn("vapi", "VAPI optional — set NEXT_PUBLIC_VAPI_* and VAPI_WEBHOOK_SECRET");

  if (process.env.ADMIN_NOTIFY_EMAIL?.trim()) pass("admin_notify");
  else warn("admin_notify", "ADMIN_NOTIFY_EMAIL optional — falls back to admin user email");
}

function artifactChecks() {
  const catalog = join(travelRoot, "data", "maghreb-catalog.json");
  if (existsSync(catalog)) pass("catalog_export", catalog);
  else warn("catalog_export", "Run: npm run data:export");
}

async function httpChecks() {
  if (!base) {
    warn("http_smoke", "Skipped — pass baseUrl or start dev server and re-run with http://localhost:3000");
    return;
  }
  const pages = [
    ["/admin/decision-dashboard", "page_decision_dashboard"],
    ["/agency/leads", "page_agency_leads"],
    ["/legal/cgu", "page_legal_cgu"],
  ];
  for (const [path, label] of pages) {
    try {
      const res = await fetch(`${base}${path}`, { redirect: "manual" });
      if ([200, 301, 302, 307, 308].includes(res.status)) pass(label, `HTTP ${res.status}`);
      else fail(label, `HTTP ${res.status}`);
    } catch (e) {
      fail(label, e.message);
    }
  }

  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const nl = await fetch(`${base}/api/cron/partner-newsletter`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    if (nl.ok) pass("cron_partner_newsletter", `HTTP ${nl.status}`);
    else warn("cron_partner_newsletter", `HTTP ${nl.status}`);
  }
}

async function main() {
  console.log("=== MaghrebVoyage production readiness ===\n");

  const tc = runNpm("typecheck");
  if (tc.ok) pass("typecheck");
  else fail("typecheck", tc.out.slice(-400));

  const tests = runNpm("test");
  if (tests.ok) pass("unit_tests");
  else fail("unit_tests", tests.out.slice(-400));

  envChecks();
  artifactChecks();
  await dbChecks();
  await httpChecks();
  await prisma.$disconnect();

  console.log("--- OK (" + report.passed.length + ") ---");
  for (const r of report.passed) {
    console.log(`  ✓ ${r.name}${r.detail ? ": " + r.detail : ""}`);
  }
  if (report.warnings.length) {
    console.log("\n--- To configure (" + report.warnings.length + ") ---");
    for (const r of report.warnings) {
      console.log(`  ○ ${r.name}: ${r.detail}`);
    }
  }
  if (report.critical.length) {
    console.log("\n--- Blocking (" + report.critical.length + ") ---");
    for (const r of report.critical) {
      console.log(`  ✗ ${r.name}: ${r.detail}`);
    }
  }

  console.log(
    `\nResult: ${report.passed.length} passed, ${report.warnings.length} optional, ${report.critical.length} blocking`
  );
  console.log("\nFull local verification (dev server required): npm run audit:all");
  console.log("One-shot DB + demo data: npm run setup:full\n");

  const code = report.critical.length ? 1 : 0;
  // Avoid Windows libuv assert on abrupt exit after Prisma disconnect
  setTimeout(() => process.exit(code), 100);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
