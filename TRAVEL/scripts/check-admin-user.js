const { PrismaClient } = require('@prisma/client');

(async () => {
  try {
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { email: 'admin@maghrebvoyage.com' },
      select: { id: true, email: true, name: true, role: true, passwordHash: true }
    });
    
    if (user) {
      console.log('✓ Admin user found in database');
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Has password hash: ${!!user.passwordHash}`);
    } else {
      console.log('✗ Admin user NOT found in database');
    }
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
