import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create Admin
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@maghrebvoyage.com" },
    update: {},
    create: {
      email: "admin@maghrebvoyage.com",
      name: "Admin Maghreb",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  // Create Client
  const clientPasswordHash = await bcrypt.hash("client123", 10);
  await prisma.user.upsert({
    where: { email: "client@test.com" },
    update: {},
    create: {
      email: "client@test.com",
      name: "Jean Client",
      passwordHash: clientPasswordHash,
      role: "CLIENT",
    },
  });

  console.log("Seed finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
