import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Manufacturer Onboarding and Verification Workflow:
 * Tests the complete lifecycle:
 * 1. Manufacturer registration Step 1 saves company & facility details, rejects missing fields.
 * 2. Step 2 uploads all 6 mandatory certifications, validates issue/expiry dates, rejects invalid dates/files.
 * 3. Step 3 saves product capabilities from real catalogue; rejects invalid products.
 * 4. Step 4 saves MOQ and typical production delivery schedule; validates positive numbers.
 * 5. Review endpoint shows actual persisted data.
 * 6. Step 5 final submission creates single user account with bcrypt password; prevents duplicates.
 * 7. Manufacturer logs in with password while account is INACTIVE/pending compliance review.
 * 8. Invalid credentials rejected.
 * 9. Protected manufacturing workspace (/api/v1/manufacturer/dashboard) restricted (403) before approval.
 * 10. Cross-manufacturer isolation: cannot access or upload another manufacturer's registration/documents.
 * 11. Admin compliance review lists cases, audits documents, rejects a document with mandatory reason.
 * 12. Manufacturer replaces rejected document from portal; file stored, v2 created, v1 superseded, returns to review.
 * 13. Case cannot be final-approved while any document is rejected.
 * 14. Admin approves all documents and final registration, activating user account.
 * 15. Approved manufacturer successfully accesses /api/v1/manufacturer/dashboard.
 */
