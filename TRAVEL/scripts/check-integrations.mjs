/**
 * Full integrations report: Gemini, VAPI, Stripe, Stripe Connect, Cloudinary.
 * Usage: node scripts/check-integrations.mjs
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");

let failed = 0;

function status(name, ok, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed++;
}

async function testGemini() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key.length < 10) {
    status("Gemini API", false, "GEMINI_API_KEY manquant");
    console.log("  → https://aistudio.google.com/apikey (gratuit)");
    console.log("  → Ajoutez GEMINI_API_KEY dans .env puis redémarrez le serveur");
    return;
  }
  if (process.env.GEMINI_DISABLE === "true") {
    status("Gemini API", false, "GEMINI_DISABLE=true");
    return;
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
    );
    if (res.ok) {
      status("Gemini API", true, "clé valide");
    } else {
      const body = await res.text();
      status("Gemini API", false, `HTTP ${res.status} — vérifiez la clé`);
      if (body.length < 200) console.log("  ", body);
    }
  } catch (e) {
    status("Gemini API", false, e.message);
  }
}

async function main() {
  console.log("=== Integrations check ===\n");

  try {
    await p.$connect();
    const [users, connectActive, connectPending] = await Promise.all([
      p.user.count(),
      p.agency.count({ where: { stripeConnectChargesEnabled: true } }),
      p.agency.count({
        where: {
          stripeConnectAccountId: { not: null },
          stripeConnectChargesEnabled: false,
        },
      }),
    ]);
    status("Database (PostgreSQL/Neon)", true, `${users} users`);
    status(
      "Stripe Connect (agences actives)",
      connectActive > 0,
      connectActive > 0
        ? `${connectActive} agence(s) avec encaissements`
        : connectPending > 0
          ? `${connectPending} en attente d'onboarding`
          : "aucune — activez Connect sur Stripe puis onboarding agence"
    );
    if (connectActive === 0) {
      console.log("  → https://dashboard.stripe.com/test/connect/overview");
      console.log("  → Agence : /agency/settings → Paiements → Connecter Stripe");
      console.log("  → CLI : npm run stripe:connect-demo");
    }
  } catch (e) {
    status("Database (PostgreSQL/Neon)", false, e.message);
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
  const stripePublic = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY?.trim();
  const stripeOk = Boolean(stripeSecret && stripePublic);
  status("Stripe keys", stripeOk, stripeOk ? (stripeSecret.startsWith("sk_live") ? "LIVE" : "test") : "STRIPE_* manquants");
  if (!stripeOk) {
    console.log("  → https://dashboard.stripe.com/test/apikeys");
  }

  const webhook = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  status("Stripe webhook secret", Boolean(webhook), webhook ? "set" : "whsec_... pour stripe listen");

  await testGemini();

  const groq = process.env.GROQ_API_KEY?.trim();
  const openai = process.env.OPENAI_API_KEY?.trim();
  status("Groq (matching)", Boolean(groq), groq ? "set" : "optionnel si OpenAI configuré");
  status("OpenAI (fallback)", Boolean(openai), openai ? "set" : "optionnel");

  const vapiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.trim();
  const vapiAsst = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID?.trim();
  const vapiSecret = process.env.VAPI_WEBHOOK_SECRET?.trim();
  status("VAPI public key", Boolean(vapiKey), vapiKey ? "set" : "NEXT_PUBLIC_VAPI_PUBLIC_KEY empty");
  status("VAPI assistant ID", Boolean(vapiAsst), vapiAsst ? "set" : "NEXT_PUBLIC_VAPI_ASSISTANT_ID empty");
  status("VAPI webhook secret", Boolean(vapiSecret), vapiSecret ? "set" : "missing");
  if (!vapiKey || !vapiAsst) {
    console.log("  → https://dashboard.vapi.ai");
    console.log(`  → Server URL assistant : ${base}/api/vapi/webhook`);
    console.log("  → Tools : search_trips, save_travel_request");
  }

  const cName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const cKey = process.env.CLOUDINARY_API_KEY?.trim();
  const cSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const cloudinaryOk = Boolean(cName && cKey && cSecret);
  status("Cloudinary", cloudinaryOk, cloudinaryOk ? cName : "CLOUDINARY_* not set");

  console.log("\n--- Commandes utiles ---");
  console.log("  npm run env:fill          # complète .env (VAPI secret, Gemini placeholders)");
  console.log("  npm run stripe:connect-demo # compte Connect démo agency@test.com");
  console.log("  npm run auto:run:quick      # vérif complète app\n");

  try {
    await p.$disconnect();
  } catch {
    /* ignore */
  }
  setTimeout(() => process.exit(failed > 0 ? 1 : 0), 50);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
