import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, name: true, passwordHash: true }
  });
  console.log("=== ALL USERS ===");
  users.forEach(u => {
    console.log(`  ${u.email} | role: ${u.role} | name: ${u.name} | hasPassword: ${!!u.passwordHash}`);
  });

  // Check specifically agency users
  const agencyUsers = users.filter(u => u.role === 'AGENCY');
  console.log(`\n=== AGENCY USERS: ${agencyUsers.length} ===`);
  agencyUsers.forEach(u => {
    console.log(`  ${u.email} | hasPassword: ${!!u.passwordHash} | passwordHash: ${u.passwordHash ? u.passwordHash.substring(0, 20) + '...' : 'NULL'}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
