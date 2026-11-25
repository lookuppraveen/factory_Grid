import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client';

const BCRYPT_ROUNDS = 12;

const CANONICAL_ROLES = [
  { name: 'ROLE_BUYER', description: 'Procurement Buyer Role for purchasing entities' },
  { name: 'ROLE_SUPPLIER', description: 'Manufacturer / Supplier Role for manufacturing units' },
  { name: 'ROLE_MANUFACTURER', description: 'Canonical Manufacturer Role mapping to Supplier' },
  { name: 'ROLE_ADMIN', description: 'Platform System Administrator with governance access' },
  { name: 'ROLE_COMPLIANCE_OFFICER', description: 'Regulatory and Compliance Desk Officer' },
  { name: 'ROLE_SALES_MANAGER', description: 'Sales and RFQ Management Officer' },
  { name: 'ROLE_ACCOUNTS_MANAGER', description: 'Finance and Invoicing Officer' },
  { name: 'ROLE_FACTORY_BUDDY', description: 'Factory Floor and Logistics Field Agent' },
];

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/factorygrid';
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    console.log('--- 1. Synchronizing Canonical IAM Roles ---');
    const roleMap = new Map<string, bigint>();
    for (const r of CANONICAL_ROLES) {
      const record = await prisma.role.upsert({
        where: { name: r.name },
        update: { description: r.description },
        create: { name: r.name, description: r.description },
      });
      roleMap.set(r.name, record.id);
      console.log(`  ✓ Role: ${r.name} (id: ${record.id})`);
    }

    console.log('\n--- 2. Synchronizing Canonical Accounts in PostgreSQL ---');

    // Admin Account
    const adminHash = await bcrypt.hash('Admin12345678', BCRYPT_ROUNDS);
    const adminRole = roleMap.get('ROLE_ADMIN')!;
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@factorygrid.com' },
      update: {
        passwordHash: adminHash,
        accountStatus: 'ACTIVE',
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
      create: {
        userCode: 'USR-ADM-001',
        username: 'admin',
        email: 'admin@factorygrid.com',
        passwordHash: adminHash,
        fullName: 'System Administrator',
        companyName: 'FactoryGrid Platform',
        companyCode: 'FG-HQ-001',
        department: 'Executive IT & Security',
        jobTitle: 'Super Administrator',
        accountStatus: 'ACTIVE',
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole },
    });
    console.log(`  ✓ Admin: admin@factorygrid.com (username: admin) synchronized.`);

    // Manufacturer Account: cipla_mfg / plant.lead@cipla-pharma.com
    const mfgHash = await bcrypt.hash('Manufacturer12345678', BCRYPT_ROUNDS);
    const mfgRole = roleMap.get('ROLE_MANUFACTURER')!;
    const supplierRole = roleMap.get('ROLE_SUPPLIER')!;
    const mfgUser = await prisma.user.upsert({
      where: { email: 'plant.lead@cipla-pharma.com' },
      update: {
        passwordHash: mfgHash,
        accountStatus: 'ACTIVE',
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
      create: {
        userCode: 'USR-MFG-738087',
        username: 'cipla_mfg',
        email: 'plant.lead@cipla-pharma.com',
        passwordHash: mfgHash,
        fullName: 'Ramesh Khurana',
        phone: '+91 98334 55667',
        companyName: 'Cipla Formulations Ltd',
        companyCode: 'MFG-2026-09FD',
        department: 'Plant Operations',
        jobTitle: 'VP Sterile Manufacturing',
        accountStatus: 'ACTIVE',
      },
    });
    for (const rId of [mfgRole, supplierRole]) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: mfgUser.id, roleId: rId } },
        update: {},
        create: { userId: mfgUser.id, roleId: rId },
      });
    }
    console.log(`  ✓ Manufacturer: plant.lead@cipla-pharma.com (username: cipla_mfg) synchronized.`);

    // 3. Upsert Manufacturer Registration for Cipla
    let mfgReg = await prisma.manufacturerRegistration.findFirst({
      where: {
        OR: [
          { userId: mfgUser.id },
          { email: 'plant.lead@cipla-pharma.com' },
        ],
      },
    });

    if (mfgReg) {
      mfgReg = await prisma.manufacturerRegistration.update({
        where: { id: mfgReg.id },
        data: {
          userId: mfgUser.id,
          companyName: 'Cipla Formulations Ltd',
          facilityAddress: 'Plot 45, MIDC Industrial Area, Kurkumbh',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '413802',
          mfgCapacity: '500,000 Units/Month',
          contactPerson: 'Ramesh Khurana',
          designation: 'VP Sterile Manufacturing',
          email: 'plant.lead@cipla-pharma.com',
          phone: '+91 98334 55667',
          status: 'APPROVED',
          manufacturerCode: 'MFG-2026-09FD',
          whoGmpApplicable: true,
          lifecycleStatus: 'ACTIVE',
        },
      });
    } else {
      mfgReg = await prisma.manufacturerRegistration.create({
        data: {
          registrationCode: 'REG-MFG-CIPLA-01',
          userId: mfgUser.id,
          companyName: 'Cipla Formulations Ltd',
          facilityAddress: 'Plot 45, MIDC Industrial Area, Kurkumbh',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '413802',
          mfgCapacity: '500,000 Units/Month',
          contactPerson: 'Ramesh Khurana',
          designation: 'VP Sterile Manufacturing',
          email: 'plant.lead@cipla-pharma.com',
          phone: '+91 98334 55667',
          currentStep: 4,
          status: 'APPROVED',
          manufacturerCode: 'MFG-2026-09FD',
          whoGmpApplicable: true,
          lifecycleStatus: 'ACTIVE',
        },
      });
    }
    console.log(`  ✓ Manufacturer Registration: ${mfgReg.registrationCode} (id: ${mfgReg.id}) synchronized.`);

    // Link catalog products to Cipla manufacturer registration
    const catalogProducts = await prisma.catalogProduct.findMany({ take: 50 });
    let linkedProductsCount = 0;
    for (const prod of catalogProducts) {
      await prisma.manufacturerProduct.upsert({
        where: {
          registrationId_productId: {
            registrationId: mfgReg.id,
            productId: prod.id,
          },
        },
        update: {
          lifecycleStatus: 'ACTIVE',
        },
        create: {
          registrationId: mfgReg.id,
          productId: prod.id,
          manufacturerProductCode: `M-CIPLA-${prod.productCode}`,
          moq: 500,
          leadTimeDays: 14,
          lifecycleStatus: 'ACTIVE',
          isPreferred: true,
        },
      });
      linkedProductsCount++;
    }
    console.log(`  ✓ Linked ${linkedProductsCount} catalog products to Cipla.`);

    // Buyer Account: apollo_buyer / procurement@apollohospitals.com
    const buyerHash = await bcrypt.hash('Buyer12345678', BCRYPT_ROUNDS);
    const buyerRole = roleMap.get('ROLE_BUYER')!;
    const buyerUser = await prisma.user.upsert({
      where: { email: 'procurement@apollohospitals.com' },
      update: {
        passwordHash: buyerHash,
        accountStatus: 'ACTIVE',
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
      create: {
        userCode: 'USR-BUY-737041',
        username: 'apollo_buyer',
        email: 'procurement@apollohospitals.com',
        passwordHash: buyerHash,
        fullName: 'Dr. Sameer Kulkarni',
        phone: '+91 99001 12233',
        companyName: 'Apollo Pharmacy & Healthcare Ltd',
        companyCode: 'BUY-2026-1139',
        department: 'Central Procurement',
        jobTitle: 'Chief Sourcing Director',
        accountStatus: 'ACTIVE',
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: buyerUser.id, roleId: buyerRole } },
      update: {},
      create: { userId: buyerUser.id, roleId: buyerRole },
    });
    console.log(`  ✓ Buyer: procurement@apollohospitals.com (username: apollo_buyer) synchronized.`);

    // 4. Upsert Buyer Registration for Apollo
    let buyerReg = await prisma.buyerRegistration.findFirst({
      where: {
        OR: [
          { userId: buyerUser.id },
          { email: 'procurement@apollohospitals.com' },
        ],
      },
    });

    if (buyerReg) {
      buyerReg = await prisma.buyerRegistration.update({
        where: { id: buyerReg.id },
        data: {
          userId: buyerUser.id,
          companyName: 'Apollo Pharmacy & Healthcare Ltd',
          businessType: 'HOSPITAL_NETWORK',
          gstNumber: '27AAACA1234A1Z5',
          panNumber: 'AAACA1234A',
          drugLicenseNumber: '20B/21B-MH-PUN-123456',
          contactPerson: 'Dr. Sameer Kulkarni',
          designation: 'Chief Sourcing Director',
          mobileNumber: '+91 99001 12233',
          email: 'procurement@apollohospitals.com',
          billingAddress: 'Apollo Hospitals Complex, Jubilee Hills',
          shippingAddress: 'Apollo Central Warehouse, Bhiwandi',
          state: 'Maharashtra',
          country: 'India',
          pincode: '421302',
          status: 'APPROVED',
        },
      });
    } else {
      buyerReg = await prisma.buyerRegistration.create({
        data: {
          registrationCode: 'REG-BUY-APOLLO-01',
          userId: buyerUser.id,
          companyName: 'Apollo Pharmacy & Healthcare Ltd',
          businessType: 'HOSPITAL_NETWORK',
          gstNumber: '27AAACA1234A1Z5',
          panNumber: 'AAACA1234A',
          drugLicenseNumber: '20B/21B-MH-PUN-123456',
          contactPerson: 'Dr. Sameer Kulkarni',
          designation: 'Chief Sourcing Director',
          mobileNumber: '+91 99001 12233',
          email: 'procurement@apollohospitals.com',
          billingAddress: 'Apollo Hospitals Complex, Jubilee Hills',
          shippingAddress: 'Apollo Central Warehouse, Bhiwandi',
          state: 'Maharashtra',
          country: 'India',
          pincode: '421302',
          currentStep: 4,
          status: 'APPROVED',
        },
      });
    }
    console.log(`  ✓ Buyer Registration: ${buyerReg.registrationCode} (id: ${buyerReg.id}) synchronized.`);

    // 5. Upsert Customer Verification Request for Apollo
    await prisma.customerVerificationRequest.upsert({
      where: { requestCode: 'REQ-VER-APOLLO-01' },
      update: {
        verificationStatus: 'Active',
        customerClassification: 'SPECIAL_PARTY',
        userId: buyerUser.id,
        registrationId: buyerReg.id,
      },
      create: {
        requestCode: 'REQ-VER-APOLLO-01',
        registrationId: buyerReg.id,
        userId: buyerUser.id,
        customerName: 'Dr. Sameer Kulkarni',
        companyName: 'Apollo Pharmacy & Healthcare Ltd',
        customerType: 'Hospital Network',
        customerClassification: 'SPECIAL_PARTY',
        verificationStatus: 'Active',
        gstNumber: '27AAACA1234A1Z5',
        panNumber: 'AAACA1234A',
        drugLicenseNumber: '20B/21B-MH-PUN-123456',
        email: 'procurement@apollohospitals.com',
        phone: '+91 99001 12233',
        contactPerson: 'Dr. Sameer Kulkarni',
        designation: 'Chief Sourcing Director',
        billingAddress: 'Apollo Hospitals Complex, Jubilee Hills',
        shippingAddress: 'Apollo Central Warehouse, Bhiwandi',
        state: 'Maharashtra',
        country: 'India',
        pincode: '421302',
        autoValidation: { validated: true, gstStatus: 'ACTIVE' },
        customerCode: 'BUY-2026-1139',
      },
    });
    console.log(`  ✓ Customer Verification Request: REQ-VER-APOLLO-01 synchronized.`);

    // User Accounts: yuvikasinha19@gmail.com, yuvikasinha223@gmail.com, yuvika@gmail.com
    const userPass = await bcrypt.hash('yuvika12345678', BCRYPT_ROUNDS);
    const personalEmails = ['yuvikasinha19@gmail.com', 'yuvikasinha223@gmail.com', 'yuvika@gmail.com'];
    for (const em of personalEmails) {
      let u = await prisma.user.findFirst({
        where: { email: { equals: em, mode: 'insensitive' } },
      });
      if (u) {
        await prisma.user.update({
          where: { id: u.id },
          data: {
            passwordHash: userPass,
            accountStatus: 'ACTIVE',
            failedLoginAttempts: 0,
            accountLockedUntil: null,
          },
        });
        // Grant BUYER and MANUFACTURER and SUPPLIER roles
        for (const rId of [buyerRole, mfgRole, supplierRole]) {
          await prisma.userRole.upsert({
            where: { userId_roleId: { userId: u.id, roleId: rId } },
            update: {},
            create: { userId: u.id, roleId: rId },
          });
        }
        console.log(`  ✓ Account: ${em} synchronized with BUYER + MANUFACTURER roles.`);
      } else {
        const username = em.split('@')[0];
        const created = await prisma.user.create({
          data: {
            userCode: `USR-M-${Date.now() % 1_000_000}`,
            username,
            email: em,
            passwordHash: userPass,
            fullName: 'Yuvika Sinha',
            phone: '+91 9876543210',
            companyName: 'FactoryGrid Solutions',
            companyCode: 'FG-USER-01',
            department: 'Operations',
            jobTitle: 'Director',
            accountStatus: 'ACTIVE',
            roles: {
              create: [{ roleId: buyerRole }, { roleId: mfgRole }, { roleId: supplierRole }],
            },
          },
        });
        console.log(`  ✓ Created user: ${em} (${username}) with BUYER + MANUFACTURER roles.`);
      }
    }

    console.log('\n--- IAM Seed and Synchronization Completed Successfully ---');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
