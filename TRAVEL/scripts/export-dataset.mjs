/**
 * Export trips + agencies JSON for RAG / fine-tuning / VAPI knowledge.
 * Usage: node scripts/export-dataset.mjs
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function main() {
  const outDir = join(__dirname, "..", "data");
  mkdirSync(outDir, { recursive: true });

  const trips = await prisma.groupTrip.findMany({
    where: { status: { in: ["PUBLISHED", "FULL"] }, isPublic: true },
    include: {
      agency: {
        select: {
          name: true,
          country: true,
          specialties: true,
          coverage: true,
        },
      },
    },
  });

  const agencies = await prisma.agency.findMany({
    where: { verificationStatus: "VERIFIED" },
    select: {
      name: true,
      country: true,
      city: true,
      description: true,
      specialties: true,
      coverage: true,
    },
  });

  const dataset = {
    exportedAt: new Date().toISOString(),
    trips: trips.map((t) => ({
      title: t.title,
      slug: t.slug,
      destination: t.destination,
      description: t.description.slice(0, 500),
      tripType: t.tripType,
      totalPrice: Number(t.totalPrice),
      depositAmount: Number(t.depositAmount),
      currency: t.currency,
      durationDays: t.durationDays,
      startDate: t.startDate.toISOString().split("T")[0],
      inclusions: t.inclusions,
      exclusions: t.exclusions,
      aiTags: t.aiTags,
      agency: t.agency?.name,
      agencyCountry: t.agency?.country,
    })),
    agencies,
  };

  const path = join(outDir, "maghreb-catalog.json");
  writeFileSync(path, JSON.stringify(dataset, null, 2), "utf8");
  console.log(`Exported ${trips.length} trips, ${agencies.length} agencies → ${path}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
