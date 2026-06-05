import prisma from "@/lib/prisma";
import { toSlug } from "@/lib/slug";

export async function generateUniqueAgencySlug(name: string): Promise<string> {
  const base = toSlug(name) || "agence";
  let slug = base;
  let counter = 2;

  while (true) {
    const existing = await prisma.agency.findFirst({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${base}-${counter}`;
    counter++;
  }
}
