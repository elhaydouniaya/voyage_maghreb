import { stripe } from "@/lib/stripe";
import { isStripeConfigured } from "@/lib/payments-config";
import { formatStripeConnectError } from "@/lib/stripe-errors";
import prisma from "@/lib/prisma";

const COUNTRY_MAP: Record<string, string> = {
  maroc: "MA",
  morocco: "MA",
  ma: "MA",
  algérie: "DZ",
  algerie: "DZ",
  dz: "DZ",
  tunisie: "TN",
  tunisia: "TN",
  tn: "TN",
  france: "FR",
  fr: "FR",
};

function resolveConnectCountry(country: string): string {
  const key = country.trim().toLowerCase();
  if (COUNTRY_MAP[key]) return COUNTRY_MAP[key];
  if (key.length === 2) return key.toUpperCase();
  return process.env.STRIPE_CONNECT_DEFAULT_COUNTRY?.trim() || "FR";
}

export class StripeConnectService {
  static isAvailable(): boolean {
    return isStripeConfigured();
  }

  static async getStatus(agencyId: string) {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        stripeConnectAccountId: true,
        stripeConnectChargesEnabled: true,
        stripeConnectPayoutsEnabled: true,
        stripeConnectOnboardingComplete: true,
        email: true,
        country: true,
      },
    });

    if (!agency) throw new Error("Agence introuvable.");

    if (!this.isAvailable()) {
      return {
        configured: false,
        accountId: null,
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingComplete: false,
        requiresAction: false,
      };
    }

    if (!agency.stripeConnectAccountId) {
      return {
        configured: true,
        accountId: null,
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingComplete: false,
        requiresAction: true,
      };
    }

    if (!stripe) {
      return {
        configured: false,
        accountId: agency.stripeConnectAccountId,
        chargesEnabled: agency.stripeConnectChargesEnabled,
        payoutsEnabled: agency.stripeConnectPayoutsEnabled,
        onboardingComplete: agency.stripeConnectOnboardingComplete,
        requiresAction: !agency.stripeConnectOnboardingComplete,
      };
    }

    const account = await stripe.accounts.retrieve(agency.stripeConnectAccountId);
    const chargesEnabled = Boolean(account.charges_enabled);
    const payoutsEnabled = Boolean(account.payouts_enabled);
    const onboardingComplete =
      chargesEnabled && payoutsEnabled && account.details_submitted;

    if (
      chargesEnabled !== agency.stripeConnectChargesEnabled ||
      payoutsEnabled !== agency.stripeConnectPayoutsEnabled ||
      onboardingComplete !== agency.stripeConnectOnboardingComplete
    ) {
      await prisma.agency.update({
        where: { id: agencyId },
        data: {
          stripeConnectChargesEnabled: chargesEnabled,
          stripeConnectPayoutsEnabled: payoutsEnabled,
          stripeConnectOnboardingComplete: onboardingComplete,
        },
      });
    }

    return {
      configured: true,
      accountId: agency.stripeConnectAccountId,
      chargesEnabled,
      payoutsEnabled,
      onboardingComplete,
      requiresAction: !onboardingComplete,
    };
  }

  static async createOnboardingLink(agencyId: string, appUrl: string) {
    if (!stripe) {
      throw new Error("Stripe n'est pas configuré sur le serveur.");
    }

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
    });
    if (!agency) throw new Error("Agence introuvable.");

    let accountId = agency.stripeConnectAccountId;

    if (!accountId) {
      const country = resolveConnectCountry(agency.country);
      try {
        const account = await stripe.accounts.create({
          type: "express",
          country,
          email: agency.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: "company",
          metadata: {
            agencyId: agency.id,
            agencyName: agency.name,
          },
        });
        accountId = account.id;
        await prisma.agency.update({
          where: { id: agency.id },
          data: { stripeConnectAccountId: accountId },
        });
      } catch (error) {
        throw new Error(formatStripeConnectError(error));
      }
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/agency/settings?stripe=refresh`,
      return_url: `${appUrl}/agency/settings?stripe=return`,
      type: "account_onboarding",
    });

    if (!link.url) {
      throw new Error("Impossible de créer le lien d'onboarding Stripe.");
    }

    return { url: link.url, accountId };
  }

  static async syncAccountFromWebhook(accountId: string) {
    if (!stripe) return;

    const agency = await prisma.agency.findFirst({
      where: { stripeConnectAccountId: accountId },
    });
    if (!agency) return;

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
  }
}
