import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Creates the first administrator from BOOTSTRAP_ADMIN_* variables.
 * Run once per environment; it never overwrites an existing account.
 */
async function main(): Promise<void> {
  try {
    process.loadEnvFile('.env');
  } catch {
    // variables come from the environment
  }

  const username = process.env.BOOTSTRAP_ADMIN_USERNAME || 'admin';
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@factorygrid.com').toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error('Set BOOTSTRAP_ADMIN_PASSWORD (at least 12 characters) before creating the admin.');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required.');
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
    if (existing) {
      console.log(`Admin "${existing.username}" already exists; nothing changed.`);
      return;
    }
    const role = await prisma.role.upsert({
      where: { name: 'ROLE_ADMIN' },
      update: {},
      create: { name: 'ROLE_ADMIN', description: 'Platform System Administrator with governance access' },
    });
    await prisma.user.create({
      data: {
        userCode: 'USR-ADM-001',
        username,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        fullName: 'System Administrator',
        companyName: 'FactoryGrid Platform',
        companyCode: 'FG-HQ-001',
        department: 'Executive IT & Security',
        jobTitle: 'Super Administrator',
        roles: { create: [{ roleId: role.id }] },
      },
    });
    console.log(`Admin "${username}" created.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
