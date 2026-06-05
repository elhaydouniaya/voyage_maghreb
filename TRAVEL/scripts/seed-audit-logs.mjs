/**
 * Seed demo audit log entries (admin actions traceability).
 * Usage: node scripts/seed-audit-logs.mjs
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: "admin@maghrebvoyage.com" },
    select: { id: true },
  });
  const agency = await prisma.agency.findUnique({
    where: { email: "agency@test.com" },
    select: { id: true, name: true },
  });

  if (!admin) {
    console.error("Run npm run seed first (admin@maghrebvoyage.com missing).");
    process.exit(1);
  }

  const existing = await prisma.auditLog.count();
  if (existing >= 5) {
    console.log(`Audit logs already present (${existing}). Skipping.`);
    return;
  }

  const now = Date.now();
  const entries = [
    {
      action: "AGENCY_VERIFIED",
      userId: admin.id,
      details: JSON.stringify({
        agencyId: agency?.id,
        agencyName: agency?.name,
        source: "seed",
      }),
      createdAt: new Date(now - 7 * 86400000),
    },
    {
      action: "TRIP_PUBLISHED",
      userId: admin.id,
      details: JSON.stringify({ source: "seed", note: "Demo catalog trips" }),
      createdAt: new Date(now - 5 * 86400000),
    },
    {
      action: "PAYMENT_REFUND_REQUESTED",
      userId: admin.id,
      details: JSON.stringify({ demo: true, amountCents: 0 }),
      createdAt: new Date(now - 2 * 86400000),
    },
    {
      action: "NEWSLETTER_PARTNERS_SENT",
      userId: admin.id,
      details: JSON.stringify({ demo: true, recipientCount: 0 }),
      createdAt: new Date(now - 86400000),
    },
    {
      action: "SYSTEM_HEALTH_CHECK",
      userId: admin.id,
      details: JSON.stringify({ script: "seed-audit-logs.mjs" }),
      createdAt: new Date(),
    },
  ];

  await prisma.auditLog.createMany({ data: entries });
  console.log(`Created ${entries.length} audit log(s). Total: ${await prisma.auditLog.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
