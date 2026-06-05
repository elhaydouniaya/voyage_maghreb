import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("agency123", 12);
  
  const agencyUser = await prisma.user.upsert({
    where: { email: "agency@test.com" },
    update: { role: "AGENCY", passwordHash },
    create: {
      email: "agency@test.com",
      name: "Agence Demo",
      role: "AGENCY",
      passwordHash,
      emailVerified: new Date(),
    }
  });
  
  console.log(`✅ Agency user created/updated: ${agencyUser.email} | role: ${agencyUser.role} | id: ${agencyUser.id}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
