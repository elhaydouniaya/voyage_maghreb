/**
 * Create a Stripe Connect Express test account for agency@test.com (if missing).
 * Full onboarding still requires the agency settings UI in test mode.
 * Usage: node scripts/setup-stripe-connect-demo.mjs
 */
import "dotenv/config";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const secret = process.env.STRIPE_SECRET_KEY?.trim();

if (!secret || secret.startsWith("sk_live")) {
  console.error("STRIPE_SECRET_KEY (test) required in .env");
  process.exit(1);
}

const stripe = new Stripe(secret);

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "agency@test.com" },
    include: { agency: true },
  });

  if (!user?.agency) {
    console.error("Demo agency not found — run: npm run seed");
    process.exit(1);
  }

  const agency = user.agency;
  let accountId = agency.stripeConnectAccountId;

  if (!accountId) {
    const country = process.env.STRIPE_CONNECT_DEFAULT_COUNTRY?.trim() || "FR";
    const account = await stripe.accounts.create({
      type: "express",
      country,
      email: agency.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "company",
      metadata: { agencyId: agency.id, agencyName: agency.name },
    });
    accountId = account.id;
    await prisma.agency.update({
      where: { id: agency.id },
      data: { stripeConnectAccountId: accountId },
    });
    console.log("Created Connect account:", accountId);
  } else {
    console.log("Connect account already exists:", accountId);
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/agency/settings?stripe=refresh`,
    return_url: `${appUrl}/agency/settings?stripe=return`,
    type: "account_onboarding",
  });

  const account = await stripe.accounts.retrieve(accountId);
  await prisma.agency.update({
    where: { id: agency.id },
    data: {
      stripeConnectChargesEnabled: Boolean(account.charges_enabled),
      stripeConnectPayoutsEnabled: Boolean(account.payouts_enabled),
      stripeConnectOnboardingComplete:
        Boolean(account.charges_enabled) &&
        Boolean(account.payouts_enabled) &&
        Boolean(account.details_submitted),
    },
  });

  console.log("\nStripe Connect status:");
  console.log("  charges_enabled:", account.charges_enabled);
  console.log("  payouts_enabled:", account.payouts_enabled);
  console.log("  details_submitted:", account.details_submitted);

  if (!account.charges_enabled) {
    console.log("\nFinish onboarding (test mode) as agency@test.com:");
    console.log("  1. npm run dev");
    console.log("  2. /agency/login → agency@test.com / agency123");
    console.log("  3. Paramètres → Paiements → Connecter Stripe");
    console.log("\nOr open this link once (expires quickly):");
    console.log(" ", link.url);
    console.log("\nAuto-complete (test, Custom account) : npm run integrations:fix -- --connect");
  } else {
    console.log("\nDemo agency Connect is active.");
  }
}

main()
  .catch((e) => {
    const msg = e.message || String(e);
    console.error(msg);
    if (msg.includes("signed up for Connect")) {
      console.error(
        "\nEnable Stripe Connect on your test account:\n" +
          "  https://dashboard.stripe.com/test/connect/overview\n" +
          "Then re-run: npm run stripe:connect-demo"
      );
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
