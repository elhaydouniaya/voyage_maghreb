import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const adminEmail = "admin@maghrebvoyage.com";
  const adminPassword = "admin123";

  console.log("🔧 Creating/updating admin user...");

  try {
    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      if (existingAdmin.role === "ADMIN") {
        console.log("✅ Admin user already exists with ADMIN role");
        // Update password if needed
        await prisma.user.update({
          where: { email: adminEmail },
          data: { passwordHash },
        });
        console.log("✅ Admin password updated");
      } else {
        console.log(`⚠️  Email exists but role is ${existingAdmin.role}, updating to ADMIN and password...`);
        await prisma.user.update({
          where: { email: adminEmail },
          data: { 
            role: "ADMIN", 
            passwordHash,
            name: "Admin",
            emailVerified: new Date(),
          },
        });
        console.log("✅ User updated to ADMIN role");
      }
    } else {
      console.log("📝 Creating new admin user...");
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Admin",
          passwordHash,
          role: "ADMIN",
          emailVerified: new Date(),
        },
      });
      console.log("✅ Admin user created successfully");
    }

    console.log("\n✨ Done! You can now login with:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Portal: http://localhost:3001/admin/login`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
