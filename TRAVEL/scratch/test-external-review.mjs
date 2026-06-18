import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const count = await prisma.externalReview.count();
  console.log("externalReview count:", count);
  const agencies = await prisma.agency.findMany({ select: { id: true, name: true } });
  console.log("agencies:", agencies.length);
} catch (e) {
  console.error("ERR:", e.message);
} finally {
  await prisma.$disconnect();
}
