const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();
async function main() {
  const tables = await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('TABLES:', tables);
  await prisma.$disconnect();
}
main().catch(err => { console.error(err); process.exit(1); });
