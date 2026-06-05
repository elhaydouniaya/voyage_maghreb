/**
 * Backfill Agency.slug for existing rows.
 * Usage: node scripts/backfill-agency-slugs.mjs
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

async function uniqueSlug(base) {
  let slug = base || "agence";
  let n = 2;
  while (await prisma.agency.findFirst({ where: { slug } })) {
    slug = `${base}-${n}`;
    n++;
  }
  return slug;
}

async function main() {
  const rows = await prisma.agency.findMany({
    where: { OR: [{ slug: null }, { slug: "" }] },
    select: { id: true, name: true },
  });
  for (const a of rows) {
    const slug = await uniqueSlug(toSlug(a.name));
    await prisma.agency.update({ where: { id: a.id }, data: { slug } });
    console.log(`${a.name} → ${slug}`);
  }
  console.log(`Done. Updated ${rows.length} agency(ies).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
