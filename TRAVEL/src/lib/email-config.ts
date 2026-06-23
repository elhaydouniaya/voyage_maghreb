import prisma from "@/lib/prisma";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { getLlmProviderLabel, isLlmConfigured } from "@/lib/llm";
import { isGeminiConfigured } from "@/lib/gemini";
import {
  getVapiWebhookUrl,
  isVapiConfigured,
  isVapiWebhookReady,
} from "@/lib/vapi-config";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getEmailFromAddress() {
  return process.env.RESEND_FROM?.trim() || "MaghrebVoyage <onboarding@resend.dev>";
}

/** En dev, Resend n'envoie qu'à RESEND_DEV_TO si l'adresse compte n'est pas vérifiée. */
export function resolveEmailDeliveryTarget(intendedTo: string): {
  intendedTo: string;
  deliveredTo: string;
  devRedirected: boolean;
} {
  const intended = intendedTo.trim().toLowerCase();
  const isDev = process.env.NODE_ENV !== "production";
  const devRedirect = process.env.RESEND_DEV_TO?.trim().toLowerCase();

  if (isDev && devRedirect && devRedirect !== intended) {
    return {
      intendedTo: intended,
      deliveredTo: devRedirect,
      devRedirected: true,
    };
  }

  return { intendedTo: intended, deliveredTo: intended, devRedirected: false };
}

/** Adresse admin pour alertes (env ou premier compte ADMIN en base). */
export async function resolveAdminNotifyEmail(): Promise<string | null> {
  const fromEnv = process.env.ADMIN_NOTIFY_EMAIL?.trim();
  if (fromEnv) return fromEnv;

  try {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { email: true },
      orderBy: { createdAt: "asc" },
    });
    return admin?.email ?? null;
  } catch {
    return null;
  }
}

export function getSystemIntegrationsStatus() {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const isProd = process.env.NODE_ENV === "production";

  return {
    email: {
      configured: isEmailConfigured(),
      from: getEmailFromAddress(),
      mode: isEmailConfigured() ? "resend" : "console",
    },
    stripe: {
      configured: Boolean(
        process.env.STRIPE_SECRET_KEY?.trim() &&
          process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY?.trim()
      ),
      mode: process.env.STRIPE_SECRET_KEY?.trim() ? "live_or_test" : "demo",
    },
    cron: {
      secretSet: Boolean(cronSecret),
      secureInProduction: !isProd || Boolean(cronSecret),
    },
    llm: {
      configured: isLlmConfigured(),
      disabled: process.env.OPENAI_DISABLE === "true",
      provider: getLlmProviderLabel(),
      model:
        process.env.LLM_MODEL?.trim() ||
        process.env.OPENAI_MODEL?.trim() ||
        "gpt-4o-mini",
    },
    gemini: {
      configured: isGeminiConfigured(),
      disabled: process.env.GEMINI_DISABLE === "true",
      model: process.env.GEMINI_MODEL?.trim() || "gemini-1.5-flash",
    },
    cloudinary: {
      configured: isCloudinaryConfigured(),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || null,
    },
    vapi: {
      configured: isVapiConfigured(),
      webhookSecretSet: isVapiWebhookReady(),
      webhookUrl: getVapiWebhookUrl(),
    },
    /** @deprecated use integrations.llm */
    openai: {
      configured: isLlmConfigured(),
      disabled: process.env.OPENAI_DISABLE === "true",
    },
  };
}
