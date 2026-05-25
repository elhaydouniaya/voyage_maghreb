import prisma from "@/lib/prisma";

/** Compte technique pour réservations sans inscription (lien magique). */
export async function findOrCreateGuestUser(
  email: string,
  name: string
): Promise<string> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    throw new Error("Email invalide.");
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (existing) return existing.id;

  const created = await prisma.user.create({
    data: {
      email: normalized,
      name: name.trim() || "Voyageur",
      role: "CLIENT",
    },
  });
  return created.id;
}
