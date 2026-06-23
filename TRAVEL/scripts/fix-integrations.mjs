/**
 * Fix & verify production integrations: Stripe Connect, webhooks, Resend, Google OAuth.
 * Usage:
 *   node scripts/fix-integrations.mjs              # check + auto-fix (test mode)
 *   node scripts/fix-integrations.mjs --webhook    # register Stripe webhook (HTTPS URL only)
 *   node scripts/fix-integrations.mjs --connect      # Stripe Connect demo + auto-complete (test)
 */
import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
const args = new Set(process.argv.slice(2));
const prisma = new PrismaClient();

const REQUIRED_WEBHOOK_EVENTS = ["checkout.session.completed", "account.updated"];

let failed = 0;
let fixed = 0;

function ok(name, detail = "") {
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}
function warn(name, detail = "") {
  console.log(`○ ${name}${detail ? ` — ${detail}` : ""}`);
}
function bad(name, detail = "") {
  console.log(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
  failed++;
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

function isLiveMode(secret) {
  return secret?.startsWith("sk_live");
}

function stripeKeyMode(secret, publicKey) {
  const skLive = secret?.startsWith("sk_live");
  const pkLive = publicKey?.startsWith("pk_live");
  if (skLive && pkLive) return "live";
  if (!skLive && !pkLive) return "test";
  return "mismatch";
}

function setEnvValue(key, value) {
  if (!existsSync(envPath)) return false;
  const raw = readFileSync(envPath, "utf8");
  const re = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${JSON.stringify(value)}`;
  const next = re.test(raw) ? raw.replace(re, line) : `${raw.trimEnd()}\n${line}\n`;
  writeFileSync(envPath, next, "utf8");
  process.env[key] = value;
  fixed++;
  return true;
}

async function checkStripeKeys() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY?.trim();
  if (!secret || !publicKey) {
    bad("Stripe keys", "STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLIC_KEY requis");
    return null;
  }
  const mode = stripeKeyMode(secret, publicKey);
  if (mode === "mismatch") {
    bad("Stripe keys", "sk_* et pk_* doivent être tous deux test ou tous deux live");
    return null;
  }
  ok("Stripe keys", mode === "live" ? "LIVE (production)" : "test");
  if (mode === "test") {
    warn(
      "Stripe live",
      "Pour la prod : remplacez par sk_live_ / pk_live_ dans Vercel + webhook live"
    );
  }
  return new Stripe(secret);
}

async function checkStripeWebhook(stripe) {
  const localSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!localSecret) {
    bad("Stripe webhook secret", "STRIPE_WEBHOOK_SECRET manquant");
    console.log("  → Local : stripe listen --forward-to localhost:3000/api/webhooks/stripe");
    return;
  }
  ok("Stripe webhook secret", "défini dans .env");

  const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });
  const base = appUrl();
  const target = `${base}/api/webhooks/stripe`;
  const match = endpoints.data.find((w) => w.url === target);

  if (base.includes("localhost")) {
    warn(
      "Stripe webhook endpoint",
      "localhost — utilisez stripe listen en dev (dashboard n'accepte pas localhost)"
    );
    console.log("  → stripe listen --forward-to localhost:3000/api/webhooks/stripe");
    return;
  }

  if (match) {
    const missing = REQUIRED_WEBHOOK_EVENTS.filter((e) => !match.enabled_events.includes(e));
    if (missing.length) {
      await stripe.webhookEndpoints.update(match.id, {
        enabled_events: [...new Set([...match.enabled_events, ...REQUIRED_WEBHOOK_EVENTS])],
      });
      ok("Stripe webhook events", `ajouté : ${missing.join(", ")}`);
      fixed++;
    } else {
      ok("Stripe webhook endpoint", `${target} (${match.enabled_events.length} events)`);
    }
    return;
  }

  if (args.has("--webhook") || args.has("--fix")) {
    const created = await stripe.webhookEndpoints.create({
      url: target,
      enabled_events: REQUIRED_WEBHOOK_EVENTS,
      description: "MaghrebVoyage — bookings + Connect sync",
    });
    ok("Stripe webhook créé", created.url);
    warn("Stripe webhook secret", "Copiez le signing secret dans STRIPE_WEBHOOK_SECRET (Vercel)");
    console.log("  → Dashboard : Developers → Webhooks →", created.id);
    fixed++;
  } else {
    warn("Stripe webhook endpoint", `Aucun endpoint pour ${target}`);
    console.log("  → Relancez : npm run integrations:fix -- --webhook");
  }
}

async function isConnectEnabled(stripe) {
  try {
    const probe = await stripe.accounts.create({
      type: "express",
      country: process.env.STRIPE_CONNECT_DEFAULT_COUNTRY?.trim() || "FR",
    });
    await stripe.accounts.del(probe.id);
    return true;
  } catch (e) {
    const msg = e.message || "";
    return !msg.toLowerCase().includes("signed up for connect");
  }
}

async function createFullyOnboardedTestAccount(stripe, agency) {
  const country = process.env.STRIPE_CONNECT_DEFAULT_COUNTRY?.trim() || "FR";
  const base = appUrl();

  const params = {
    type: "custom",
    country,
    email: agency.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    tos_acceptance: {
      date: Math.floor(Date.now() / 1000),
      ip: "127.0.0.1",
    },
    business_profile: {
      mcc: "4722",
      url: base.startsWith("http") ? base : "https://maghrebvoyage.com",
    },
  };

  if (country === "FR") {
    Object.assign(params, {
      business_type: "company",
      company: {
        name: agency.name,
        phone: "0000000000",
        address: {
          line1: "address_full_match",
          city: "Paris",
          postal_code: "75001",
          country: "FR",
        },
      },
      external_account: {
        object: "bank_account",
        country: "FR",
        currency: "eur",
        account_number: "FR1420041010050500013M02606",
      },
    });
  } else {
    Object.assign(params, {
      business_type: "individual",
      individual: {
        first_name: "Demo",
        last_name: "Agency",
        email: agency.email,
        dob: { day: 1, month: 1, year: 1990 },
        address: {
          line1: "address_full_match",
          city: "Paris",
          postal_code: "75001",
          country,
        },
        phone: "0000000000",
      },
      external_account: {
        object: "bank_account",
        country,
        currency: country === "US" ? "usd" : "eur",
        routing_number: "110000000",
        account_number: "000123456789",
      },
    });
  }

  return stripe.accounts.create(params);
}

async function fixStripeConnect(stripe) {
  if (isLiveMode(process.env.STRIPE_SECRET_KEY)) {
    warn("Stripe Connect auto", "Mode live — terminez l'onboarding Express dans /agency/settings");
    const active = await prisma.agency.count({ where: { stripeConnectChargesEnabled: true } });
    if (active > 0) ok("Stripe Connect", `${active} agence(s) active(s)`);
    else bad("Stripe Connect", "Aucune agence avec encaissements — onboarding requis");
    return;
  }

  const connectOn = await isConnectEnabled(stripe);
  if (!connectOn) {
    bad("Stripe Connect platform", "Connect non activé sur votre compte Stripe");
    console.log("  → https://dashboard.stripe.com/test/connect/overview → « Commencer »");
    console.log("  → Puis : npm run integrations:fix -- --connect");
    return;
  }

  if (!args.has("--connect") && !args.has("--fix")) {
    const active = await prisma.agency.count({ where: { stripeConnectChargesEnabled: true } });
    if (active > 0) ok("Stripe Connect", `${active} agence(s) avec charges_enabled`);
    else warn("Stripe Connect", "Connect activé mais aucune agence prête — lancez avec --connect");
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: "agency@test.com" },
    include: { agency: true },
  });
  if (!user?.agency) {
    bad("Stripe Connect demo", "agency@test.com introuvable — npm run seed");
    return;
  }

  const agency = user.agency;
  let accountId = agency.stripeConnectAccountId;

  if (accountId) {
    const existing = await stripe.accounts.retrieve(accountId);
    if (!existing.charges_enabled) {
      try {
        await stripe.accounts.del(accountId);
      } catch {
        /* keep */
      }
      accountId = null;
    }
  }

  if (!accountId) {
    const account = await createFullyOnboardedTestAccount(stripe, agency);
    accountId = account.id;
    ok("Stripe Connect account", `créé ${accountId} (custom test, auto-onboarded)`);
  }

  const account = await stripe.accounts.retrieve(accountId);
  await prisma.agency.update({
    where: { id: agency.id },
    data: {
      stripeConnectAccountId: accountId,
      stripeConnectChargesEnabled: Boolean(account.charges_enabled),
      stripeConnectPayoutsEnabled: Boolean(account.payouts_enabled),
      stripeConnectOnboardingComplete:
        Boolean(account.charges_enabled) &&
        Boolean(account.payouts_enabled) &&
        Boolean(account.details_submitted),
    },
  });

  if (account.charges_enabled) {
    ok("Stripe Connect agency", "agency@test.com — charges_enabled ✓");
    fixed++;
  } else {
    bad("Stripe Connect agency", "Compte créé mais charges_enabled=false — vérifiez le pays FR/US");
  }
}

async function checkResend() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    bad("Resend", "RESEND_API_KEY manquant");
    return;
  }

  const from = process.env.RESEND_FROM?.trim() || "";
  const domain = process.env.RESEND_DOMAIN?.trim();
  const usesSandbox = from.includes("onboarding@resend.dev");

  if (domain && usesSandbox && (args.has("--fix") || args.has("--resend"))) {
    const nextFrom = `MaghrebVoyage <noreply@${domain}>`;
    if (setEnvValue("RESEND_FROM", nextFrom)) {
      ok("RESEND_FROM", `mis à jour → ${nextFrom}`);
    }
  }

  const effectiveFrom =
    process.env.RESEND_FROM?.trim() || "MaghrebVoyage <onboarding@resend.dev>";

  if (effectiveFrom.includes("onboarding@resend.dev")) {
    if (process.env.NODE_ENV === "production") {
      bad(
        "Resend domain",
        "onboarding@resend.dev interdit en prod — vérifiez un domaine sur resend.com/domains"
      );
      console.log("  → Ajoutez RESEND_DOMAIN=votredomaine.com puis npm run integrations:fix -- --fix");
    } else {
      warn(
        "Resend domain",
        "dev OK avec onboarding@resend.dev + RESEND_DEV_TO"
      );
    }
  } else {
    ok("Resend FROM", effectiveFrom);
  }

  const devTo = process.env.RESEND_DEV_TO?.trim();
  if (devTo && (args.has("--fix") || args.has("--resend"))) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: effectiveFrom,
          to: [devTo],
          subject: "MaghrebVoyage — test intégration Resend",
          html: "<p>Test OK — intégration Resend fonctionnelle.</p>",
        }),
      });
      if (res.ok) ok("Resend send test", `email envoyé à ${devTo}`);
      else {
        const err = await res.text();
        warn("Resend send test", `HTTP ${res.status} — ${err.slice(0, 120)}`);
      }
    } catch (e) {
      warn("Resend send test", e.message);
    }
  }
}

async function checkGoogleOAuth() {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!id || !secret) {
    bad("Google OAuth", "GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET requis");
    return;
  }
  if (!id.endsWith(".apps.googleusercontent.com")) {
    bad("Google OAuth", "GOOGLE_CLIENT_ID format invalide");
    return;
  }
  ok("Google OAuth credentials", "présents");

  const bases = new Set();
  for (const k of ["NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL"]) {
    const v = process.env[k]?.trim().replace(/\/$/, "");
    if (v) bases.add(v);
  }
  const redirectUris = [...bases].map((b) => `${b}/api/auth/callback/google`);

  console.log("\n  Redirect URIs à enregistrer (Google Cloud Console) :");
  for (const uri of redirectUris) console.log(`    • ${uri}`);

  const prodUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (prodUrl?.includes("localhost")) {
    warn("Google OAuth prod", "Ajoutez aussi l'URI de prod quand vous déployez sur Vercel");
  }

  const base = appUrl();
  try {
    const res = await fetch(`${base}/api/auth/providers`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      warn("Google OAuth runtime", `Serveur injoignable (${base}) — npm run dev puis relancez`);
      return;
    }
    const providers = await res.json();
    if (providers.google) ok("Google OAuth runtime", "provider actif sur /api/auth/providers");
    else bad("Google OAuth runtime", "provider google absent — vérifiez les credentials");
  } catch {
    warn("Google OAuth runtime", `npm run dev requis pour tester ${base}/api/auth/providers`);
  }
}

async function main() {
  console.log("=== Fix integrations ===\n");

  const stripe = await checkStripeKeys();
  if (stripe) {
    await checkStripeWebhook(stripe);
    await fixStripeConnect(stripe);
  }

  await checkResend();
  await checkGoogleOAuth();

  console.log(`\n--- Résultat : ${fixed} correction(s), ${failed} point(s) bloquant(s) ---\n`);

  if (failed > 0) {
    console.log("Actions manuelles probables :");
    console.log("  1. Stripe Connect : https://dashboard.stripe.com/test/connect/overview");
    console.log("  2. Puis : npm run integrations:fix -- --connect");
    console.log("  3. Prod : sk_live/pk_live + webhook HTTPS + RESEND_DOMAIN vérifié");
    console.log("  4. Google : Console → Credentials → Authorized redirect URIs (liste ci-dessus)\n");
  }

  await prisma.$disconnect();
  setTimeout(() => process.exit(failed > 0 ? 1 : 0), 50);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
