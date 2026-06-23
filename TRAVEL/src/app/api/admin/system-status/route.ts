import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getSystemIntegrationsStatus, resolveAdminNotifyEmail } from "@/lib/email-config";
import { getVapiWebhookUrl } from "@/lib/vapi-config";
import { STRIPE_CONNECT_SETUP_URL } from "@/lib/stripe-errors";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const integrations = getSystemIntegrationsStatus();
  const adminNotifyEmail = await resolveAdminNotifyEmail();
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  const [connectActive, connectPending, verifiedAgencies] = await Promise.all([
    prisma.agency.count({ where: { stripeConnectChargesEnabled: true } }),
    prisma.agency.count({
      where: {
        stripeConnectAccountId: { not: null },
        stripeConnectChargesEnabled: false,
      },
    }),
    prisma.agency.count({ where: { verificationStatus: "VERIFIED" } }),
  ]);

  const setupSteps = {
    gemini: [
      "Ouvrir https://aistudio.google.com/apikey et créer une clé API gratuite",
      "Ajouter GEMINI_API_KEY=... dans TRAVEL/.env",
      "Redémarrer npm run dev — le guide client passera en mode Gemini (priorité avant OpenAI)",
    ],
    vapi: [
      "Créer un compte sur https://dashboard.vapi.ai",
      "Account → API Keys → copier la Public Key → NEXT_PUBLIC_VAPI_PUBLIC_KEY",
      "Assistants → créer un assistant FR → copier l'ID → NEXT_PUBLIC_VAPI_ASSISTANT_ID",
      `Assistant → Server URL : ${getVapiWebhookUrl()} · Secret : VAPI_WEBHOOK_SECRET (déjà dans .env)`,
      "Tools (functions) : search_trips, save_travel_request — voir src/lib/vapi-config.ts",
      "Redémarrer npm run dev — bouton vocal bas-gauche sur le site",
    ],
    stripeConnect: [
      `Activer Connect (mode test) : ${STRIPE_CONNECT_SETUP_URL}`,
      "Vérifier STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLIC_KEY dans .env",
      "Terminal : stripe listen --forward-to localhost:3000/api/webhooks/stripe",
      "Agence → Paramètres → Paiements → Connecter mon compte Stripe (agency@test.com)",
      "Option CLI : npm run stripe:connect-demo après activation Connect",
    ],
  };

  return NextResponse.json({
    integrations: {
      ...integrations,
      stripeConnect: {
        platformKeysSet: integrations.stripe.configured,
        agenciesActive: connectActive,
        agenciesPending: connectPending,
        agenciesVerified: verifiedAgencies,
        setupUrl: STRIPE_CONNECT_SETUP_URL,
      },
    },
    setupSteps,
    appUrl: baseUrl,
    adminNotifyEmail: adminNotifyEmail ? adminNotifyEmail.replace(/(.{2}).+(@.+)/, "$1***$2") : null,
  });
}
