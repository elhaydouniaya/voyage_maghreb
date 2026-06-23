import prisma from "@/lib/prisma";

function normalizeEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  return normalized || null;
}

/**
 * Email canonique du compte en base (celui utilisé à l'inscription).
 * Priorité : userId → recherche par adresse enregistrée → fallback.
 */
export async function resolveAccountEmail(input: {
  userId?: string | null;
  email?: string | null;
}): Promise<string> {
  if (input.userId) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true },
    });
    const fromUser = normalizeEmail(user?.email);
    if (fromUser) return fromUser;
  }

  const candidate = normalizeEmail(input.email);
  if (candidate) {
    const byEmail = await prisma.user.findUnique({
      where: { email: candidate },
      select: { email: true },
    });
    const registered = normalizeEmail(byEmail?.email);
    if (registered) return registered;
    return candidate;
  }

  throw new Error("Adresse email du compte introuvable.");
}

export async function resolveAccountEmailForBooking(booking: {
  userId: string | null;
  clientEmail: string;
}): Promise<string> {
  return resolveAccountEmail({
    userId: booking.userId,
    email: booking.clientEmail,
  });
}
