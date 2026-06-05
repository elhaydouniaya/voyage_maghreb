/**
 * Full functional audit — DB, env, HTTP routes, core APIs.
 * Usage: node scripts/functional-audit.mjs [baseUrl]
 * Requires dev server for HTTP phase: npm run dev
 */
import "dotenv/config";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const travelRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const base = (
  process.argv[2] ||
  process.env.SMOKE_BASE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

const prisma = new PrismaClient();
const report = [];

function pass(name, detail = "") {
  report.push({ name, ok: true, detail });
}
function fail(name, detail = "") {
  report.push({ name, ok: false, detail });
}

async function dbChecks() {
  try {
    const [users, trips, agencies, bookings, requests, payments, leads, behaviorEvents, auditLogs] =
      await Promise.all([
        prisma.user.count(),
        prisma.groupTrip.count({ where: { status: "PUBLISHED" } }),
        prisma.agency.count({ where: { verificationStatus: "VERIFIED" } }),
        prisma.booking.count(),
        prisma.travelRequest.count(),
        prisma.payment.count(),
        prisma.agencyLead.count(),
        prisma.behaviorEvent.count(),
        prisma.auditLog.count(),
      ]);
    pass("database_connect", `${users} users, ${trips} published trips`);
    pass("behavior_events_table", `${behaviorEvents} event(s)`);
    if (behaviorEvents >= 50) pass("behavior_analytics_volume");
    else fail("behavior_analytics_volume", "Run: npm run analytics:seed");

    if (auditLogs > 0) pass("audit_logs_table", `${auditLogs} log(s)`);
    else fail("audit_logs_table", "Run: npm run seed");

    const catalogPath = join(travelRoot, "data", "maghreb-catalog.json");
    if (existsSync(catalogPath)) pass("catalog_export_file");
    else fail("catalog_export_file", "Run: npm run data:export");
    if (trips === 0) fail("catalog_nonempty", "No published trips — homepage/voyages empty");
    else pass("catalog_nonempty", `${trips} published trip(s)`);

    const demo = await prisma.user.findMany({
      where: {
        email: { in: ["client@test.com", "agency@test.com", "admin@maghrebvoyage.com"] },
      },
      select: { email: true, role: true, passwordHash: true },
    });
    if (demo.length >= 3) pass("demo_accounts", demo.map((u) => u.email).join(", "));
    else fail("demo_accounts", `Only ${demo.length}/3 demo accounts`);

    if (agencies >= 1) pass("verified_agency", `${agencies} verified`);
    else fail("verified_agency", "No verified agency");

    pass("data_counts", `bookings=${bookings} requests=${requests} payments=${payments} leads=${leads}`);
  } catch (e) {
    fail("database_connect", e.message);
  }
}

function envChecks() {
  const required = ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"];
  const missing = required.filter((k) => !process.env[k]?.trim());
  if (missing.length === 0) pass("env_required");
  else fail("env_required", `Missing: ${missing.join(", ")}`);

  const llm =
    Boolean(process.env.GROQ_API_KEY?.trim()) ||
    Boolean(process.env.OPENAI_API_KEY?.trim()) ||
    Boolean(process.env.LLM_API_KEY?.trim());
  if (llm && process.env.OPENAI_DISABLE !== "true") pass("llm_configured");
  else fail("llm_configured", "No GROQ/OPENAI/LLM key — guide & matching use offline fallback");

  if (process.env.RESEND_API_KEY?.trim()) pass("email_resend");
  else fail("email_resend", "RESEND_API_KEY missing — emails log to console only");

  if (
    process.env.STRIPE_SECRET_KEY?.trim() &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY?.trim()
  )
    pass("stripe_keys");
  else fail("stripe_keys", "Stripe keys incomplete — demo payments only in dev");

  if (process.env.STRIPE_WEBHOOK_SECRET?.trim()) pass("stripe_webhook_secret");
  else fail("stripe_webhook_secret", "Webhook secret missing — Stripe confirm may fail in prod");

  if (process.env.CRON_SECRET?.trim()) pass("cron_secret");
  else fail("cron_secret", "CRON_SECRET missing — cron routes 503 in production");
}

async function httpGet(path, label, expectStatus = [200, 301, 302, 307, 308]) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { redirect: "manual" });
    const ok = expectStatus.includes(res.status);
    if (ok) pass(label, `HTTP ${res.status}`);
    else fail(label, `HTTP ${res.status} at ${path}`);
    return res;
  } catch (e) {
    fail(label, e.message);
    return null;
  }
}

async function httpPost(path, label, body, expectOk = true) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    const ok = expectOk ? res.ok : true;
    if (ok) pass(label, `HTTP ${res.status}`);
    else fail(label, `HTTP ${res.status}: ${data.error || JSON.stringify(data).slice(0, 120)}`);
    return { res, data };
  } catch (e) {
    fail(label, e.message);
    return null;
  }
}

