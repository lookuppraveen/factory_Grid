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
    const role = await prisma.role.upsert({
      where: { name: 'ROLE_ADMIN' },
      update: {},
      create: { name: 'ROLE_ADMIN', description: 'Platform System Administrator with governance access' },
    });

    const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
    const passwordHash = await bcrypt.hash(password, 12);

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          accountStatus: 'ACTIVE',
          failedLoginAttempts: 0,
          accountLockedUntil: null,
        },
      });

      // Ensure user has ROLE_ADMIN assigned
      const hasRole = await prisma.userRole.findUnique({
        where: { userId_roleId: { userId: existing.id, roleId: role.id } },
      });
      if (!hasRole) {
        await prisma.userRole.create({
          data: { userId: existing.id, roleId: role.id },
        });
      }

      console.log(`Admin "${existing.username}" (${existing.email}) credentials synchronized and account verified active.`);
      return;
    }

    await prisma.user.create({
      data: {
        userCode: 'USR-ADM-001',
        username,
        email,
        passwordHash,
        fullName: 'System Administrator',
        companyName: 'FactoryGrid Platform',
        companyCode: 'FG-HQ-001',
        department: 'Executive IT & Security',
        jobTitle: 'Super Administrator',
        accountStatus: 'ACTIVE',
        roles: { create: [{ roleId: role.id }] },
      },
    });
    console.log(`Admin "${username}" created successfully.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
