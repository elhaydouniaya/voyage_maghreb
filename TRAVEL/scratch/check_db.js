
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    await prisma.$connect();
    console.log('Database connected successfully');
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);
  } catch (e) {
    console.error('Database connection failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