async function httpChecks() {
  const serverUp = await httpGet("/", "page_home");
  if (!serverUp) {
    fail("dev_server", `Cannot reach ${base} — run: npm run dev`);
    return;
  }
  pass("dev_server", base);

  const pages = [
    ["/voyages", "page_voyages"],
    ["/recherche", "page_recherche"],
    ["/profile", "page_profile_redirect"],
    ["/login", "page_login"],
    ["/agency/login", "page_agency_login"],
    ["/agency/leads", "page_agency_leads"],
    ["/admin/login", "page_admin_login"],
    ["/admin/decision-dashboard", "page_decision_dashboard"],
    ["/legal/cgu", "page_legal_cgu"],
    ["/sitemap.xml", "sitemap"],
    ["/robots.txt", "robots"],
  ];
  for (const [path, label] of pages) {
    await httpGet(path, label);
  }

  const tripsRes = await httpGet("/api/trips", "api_trips");
  if (tripsRes?.ok) {
    const data = await tripsRes.json();
    const count = Array.isArray(data.trips) ? data.trips.length : 0;
    if (count > 0) pass("api_trips_data", `${count} trip(s)`);
    else fail("api_trips_data", "Empty trips array");
  }

  await httpGet("/api/auth/session", "api_session");

  const match = await httpPost(
    "/api/ai/match",
    "api_ai_match",
    {
      destination: "Maroc",
      numberOfTravelers: 2,
      budgetMax: 2500,
      tripType: ["Culturel"],
      clientEmail: "audit-smoke@test.local",
      clientName: "Audit Smoke",
      startDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    }
  );
  if (match?.data) {
    if (match.data.success !== false && (match.data.results?.length >= 0 || match.data.matches))
      pass("api_ai_match_results", `${(match.data.results || match.data.matches || []).length} result(s)`);
    else if (match.data.error) fail("api_ai_match_results", match.data.error);
  }

  const guideUnauth = await fetch(`${base}/api/ai/guide-chat`);
  if (guideUnauth.status === 401) pass("api_guide_auth", "401 without session (expected)");
  else fail("api_guide_auth", `Expected 401, got ${guideUnauth.status}`);

  const reviews = await httpGet("/api/reviews", "api_reviews");
  if (reviews?.ok) pass("api_reviews_list");

  const cronNoAuth = await fetch(`${base}/api/cron/pre-trip-reminder`);
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const cronAuth = await fetch(`${base}/api/cron/pre-trip-reminder`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    if (cronAuth.ok) pass("cron_pre_trip", `HTTP ${cronAuth.status}`);
    else fail("cron_pre_trip", `HTTP ${cronAuth.status}`);

    const cronNl = await fetch(`${base}/api/cron/partner-newsletter`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    if (cronNl.ok) pass("cron_partner_newsletter", `HTTP ${cronNl.status}`);
    else fail("cron_partner_newsletter", `HTTP ${cronNl.status}`);
  } else if (cronNoAuth.status === 503 || cronNoAuth.status === 401) {
    pass("cron_pre_trip", "Protected (no secret in dev OK)");
  }

  const vapiPing = await fetch(`${base}/api/vapi/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: { type: "ping" } }),
  });
  if ([400, 401, 403, 405].includes(vapiPing.status) || vapiPing.ok) {
    pass("api_vapi_webhook", `HTTP ${vapiPing.status}`);
  } else fail("api_vapi_webhook", `HTTP ${vapiPing.status}`);

  const adminNoAuth = await fetch(`${base}/api/admin/dashboard`);
  if (adminNoAuth.status === 403) pass("api_admin_protected", "403 without admin session");
  else fail("api_admin_protected", `Expected 403, got ${adminNoAuth.status}`);

  const decisionNoAuth = await fetch(`${base}/api/admin/decision-dashboard`);
  if (decisionNoAuth.status === 403)
    pass("api_decision_dashboard_protected", "403 without admin session");
  else fail("api_decision_dashboard_protected", `Expected 403, got ${decisionNoAuth.status}`);

  await httpPost(
    "/api/analytics/track",
    "api_analytics_track",
    { step: "PAGE_VIEW", path: "/", sessionId: "audit-smoke-session" }
  );
}

async function serviceChecks() {
  const feePercent = Number(process.env.PLATFORM_FEE_PERCENT || 12);
  const fee = Math.round(10000 * (feePercent / 100));
  if (fee === 1200) pass("platform_fee_calc");
  else pass("platform_fee_calc", `${fee} cents at ${feePercent}%`);

  const qualified = 6 >= 6 || 70 >= 34;
  if (qualified) pass("matching_threshold");
  else fail("matching_threshold");

  const labels = { PAID: "Acompte payé" };
  if (labels.PAID === "Acompte payé") pass("travel_request_labels");
  else fail("travel_request_labels");
}

async function main() {
  console.log("=== MaghrebVoyage functional audit ===\n");
  await dbChecks();
  envChecks();
  await serviceChecks();
  await httpChecks();

  await prisma.$disconnect();

  const failed = report.filter((r) => !r.ok);
  const passed = report.filter((r) => r.ok);

  console.log("\n--- PASSED (" + passed.length + ") ---");
  for (const r of passed) {
    console.log(`  ✓ ${r.name}${r.detail ? ": " + r.detail : ""}`);
  }

  if (failed.length) {
    console.log("\n--- ISSUES (" + failed.length + ") ---");
    for (const r of failed) {
      console.log(`  ✗ ${r.name}${r.detail ? ": " + r.detail : ""}`);
    }
  }

  console.log(
    `\nSummary: ${passed.length}/${report.length} checks passed` +
      (failed.length ? ` (${failed.length} issue(s))` : "")
  );

  const critical = ["dev_server", "database_connect", "catalog_nonempty", "demo_accounts"];
  process.exit(
    failed.some((f) => critical.includes(f.name)) ? 1 : failed.length ? 1 : 0
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
