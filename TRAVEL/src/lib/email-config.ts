import prisma from "@/lib/prisma";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getEmailFromAddress() {
  return process.env.RESEND_FROM?.trim() || "MaghrebVoyage <onboarding@resend.dev>";
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
    openai: {
      configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
      disabled: process.env.OPENAI_DISABLE === "true",
    },
  };
}
