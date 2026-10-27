import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Manufacturer Factory Gallery & Achievements E2E Tests', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const run = Date.now().toString(36);

  const mfg1Email = `mfg1.${run}@biotechlabs.com`;
  const mfg2Email = `mfg2.${run}@rivalpharma.com`;
  const adminEmail = `admin.${run}@factorygrid.com`;
  const commonPassword = 'StrongPassword123!';

  let mfg1AuthHeader = { Authorization: '' };
  let mfg2AuthHeader = { Authorization: '' };
  let adminAuthHeader = { Authorization: '' };

  let reg1Code = '';
  let reg2Code = '';
  let galleryEntry1Id = '';
  let achievement1Id = '';

  const pngBytes = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]);

  const pdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
  const fakeExeBytes = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00');

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createApp({ logger: false });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);

    // Ensure roles exist
    const adminRole = await prisma.role.upsert({
      where: { name: 'ROLE_ADMIN' },
      update: {},
      create: { name: 'ROLE_ADMIN', description: 'Admin' },
    });
    const mfgRole = await prisma.role.upsert({
      where: { name: 'ROLE_MANUFACTURER' },
      update: {},
      create: { name: 'ROLE_MANUFACTURER', description: 'Manufacturer' },
    });
    await prisma.role.upsert({
      where: { name: 'ROLE_SUPPLIER' },
      update: {},
      create: { name: 'ROLE_SUPPLIER', description: 'Supplier' },
    });

    const passwordHash = await bcrypt.hash(commonPassword, 4);

    // Create Admin User
    await prisma.user.create({
      data: {
        userCode: `USR-ADM-${run}`,
        username: `admin_${run}`,
        email: adminEmail,
        passwordHash,
        fullName: 'Platform Admin',
        accountStatus: 'ACTIVE',
        roles: { create: [{ roleId: adminRole.id }] },
      },
    });

    // Create Manufacturer 1 User & Registration
    const user1 = await prisma.user.create({
      data: {
        userCode: `USR-MFG1-${run}`,
        username: `mfg1_${run}`,
        email: mfg1Email,
        passwordHash,
        fullName: 'Biotech Labs Head',
        companyName: `BioTech Formulations Pvt Ltd ${run}`,
        accountStatus: 'ACTIVE',
        roles: { create: [{ roleId: mfgRole.id }] },
      },
    });

    reg1Code = `REG-MFG1-${run.toUpperCase()}`;
    await prisma.manufacturerRegistration.create({
      data: {
        registrationCode: reg1Code,
        userId: user1.id,
        companyName: `BioTech Formulations Pvt Ltd ${run}`,
        facilityAddress: 'Plot 101, Pharma SEZ, Baddi',
        city: 'Solan',
        state: 'Himachal Pradesh',
        pincode: '173205',
        mfgCapacity: '5,000,000 Vials / Month',
        contactPerson: 'Biotech Labs Head',
        designation: 'Director',
        email: mfg1Email,
        phone: '+91 98111 22233',
        status: 'APPROVED',
        manufacturerCode: `MFG-BIO-${run.toUpperCase().slice(0, 4)}`,
      },
    });

    // Create Manufacturer 2 User & Registration (for cross-tenant checks)
    const user2 = await prisma.user.create({
      data: {
        userCode: `USR-MFG2-${run}`,
        username: `mfg2_${run}`,
        email: mfg2Email,
        passwordHash,
        fullName: 'Rival Pharma Head',
        companyName: `Rival Healthcare Ltd ${run}`,
        accountStatus: 'ACTIVE',
        roles: { create: [{ roleId: mfgRole.id }] },
      },
    });

    reg2Code = `REG-MFG2-${run.toUpperCase()}`;
    await prisma.manufacturerRegistration.create({
      data: {
        registrationCode: reg2Code,
        userId: user2.id,
        companyName: `Rival Healthcare Ltd ${run}`,
        facilityAddress: 'Plot 202, GIDC Panoli',
        city: 'Ankleshwar',
        state: 'Gujarat',
        pincode: '394116',
        mfgCapacity: '2,000,000 Units / Month',
        contactPerson: 'Rival Pharma Head',
        designation: 'Managing Director',
        email: mfg2Email,
        phone: '+91 98222 33344',
        status: 'SUBMITTED',
      },
    });

    // Logins
    const adminLogin = await http().post('/api/v1/auth/login').send({
      usernameOrEmail: adminEmail,
      password: commonPassword,
    });
    expect(adminLogin.status).toBe(200);
    adminAuthHeader = { Authorization: `Bearer ${adminLogin.body.accessToken}` };

    const mfg1Login = await http().post('/api/v1/auth/login').send({
      usernameOrEmail: mfg1Email,
      password: commonPassword,
    });
    expect(mfg1Login.status).toBe(200);
    mfg1AuthHeader = { Authorization: `Bearer ${mfg1Login.body.accessToken}` };

    const mfg2Login = await http().post('/api/v1/auth/login').send({
      usernameOrEmail: mfg2Email,
      password: commonPassword,
    });
    expect(mfg2Login.status).toBe(200);
    mfg2AuthHeader = { Authorization: `Bearer ${mfg2Login.body.accessToken}` };
  });

  afterAll(async () => {
    await app.close();
  });

  // ------------------------------------------------------------- Factory Gallery Tests
  describe('Factory Gallery API', () => {
    it('1. rejects gallery upload with forged/invalid image content (e.g. exe disguised as png)', async () => {
      const res = await http()
        .post('/api/v1/manufacturer/gallery/upload')
        .set(mfg1AuthHeader)
        .query({
          title: 'Forged Executable',
          factoryLocation: 'Main Plant',
        })
        .attach('file', fakeExeBytes, { filename: 'dangerous.png', contentType: 'image/png' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/valid JPG, PNG, and WebP/i);
    });

    it('2. rejects gallery upload with future capture date', async () => {
      const res = await http()
        .post('/api/v1/manufacturer/gallery/upload')
        .set(mfg1AuthHeader)
        .query({
          title: 'Future Plant',
          factoryLocation: 'Future Block',
          captureDate: '2099-01-01',
        })
        .attach('file', pngBytes, { filename: 'photo.png', contentType: 'image/png' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/captureDate cannot be in the future/i);
    });

    it('3. rejects gallery upload if mandatory title or location is missing', async () => {
      const res = await http()
        .post('/api/v1/manufacturer/gallery/upload')
        .set(mfg1AuthHeader)
        .attach('file', pngBytes, { filename: 'photo.png', contentType: 'image/png' });

      expect(res.status).toBe(400);
    });

    it('4. manufacturer 1 uploads valid factory photo with location, capture date, description, and GPS', async () => {
      const res = await http()
        .post('/api/v1/manufacturer/gallery/upload')
        .set(mfg1AuthHeader)
        .query({
          title: 'Lyophilization Cleanroom Block A',
          description: 'Class 100 sterile freeze-drying unit for lyophilized injectables.',
          factoryLocation: 'Unit II, Cleanroom Bay 4, Baddi Plant',
          captureDate: '2026-02-10',
          gpsCoordinates: '30.9578° N, 76.7914° E',
        })
        .attach('file', pngBytes, { filename: 'lyo_cleanroom.png', contentType: 'image/png' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Lyophilization Cleanroom Block A');
      expect(res.body.factoryLocation).toBe('Unit II, Cleanroom Bay 4, Baddi Plant');
      expect(res.body.captureDate).toBe('2026-02-10');
      expect(res.body.gpsCoordinates).toBe('30.9578° N, 76.7914° E');
      expect(res.body.verificationStatus).toBe('PENDING_VERIFICATION');
      expect(res.body.imageUrl).toContain(`/api/v1/manufacturer/gallery/${res.body.id}/image`);

      galleryEntry1Id = res.body.id;
    });

    it('4b. manufacturer 1 uploads factory photo with multipart form-data fields (not query params) and locationName/capturedAt/coordinates', async () => {
      const res = await http()
        .post('/api/v1/manufacturer/gallery/upload')
        .set(mfg1AuthHeader)
        .field('title', 'Sterile Ampoule Filling Suite')
        .field('description', 'High-speed automated ampoule washing, sterilization, and sealing line.')
        .field('locationName', 'Formulation Block 3, Sterile Wing')
        .field('capturedAt', '2026-03-01')
        .field('latitude', '30.957800')
        .field('longitude', '76.791400')
        .attach('file', pngBytes, { filename: 'ampoule_filling.png', contentType: 'image/png' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Sterile Ampoule Filling Suite');
      expect(res.body.factoryLocation).toBe('Formulation Block 3, Sterile Wing');
      expect(res.body.captureDate).toBe('2026-03-01');
      expect(res.body.gpsCoordinates).toBe('30.957800, 76.791400');
    });

    it('5. lists gallery entries for manufacturer 1', async () => {
      const res = await http()
        .get('/api/v1/manufacturer/gallery')
        .set(mfg1AuthHeader);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const entry = res.body.find((e: any) => e.id === galleryEntry1Id);
      expect(entry).toBeDefined();
      expect(entry.title).toBe('Lyophilization Cleanroom Block A');
    });

    it('6. streams factory gallery image successfully with correct content-type', async () => {
      const res = await http().get(`/api/v1/manufacturer/gallery/${galleryEntry1Id}/image`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('image/png');
      expect(res.body).toBeDefined();
    });

    it('7. manufacturer 1 updates gallery entry metadata', async () => {
      const res = await http()
        .patch(`/api/v1/manufacturer/gallery/${galleryEntry1Id}`)
        .set(mfg1AuthHeader)
        .send({
          title: 'Lyophilization Cleanroom Block A (ISO 5 Certified)',
          description: 'Updated equipment details: 200 sq ft chamber capacity.',
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Lyophilization Cleanroom Block A (ISO 5 Certified)');
      expect(res.body.description).toBe('Updated equipment details: 200 sq ft chamber capacity.');
    });

    it('8. cross-manufacturer tenant isolation: manufacturer 2 CANNOT update or delete manufacturer 1 gallery entry', async () => {
      const updateRes = await http()
        .patch(`/api/v1/manufacturer/gallery/${galleryEntry1Id}`)
        .set(mfg2AuthHeader)
        .send({ title: 'Hacked Title' });

      expect(updateRes.status).toBe(403);

      const deleteRes = await http()
        .delete(`/api/v1/manufacturer/gallery/${galleryEntry1Id}`)
        .set(mfg2AuthHeader);

      expect(deleteRes.status).toBe(403);
    });
  });

  // ------------------------------------------------------------- Achievements & Awards Tests
  describe('Manufacturer Achievements API', () => {
    it('9. rejects achievement with future issue date', async () => {
      const res = await http()
        .post('/api/v1/manufacturer/achievements')
        .set(mfg1AuthHeader)
        .send({
          title: 'Future Award',
          awardType: 'QUALITY_EXCELLENCE',
          issuingOrganization: 'Govt of India',
          issueDate: '2099-01-01',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/issueDate cannot be in the future/i);
    });

    it('10. rejects achievement when expiry date is before or equal to issue date', async () => {
      const res = await http()
        .post('/api/v1/manufacturer/achievements')
        .set(mfg1AuthHeader)
        .send({
          title: 'Expired Trophy',
          awardType: 'QUALITY_EXCELLENCE',
          issuingOrganization: 'IPQF',
          issueDate: '2024-05-10',
          expiryDate: '2024-05-09',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/expiryDate must be after the issueDate/i);
    });

    it('11. manufacturer 1 creates genuine achievement and uploads supporting certificate', async () => {
      const res = await http()
        .post('/api/v1/manufacturer/achievements')
        .set(mfg1AuthHeader)
        .send({
          title: 'Gold Trophy - Best Formulation Plant 2025',
          awardType: 'QUALITY_EXCELLENCE',
          issuingOrganization: 'Indian Pharma Quality Forum (IPQF)',
          issueDate: '2025-10-15',
          expiryDate: '2028-10-14',
          description: 'Awarded for zero 483 observations during statutory WHO-GMP audit.',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Gold Trophy - Best Formulation Plant 2025');
      expect(res.body.verificationStatus).toBe('PENDING_VERIFICATION');
      expect(res.body.hasCertificate).toBe(false);

      achievement1Id = res.body.id;

      // Upload supporting certificate document
      const certRes = await http()
        .post(`/api/v1/manufacturer/achievements/${achievement1Id}/certificate`)
        .set(mfg1AuthHeader)
        .attach('file', pdfBytes, { filename: 'ipqf_award_certificate.pdf', contentType: 'application/pdf' });

      expect(certRes.status).toBe(201);
      expect(certRes.body.hasCertificate).toBe(true);
      expect(certRes.body.certificateFileName).toBe('ipqf_award_certificate.pdf');
      expect(certRes.body.certificateUrl).toContain(`/api/v1/manufacturer/achievements/${achievement1Id}/certificate`);
    });

    it('12. lists achievements for manufacturer 1', async () => {
      const res = await http()
        .get('/api/v1/manufacturer/achievements')
        .set(mfg1AuthHeader);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const ach = res.body.find((a: any) => a.id === achievement1Id);
      expect(ach).toBeDefined();
      expect(ach.issuingOrganization).toBe('Indian Pharma Quality Forum (IPQF)');
      expect(ach.hasCertificate).toBe(true);
    });

    it('13. downloads achievement supporting certificate', async () => {
      const res = await http().get(`/api/v1/manufacturer/achievements/${achievement1Id}/certificate`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });

    it('14. cross-manufacturer tenant isolation: manufacturer 2 CANNOT modify or delete manufacturer 1 achievement', async () => {
      const updateRes = await http()
        .patch(`/api/v1/manufacturer/achievements/${achievement1Id}`)
        .set(mfg2AuthHeader)
        .send({ title: 'Tampered Award' });

      expect(updateRes.status).toBe(403);

      const deleteRes = await http()
        .delete(`/api/v1/manufacturer/achievements/${achievement1Id}`)
        .set(mfg2AuthHeader);

      expect(deleteRes.status).toBe(403);
    });
  });

  // ------------------------------------------------------------- Admin Visibility & Review Tests
  describe('Admin Visibility and Compliance Review', () => {
    it('15. admin retrieves manufacturer 1 registration including persisted gallery and achievements', async () => {
      const res = await http()
        .get(`/api/v1/manufacturer/review/verifications/${reg1Code}`)
        .set(adminAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.registrationCode).toBe(reg1Code);
      expect(Array.isArray(res.body.gallery)).toBe(true);
      expect(res.body.gallery.length).toBeGreaterThanOrEqual(2);
      expect(res.body.gallery.some((g: any) => g.title.includes('Lyophilization Cleanroom Block A'))).toBe(true);
      expect(res.body.gallery.some((g: any) => g.title.includes('Sterile Ampoule Filling Suite'))).toBe(true);

      expect(Array.isArray(res.body.achievements)).toBe(true);
      expect(res.body.achievements.length).toBeGreaterThanOrEqual(1);
      expect(res.body.achievements[0].title).toBe('Gold Trophy - Best Formulation Plant 2025');
    });

    it('16. admin reviews and approves gallery entry', async () => {
      const res = await http()
        .post(`/api/v1/manufacturer/review/verifications/${reg1Code}/gallery/${galleryEntry1Id}/review`)
        .set(adminAuthHeader)
        .send({ decision: 'VERIFIED' });

      expect(res.status).toBe(201);
      expect(res.body.verificationStatus).toBe('VERIFIED');
      expect(res.body.reviewedBy).toBe(`admin_${run}`);
    });

    it('17. admin reviews and approves achievement', async () => {
      const res = await http()
        .post(`/api/v1/manufacturer/review/verifications/${reg1Code}/achievements/${achievement1Id}/review`)
        .set(adminAuthHeader)
        .send({ decision: 'VERIFIED' });

      expect(res.status).toBe(201);
      expect(res.body.verificationStatus).toBe('VERIFIED');
      expect(res.body.reviewedBy).toBe(`admin_${run}`);
    });

    it('18. manufacturer 1 successfully deletes own gallery entry', async () => {
      const res = await http()
        .delete(`/api/v1/manufacturer/gallery/${galleryEntry1Id}`)
        .set(mfg1AuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const listAfter = await http()
        .get('/api/v1/manufacturer/gallery')
        .set(mfg1AuthHeader);

      expect(listAfter.body.some((e: any) => e.id === galleryEntry1Id)).toBe(false);
    });

    it('19. manufacturer 1 successfully deletes own achievement', async () => {
      const res = await http()
        .delete(`/api/v1/manufacturer/achievements/${achievement1Id}`)
        .set(mfg1AuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const listAfter = await http()
        .get('/api/v1/manufacturer/achievements')
        .set(mfg1AuthHeader);

      expect(listAfter.body.some((a: any) => a.id === achievement1Id)).toBe(false);
    });
  });
});
