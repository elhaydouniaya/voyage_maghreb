import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const result = await prisma.review.updateMany({
  where: { status: "PENDING" },
  data: { status: "APPROVED" },
});
console.log("Approved pending reviews:", result.count);
await prisma.$disconnect();
