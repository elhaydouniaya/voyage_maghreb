import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const checks = [];

async function run() {
  try {
    const [users, trips, agencies, bookings, requests, auditLogs, behaviorEvents, connectAgencies] =
      await Promise.all([
        p.user.count(),
        p.groupTrip.count({ where: { status: "PUBLISHED" } }),
        p.agency.count(),
        p.booking.count(),
        p.travelRequest.count(),
        p.auditLog.count(),
        p.behaviorEvent.count(),
        p.agency.count({ where: { stripeConnectChargesEnabled: true } }),
      ]);
    checks.push({
      name: "database",
      ok: true,
      users,
      trips,
      agencies,
      bookings,
      requests,
      auditLogs,
      behaviorEvents,
      stripeConnectAgencies: connectAgencies,
    });

    const demo = await p.user.findMany({
      where: {
        email: {
          in: [
            "client@test.com",
            "agency@test.com",
            "admin@maghrebvoyage.com",
          ],
        },
      },
      select: { email: true, role: true, passwordHash: true, agency: { select: { verificationStatus: true } } },
    });
    checks.push({
      name: "demo_accounts",
      ok: demo.length >= 3,
      accounts: demo.map((u) => ({
        email: u.email,
        role: u.role,
        hasPassword: !!u.passwordHash,
        agencyStatus: u.agency?.verificationStatus,
      })),
    });
  } catch (e) {
    checks.push({ name: "database", ok: false, error: e.message });
  } finally {
    await p.$disconnect();
  }

  const envRequired = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
  ];
  const envOptional = [
    "GROQ_API_KEY",
    "OPENAI_API_KEY",
    "RESEND_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NEXT_PUBLIC_APP_URL",
    "CRON_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "NEXT_PUBLIC_VAPI_PUBLIC_KEY",
    "VAPI_WEBHOOK_SECRET",
    "ADMIN_NOTIFY_EMAIL",
  ];
  checks.push({
    name: "env_required",
    ok: envRequired.every((k) => !!process.env[k]),
    missing: envRequired.filter((k) => !process.env[k]),
  });
  checks.push({
    name: "env_optional",
    configured: Object.fromEntries(
      envOptional.map((k) => [k, !!process.env[k]])
    ),
  });

  const isProd = process.env.NODE_ENV === "production";
  const stripeReady =
    Boolean(process.env.STRIPE_SECRET_KEY?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY?.trim());
  const cronReady = Boolean(process.env.CRON_SECRET?.trim());
  const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const googlePartial = Boolean(googleId) !== Boolean(googleSecret);

  if (isProd) {
    checks.push({
      name: "production_ready",
      ok: stripeReady && cronReady,
      stripe: stripeReady,
      cron: cronReady,
      hint: !stripeReady
        ? "Configurez STRIPE_SECRET_KEY et NEXT_PUBLIC_STRIPE_PUBLIC_KEY"
        : !cronReady
          ? "Configurez CRON_SECRET pour le rappel J-7"
          : null,
    });
  }

  if (googlePartial) {
    checks.push({
      name: "google_oauth",
      ok: false,
      error:
        "GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET doivent être tous les deux renseignés ou vides.",
    });
  }

  const recommendations = [];
  if (!process.env.GROQ_API_KEY?.trim()) {
    recommendations.push("GROQ_API_KEY — recommandé (Llama via Groq, voir PRODUCTION_CHECKLIST.md)");
  }
  if (
    !process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.trim() ||
    !process.env.VAPI_WEBHOOK_SECRET?.trim()
  ) {
    recommendations.push("VAPI — optionnel (guide vocal)");
  }
  if (recommendations.length) {
    checks.push({ name: "recommendations", ok: true, items: recommendations });
  }

  console.log(JSON.stringify(checks, null, 2));
  const failed = checks.filter((c) => c.ok === false);
  process.exit(failed.length ? 1 : 0);
}

run();