describe('Manufacturer registration: complete 5-step workflow, password setup, compliance review & re-upload', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const run = Date.now().toString(36);
  const mfgEmail = `plant.${run}@sunbiolabs.com`;
  const mfgPassword = `MfgSecurePass123!`;
  const mfg2Email = `plant2.${run}@otherpharma.com`;
  const mfg2Password = `Mfg2SecurePass123!`;
  const http = () => request(app.getHttpServer());

  const step1 = {
    companyName: `SunBio LifeSciences Pvt Ltd ${run}`,
    facilityAddress: 'Plot 42, IDA Pashamylaram, Phase III',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '502307',
    mfgCapacity: '10,000,000 Units / Month',
    contactPerson: 'Dr. Vikram Sethi',
    designation: 'Plant Head / Director',
    email: mfgEmail,
    phone: '+91 98765 43210',
  };

  const MANDATORY_KEYS = [
    'mfgLicense',
    'gmpCert',
    'whoGmpCert',
    'isoCert',
    'factoryReg',
    'pollutionCert',
  ];

  let code = '';
  let adminAuthHeader = { Authorization: '' };
  let mfgAuthHeader = { Authorization: '' };
  let mfg2AuthHeader = { Authorization: '' };
  let rejectedDocId = '';
  const rejectedCategory = 'gmpCert';

  const upload = (
    category: string,
    regCode = code,
    issueDate = '2023-04-15',
    expiryDate = '2028-04-14',
    content = '%PDF-1.4 test certificate content',
    fileName = 'doc.pdf',
    authHeader?: { Authorization: string },
  ) => {
    let req = http()
      .post('/api/v1/manufacturer/documents/upload')
      .query({ category, registrationCode: regCode, issueDate, expiryDate });
    if (authHeader) {
      req = req.set(authHeader);
    }
    return req.attach('file', Buffer.from(content), { filename: fileName, contentType: 'application/pdf' });
  };

  beforeAll(async () => {
    app = await createApp({ logger: false });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);

    // Ensure canonical roles exist
    const adminRole = await prisma.role.upsert({
      where: { name: 'ROLE_ADMIN' },
      update: {},
      create: { name: 'ROLE_ADMIN', description: 'Admin' },
    });
    await prisma.role.upsert({
      where: { name: 'ROLE_MANUFACTURER' },
      update: {},
      create: { name: 'ROLE_MANUFACTURER', description: 'Manufacturer' },
    });
    await prisma.role.upsert({
      where: { name: 'ROLE_SUPPLIER' },
      update: {},
      create: { name: 'ROLE_SUPPLIER', description: 'Supplier' },
    });

    // Create an active admin user
    await prisma.user.create({
      data: {
        userCode: `USR-T-mfg-${run}`,
        username: `mfg_admin_${run}`,
        email: `mfg_admin_${run}@test.factorygrid.com`,
        passwordHash: await bcrypt.hash('SecurePass123!', 4),
        fullName: 'Mfg Admin',
        companyName: 'Admin Co',
        accountStatus: 'ACTIVE',
        roles: { create: [{ roleId: adminRole.id }] },
      },
    });

    const adminLogin = await http().post('/api/v1/auth/login').send({
      usernameOrEmail: `mfg_admin_${run}`,
      password: 'SecurePass123!',
    });
    expect(adminLogin.status).toBe(200);
    adminAuthHeader = { Authorization: `Bearer ${adminLogin.body.accessToken}` };
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. lists master product catalogue from the database', async () => {
    const res = await http().get('/api/v1/manufacturer/catalog');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(5);
    const p1 = res.body.find((p: any) => p.id === 'p1');
    expect(p1).toBeDefined();
    expect(p1.name).toContain('Amoxyclav');
  });

  it('2. Step 1: saves company and facility information and validates required fields', async () => {
    // Missing required fields rejected with 400
    const failRes = await http().post('/api/v1/manufacturer/registration/step-1').send({
      ...step1,
      companyName: '',
    });
    expect(failRes.status).toBe(400);

    // Valid Step 1 creates draft
    const okRes = await http().post('/api/v1/manufacturer/registration/step-1').send(step1);
    expect(okRes.status).toBe(201);
    expect(okRes.body.success).toBe(true);
    expect(okRes.body.registrationCode).toMatch(/^REG-MFG-/);
    code = okRes.body.registrationCode;

    // Database verification
    const draft = await prisma.manufacturerRegistration.findUniqueOrThrow({ where: { registrationCode: code } });
    expect(draft.companyName).toBe(step1.companyName);
    expect(draft.facilityAddress).toBe(step1.facilityAddress);
    expect(draft.city).toBe('Hyderabad');
    expect(draft.status).toBe('DRAFT');
    expect(draft.currentStep).toBe(1);
  });

  it('3. Step 2: uploads all 6 certifications, validates dates and rejects invalid files', async () => {
    // Non-PDF / invalid signature rejected
    const badFile = await upload('mfgLicense', code, '2023-01-01', '2028-01-01', 'NOT_A_PDF_SIGNATURE');
    expect(badFile.status).toBe(400);

    // Expiry date before issue date rejected
    const badDate = await upload('mfgLicense', code, '2025-01-01', '2024-01-01');
    expect(badDate.status).toBe(400);

    // Upload all 6 valid certifications
    for (const key of MANDATORY_KEYS) {
      const res = await upload(key, code);
      expect(res.status).toBe(201);
      expect(res.body.category).toBe(key);
      expect(res.body.status).toBe('PENDING');
      expect(res.body.version).toBe(1);
    }

    // Step 2 dates endpoint update
    const step2Payload = {
      documents: MANDATORY_KEYS.map((key) => ({
        category: key,
        issueDate: '2023-04-15',
        expiryDate: '2028-04-14',
      })),
    };
    const step2Res = await http()
      .post('/api/v1/manufacturer/registration/step-2')
      .query({ registrationCode: code })
      .send(step2Payload);
    expect(step2Res.status).toBe(201);
    expect(step2Res.body.currentStep).toBe(2);
  });

  it('4. Step 3: saves product capabilities from real catalogue; rejects unknown products', async () => {
    // Unknown product rejected
    const badProd = await http()
      .post('/api/v1/manufacturer/registration/step-3')
      .query({ registrationCode: code })
      .send({ productIds: ['p1', 'non_existent_product_xyz'] });
    expect(badProd.status).toBe(400);

    // Select valid products p1, p2, p3
    const step3Res = await http()
      .post('/api/v1/manufacturer/registration/step-3')
      .query({ registrationCode: code })
      .send({ productIds: ['p1', 'p2', 'p3'] });
    expect(step3Res.status).toBe(201);
    expect(step3Res.body.currentStep).toBe(3);

    const prods = await prisma.manufacturerProduct.findMany({
      where: { registration: { registrationCode: code } },
    });
    expect(prods).toHaveLength(3);
  });

  it('5. Step 4: saves MOQ and delivery lead time; validates positive integers', async () => {
    // Zero MOQ rejected
    const badMoq = await http()
      .post('/api/v1/manufacturer/registration/step-4')
      .query({ registrationCode: code })
      .send({ items: [{ productId: 'p1', moq: 0, leadTimeDays: 14 }] });
    expect(badMoq.status).toBe(400);

    // Valid MOQ and lead times for p1, p2, p3
    const step4Res = await http()
      .post('/api/v1/manufacturer/registration/step-4')
      .query({ registrationCode: code })
      .send({
        items: [
          { productId: 'p1', moq: 1000, leadTimeDays: 18 },
          { productId: 'p2', moq: 2000, leadTimeDays: 10 },
          { productId: 'p3', moq: 1500, leadTimeDays: 14 },
        ],
      });
    expect(step4Res.status).toBe(201);
    expect(step4Res.body.currentStep).toBe(4);
  });

  it('6. Review screen returns persisted backend data', async () => {
    const reviewRes = await http().get(`/api/v1/manufacturer/registration/${code}`);
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.company.companyName).toBe(step1.companyName);
    expect(reviewRes.body.documents).toHaveLength(6);
    expect(reviewRes.body.products).toHaveLength(3);
    expect(reviewRes.body.products[0].moq).toBe(1000);
  });

  it('7. Step 5: final submit creates single user account with bcrypt hash, prevents duplicates', async () => {
    const subRes = await http().post('/api/v1/manufacturer/registration/submit').send({
      registrationCode: code,
      password: mfgPassword,
      confirmAccurate: true,
    });
    expect(subRes.status).toBe(201);
    expect(subRes.body.status).toBe('SUBMITTED');

    // Duplicate submission rejected with 409
    const dupRes = await http().post('/api/v1/manufacturer/registration/submit').send({
      registrationCode: code,
      password: mfgPassword,
      confirmAccurate: true,
    });
    expect(dupRes.status).toBe(409);

    // User in database verified
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: mfgEmail },
      include: { roles: { include: { role: true } } },
    });
    expect(user.accountStatus).toBe('INACTIVE');
    expect(await bcrypt.compare(mfgPassword, user.passwordHash)).toBe(true);
    const roleNames = user.roles.map((r) => r.role.name);
    expect(roleNames).toContain('ROLE_MANUFACTURER');
    expect(roleNames).toContain('ROLE_SUPPLIER');
  });

  it('8. manufacturer can log in while INACTIVE / pending compliance review; workspace restricted (403)', async () => {
    // Login with wrong password rejected
    const badLogin = await http().post('/api/v1/auth/login').send({
      usernameOrEmail: mfgEmail,
      password: 'WrongPassword123!',
    });
    expect(badLogin.status).toBe(401);

    // Login with correct password succeeds
    const loginRes = await http().post('/api/v1/auth/login').send({
      usernameOrEmail: mfgEmail,
      password: mfgPassword,
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeDefined();
    mfgAuthHeader = { Authorization: `Bearer ${loginRes.body.accessToken}` };

    // Profile accessible
    const profile = await http().get('/api/v1/manufacturer/profile').set(mfgAuthHeader);
    expect(profile.status).toBe(200);

    // My registration accessible
    const myReg = await http().get('/api/v1/manufacturer/my-registration').set(mfgAuthHeader);
    expect(myReg.status).toBe(200);
    expect(myReg.body.registrationCode).toBe(code);

    // Manufacturing dashboard strictly restricted (403) before approval
    const dashboard = await http().get('/api/v1/manufacturer/dashboard').set(mfgAuthHeader);
    expect(dashboard.status).toBe(403);
  });

  it('9. prevents cross-manufacturer tampering or document access', async () => {
    // Create second manufacturer
    const mfg2Step1 = await http().post('/api/v1/manufacturer/registration/step-1').send({
      ...step1,
      companyName: 'Second Manufacturer Ltd',
      email: mfg2Email,
    });
    expect(mfg2Step1.status).toBe(201);
    const code2 = mfg2Step1.body.registrationCode;

    for (const key of MANDATORY_KEYS) {
      await upload(key, code2);
    }
    await http().post('/api/v1/manufacturer/registration/step-3').query({ registrationCode: code2 }).send({ productIds: ['p1'] });
    await http().post('/api/v1/manufacturer/registration/step-4').query({ registrationCode: code2 }).send({
      items: [{ productId: 'p1', moq: 500, leadTimeDays: 7 }],
    });
    await http().post('/api/v1/manufacturer/registration/submit').send({
      registrationCode: code2,
      password: mfg2Password,
      confirmAccurate: true,
    });

    const mfg2Login = await http().post('/api/v1/auth/login').send({
      usernameOrEmail: mfg2Email,
      password: mfg2Password,
    });
    expect(mfg2Login.status).toBe(200);
    mfg2AuthHeader = { Authorization: `Bearer ${mfg2Login.body.accessToken}` };

    // Manufacturer 2 tries to access Manufacturer 1's registration -> 403
    const crossReg = await http().get(`/api/v1/manufacturer/registration/${code}`).set(mfg2AuthHeader);
    expect(crossReg.status).toBe(403);

    // Manufacturer 2 tries to upload document to Manufacturer 1's registration -> 403
    const crossUpload = await upload('mfgLicense', code, '2023-01-01', '2028-01-01', '%PDF-1.4 hacked', 'hacked.pdf', mfg2AuthHeader);
    expect(crossUpload.status).toBe(403);
  });

  it('10. admin audits documents, rejects a certification with reason, requiring action', async () => {
    // Admin lists submitted manufacturer registrations
    const listRes = await http().get('/api/v1/manufacturer/review/verifications').set(adminAuthHeader);
    expect(listRes.status).toBe(200);
    const item = listRes.body.find((r: any) => r.registrationCode === code);
    expect(item).toBeDefined();

    // Fetch single review case
    const caseRes = await http().get(`/api/v1/manufacturer/review/verifications/${code}`).set(adminAuthHeader);
    expect(caseRes.status).toBe(200);
    const gmpDoc = caseRes.body.documents.find((d: any) => d.category === rejectedCategory);
    expect(gmpDoc).toBeDefined();
    rejectedDocId = gmpDoc.id;

    // Rejecting without reason fails with 400
    const noReason = await http()
      .post(`/api/v1/manufacturer/review/verifications/${code}/documents/${rejectedDocId}/review`)
      .set(adminAuthHeader)
      .send({ decision: 'REJECTED' });
    expect(noReason.status).toBe(400);

    // Reject with appropriate reason
    const reviewRes = await http()
      .post(`/api/v1/manufacturer/review/verifications/${code}/documents/${rejectedDocId}/review`)
      .set(adminAuthHeader)
      .send({
        decision: 'REJECTED',
        reason: 'CDSCO Schedule M certificate seal is unreadable. Please re-upload clear scanned copy.',
      });
    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.document.reviewDecision).toBe('REJECTED');
    expect(reviewRes.body.document.rejectionReason).toContain('unreadable');

    // Case cannot be final approved while document is rejected
    const approveFail = await http()
      .post(`/api/v1/manufacturer/review/verifications/${code}/approve`)
      .set(adminAuthHeader)
      .send({});
    expect(approveFail.status).toBe(400);
  });

  it('11. manufacturer logs in after rejection, views reason, uploads replacement v2, and marks v1 superseded', async () => {
    // Manufacturer checks documents and sees rejection reason
    const myDocs = await http().get('/api/v1/manufacturer/documents').set(mfgAuthHeader);
    expect(myDocs.status).toBe(200);
    const rejected = myDocs.body.find((d: any) => d.id === rejectedDocId || d.category === rejectedCategory);
    expect(rejected).toBeDefined();
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.rejectionReason).toContain('unreadable');

    // Upload replacement document
    const replaceRes = await upload(
      rejectedCategory,
      code,
      '2023-06-10',
      '2027-06-09',
      '%PDF-1.4 clear replacement gmp cert',
      'clear_gmp_cert_v2.pdf',
      mfgAuthHeader,
    );
    expect(replaceRes.status).toBe(201);
    expect(replaceRes.body.version).toBe(2);
    expect(replaceRes.body.status).toBe('PENDING');

    // Database check: v1 superseded, v2 active
    const docs = await prisma.manufacturerDocument.findMany({
      where: { registration: { registrationCode: code }, category: rejectedCategory },
      orderBy: { version: 'asc' },
    });
    expect(docs).toHaveLength(2);
    expect(docs[0].version).toBe(1);
    expect(docs[0].status).toBe('SUPERSEDED');
    expect(docs[1].version).toBe(2);
    expect(docs[1].status).toBe('PENDING');
  });

  it('12. admin approves all documents and final case, activating account and unlocking dashboard', async () => {
    // Approve all 6 certifications
    const docsRes = await http().get(`/api/v1/manufacturer/review/verifications/${code}`).set(adminAuthHeader);
    for (const doc of docsRes.body.documents) {
      const appDoc = await http()
        .post(`/api/v1/manufacturer/review/verifications/${code}/documents/${doc.id}/review`)
        .set(adminAuthHeader)
        .send({ decision: 'APPROVED' });
      expect(appDoc.status).toBe(201);
    }

    // Approve the final registration
    const approveCase = await http()
      .post(`/api/v1/manufacturer/review/verifications/${code}/approve`)
      .set(adminAuthHeader)
      .send({});
    expect(approveCase.status).toBe(201);
    expect(approveCase.body.status).toBe('APPROVED');
    expect(approveCase.body.manufacturerCode).toMatch(/^MFG/);

    // Database user account status is now ACTIVE
    const user = await prisma.user.findUniqueOrThrow({ where: { email: mfgEmail } });
    expect(user.accountStatus).toBe('ACTIVE');

    // Approved manufacturer accesses workspace dashboard successfully
    const dashboard = await http().get('/api/v1/manufacturer/dashboard').set(mfgAuthHeader);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.portal).toBe('MANUFACTURER');
    expect(dashboard.body.message).toContain('access granted');
  });
});
