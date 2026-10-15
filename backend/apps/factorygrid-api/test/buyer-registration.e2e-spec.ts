import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Buyer onboarding and verification workflow fix:
 * Tests the complete lifecycle:
 * 1. Arbitrary non-empty GST/PAN acceptance for testing & frontend business-types.
 * 2. Unperformed government verification recorded as testing accepted (never fake gov result).
 * 3. Buyer password setup and bcrypt hashing; single user account.
 * 4. Buyer login while account is INACTIVE / under review.
 * 5. Restricted procurement dashboard access (403) before approval.
 * 6. Admin document rejection requiring reason & blocking final case approval.
 * 7. Buyer login and rejection reason visibility on portal.
 * 8. Real replacement document upload to storage with version history & return to Under Review.
 * 9. Admin approval of replacement & case activation.
 * 10. Cross-buyer document access denial (403).
 * 11. Approved buyer portal access.
 */
describe('Buyer registration: complete verification workflow, password setup, rejection & re-upload', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const run = Date.now().toString(36);
  const buyerEmail = `onboard.${run}@apexpharma.in`;
  const buyerPassword = `BuyerSecurePass123!`;
  const buyer2Email = `buyer2.${run}@otherpharma.in`;
  const buyer2Password = `Buyer2SecurePass123!`;
  const http = () => request(app.getHttpServer());

  const step1 = {
    companyName: `Onboarding Test Pharma ${run}`,
    businessType: 'Third Party Manufacturing (TPM)',
    gstNumber: 'NON_STANDARD_GSTIN_FOR_TESTING',
    panNumber: 'TESTPAN999',
    drugLicenseNumber: `DL-${run}`,
  };

  const CATEGORIES = [
    'GST Certificate',
    'Drug License',
    'PAN Card',
    'Incorporation Certificate',
    'Cancelled Cheque',
    'Signed Agreement',
  ];
  let code = '';
  let requestCode = '';
  let adminAuthHeader = { Authorization: '' };
  let buyerAuthHeader = { Authorization: '' };
  let buyer2AuthHeader = { Authorization: '' };
  let rejectedDocId = '';
  let rejectedDocCategory = 'GST Certificate';

  const upload = (category: string, regCode = code, mime = 'application/pdf', name = 'doc.pdf', authHeader?: { Authorization: string }) => {
    let req = http()
      .post('/api/v1/buyer/documents/upload')
      .query({ category, registrationCode: regCode });
    if (authHeader) {
      req = req.set(authHeader);
    }
    return req.attach('file', Buffer.from(`%PDF-1.4 ${category} sample file content for testing`), { filename: name, contentType: mime });
  };

  beforeAll(async () => {
    app = await createApp({ logger: false });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);

    const adminRole = await prisma.role.findUnique({ where: { name: 'ROLE_ADMIN' } });
    await prisma.user.create({
      data: {
        userCode: `USR-T-onb-${run}`,
        username: `onb_admin_${run}`,
        email: `onb_admin_${run}@test.factorygrid.com`,
        passwordHash: await bcrypt.hash('SecurePass123!', 4),
        fullName: 'Onboarding Admin',
        companyName: 'Test Co',
        accountStatus: 'ACTIVE',
        roles: { create: [{ roleId: adminRole!.id }] },
      },
    });

    const adminLogin = await http().post('/api/v1/auth/login').send({
      usernameOrEmail: `onb_admin_${run}`,
      password: 'SecurePass123!',
    });
    expect(adminLogin.status).toBe(200);
    adminAuthHeader = { Authorization: `Bearer ${adminLogin.body.accessToken}` };
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. accepts arbitrary non-empty GST and PAN values for testing and frontend business types', async () => {
    // Empty GST should be rejected
    const emptyGst = await http().post('/api/v1/buyer/registration/step-1').send({ ...step1, gstNumber: '' });
    expect(emptyGst.status).toBe(400);

    // Non-empty arbitrary testing GST/PAN & frontend business type 'Third Party Manufacturing (TPM)' accepted
    const ok = await http().post('/api/v1/buyer/registration/step-1').send(step1);
    expect(ok.status).toBe(201);
    code = ok.body.registrationCode;
    expect(code).toMatch(/^REG-BUYER-/);

    const draft = await prisma.buyerRegistration.findUniqueOrThrow({ where: { registrationCode: code } });
    expect(draft.gstNumber).toBe('NON_STANDARD_GSTIN_FOR_TESTING');
    expect(draft.panNumber).toBe('TESTPAN999');
    expect(draft.businessType).toBe('Third Party Manufacturing (TPM)');
  });

  it('2. persists steps 2 and 3 on the draft with password setup', async () => {
    const s2 = await http().post('/api/v1/buyer/registration/step-2').query({ registrationCode: code }).send({
      contactPerson: 'Vikram Mehta',
      designation: 'Director',
      mobileNumber: '+91 98765 43210',
      email: buyerEmail,
      password: buyerPassword,
    });
    expect(s2.status).toBe(201);

    const s3 = await http().post('/api/v1/buyer/registration/step-3').query({ registrationCode: code }).send({
      billingAddress: 'Plot 45 Okhla',
      shippingAddress: 'Warehouse 2',
      state: 'Delhi',
      country: 'India',
      pincode: '110020',
      tpmDetails: { brandName: 'BioCure Formulations', packagingRequirements: 'Alu-Alu Packaging' },
    });
    expect(s3.status).toBe(201);

    const row = await prisma.buyerRegistration.findUniqueOrThrow({ where: { registrationCode: code } });
    expect(row.status).toBe('DRAFT');
    expect(row.contactPerson).toBe('Vikram Mehta');
    expect(row.email).toBe(buyerEmail);
  });

  it('3. uploads all mandatory documents and submits registration with testing acceptance metadata', async () => {
    for (const category of CATEGORIES) {
      const res = await upload(category);
      expect(res.status).toBe(201);
      expect(res.body.category).toBe(category);
      expect(res.body.version).toBe(1);
    }

    const full = {
      registrationCode: code,
      ...step1,
      contactPerson: 'Vikram Mehta',
      designation: 'Director',
      mobileNumber: '+91 98765 43210',
      email: buyerEmail,
      password: buyerPassword,
      billingAddress: 'Plot 45 Okhla',
      shippingAddress: 'Warehouse 2',
      state: 'Delhi',
      country: 'India',
      pincode: '110020',
      confirmAccurate: true,
    };

    const sub = await http().post('/api/v1/buyer/registration/submit').send(full);
    expect(sub.status).toBe(201);
    requestCode = sub.body.requestCode;
    expect(sub.body.verificationStatus).toBe('Under Review');

    // Verify testing acceptance metadata recorded (never fake government verification)
    const vr = await prisma.customerVerificationRequest.findFirstOrThrow({ where: { requestCode } });
    const autoVal = vr.autoValidation as any;
    expect(autoVal.testingAccepted).toBe(true);
    expect(autoVal.governmentVerified).toBe(false);
    expect(autoVal.gstCheck).toContain('Accepted for Testing');
    expect(autoVal.panCheck).toContain('Accepted for Testing');

    // Single account created with bcrypt hash (never plaintext)
    const user = await prisma.user.findUniqueOrThrow({ where: { email: buyerEmail } });
    expect(user.accountStatus).toBe('INACTIVE');
    expect(user.passwordHash).not.toBe(buyerPassword);
    expect(await bcrypt.compare(buyerPassword, user.passwordHash)).toBe(true);
  });

  it('4. allows buyer to log in while account is inactive/under review, but restricts procurement', async () => {
    const loginRes = await http().post('/api/v1/auth/login').send({
      usernameOrEmail: buyerEmail,
      password: buyerPassword,
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeTruthy();
    expect(loginRes.body.user.email).toBe(buyerEmail);
    buyerAuthHeader = { Authorization: `Bearer ${loginRes.body.accessToken}` };

    // Buyer profile and registration details accessible
    const profileRes = await http().get('/api/v1/buyer/profile').set(buyerAuthHeader);
    expect(profileRes.status).toBe(200);

    const myRegRes = await http().get('/api/v1/buyer/my-registration').set(buyerAuthHeader);
    expect(myRegRes.status).toBe(200);
    expect(myRegRes.body.registrationCode).toBe(code);

    // Protected procurement dashboard is strictly restricted (403) before approval
    const dashboardRes = await http().get('/api/v1/buyer/dashboard').set(buyerAuthHeader);
    expect(dashboardRes.status).toBe(403);
  });

  it('5. admin reviews uploaded documents and rejects a document with an appropriate reason', async () => {
    const docsRes = await http().get('/api/v1/buyer/documents').query({ registrationCode: code }).set(adminAuthHeader);
    expect(docsRes.status).toBe(200);
    const gstDoc = docsRes.body.find((d: any) => d.category === rejectedDocCategory);
    expect(gstDoc).toBeTruthy();
    rejectedDocId = gstDoc.id;

    // Rejecting without reason must be rejected with 400
    const noReasonRes = await http()
      .post(`/api/v1/compliance/customer-verifications/${requestCode}/documents/${rejectedDocId}/review`)
      .set(adminAuthHeader)
      .send({ decision: 'REJECTED' });
    expect(noReasonRes.status).toBe(400);

    // Reject with appropriate reason
    const reviewRes = await http()
      .post(`/api/v1/compliance/customer-verifications/${requestCode}/documents/${rejectedDocId}/review`)
      .set(adminAuthHeader)
      .send({
        decision: 'REJECTED',
        reason: 'GST document image is illegible. Please re-upload a clear scanned copy.',
      });
    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.document.reviewDecision).toBe('REJECTED');
    expect(reviewRes.body.document.rejectionReason).toContain('illegible');
    expect(reviewRes.body.document.reviewedBy).toBeTruthy();
    expect(reviewRes.body.document.reviewedAt).toBeTruthy();

    // A rejected document moves the case to Rejected (NEEDS_REPLACEMENT would map to Need More Docs); registration is ACTION_REQUIRED
    const updatedCase = await prisma.customerVerificationRequest.findFirstOrThrow({ where: { requestCode } });
    expect(updatedCase.verificationStatus).toBe('Rejected');

    const reg = await prisma.buyerRegistration.findUniqueOrThrow({ where: { registrationCode: code } });
    expect(reg.status).toBe('ACTION_REQUIRED');

    // Attempting to approve verification case while document is rejected must fail
    const approveFail = await http()
      .post(`/api/v1/compliance/customer-verifications/${requestCode}/approve`)
      .set(adminAuthHeader)
      .send({});
    expect(approveFail.status).toBe(400);
    expect(approveFail.body.message).toContain('rejected');
  });

  it('6. buyer can log in after rejection and view the rejected document category and reason', async () => {
    // Buyer can still log in
    const loginRes = await http().post('/api/v1/auth/login').send({
      usernameOrEmail: buyerEmail,
      password: buyerPassword,
    });
    expect(loginRes.status).toBe(200);

    // Buyer fetches their registration and document status
    const myDocs = await http().get('/api/v1/buyer/documents').set(buyerAuthHeader);
    expect(myDocs.status).toBe(200);
    const rejectedDoc = myDocs.body.find((d: any) => d.id === rejectedDocId || d.category === rejectedDocCategory);
    expect(rejectedDoc).toBeTruthy();
    expect(rejectedDoc.status).toBe('REJECTED');
    expect(rejectedDoc.rejectionReason).toContain('illegible');
  });

  it('7. buyer replaces the rejected document from portal: stores real file, creates v2, and marks v1 superseded', async () => {
    const replaceRes = await upload(rejectedDocCategory, code, 'application/pdf', 'clear_gst_cert_v2.pdf', buyerAuthHeader);
    expect(replaceRes.status).toBe(201);
    expect(replaceRes.body.version).toBe(2);
    expect(replaceRes.body.status).toBe('PENDING');

    // Verify database state: v1 superseded, v2 active
    const allGstDocs = await prisma.buyerDocument.findMany({
      where: { registration: { registrationCode: code }, category: rejectedDocCategory },
      orderBy: { version: 'asc' },
    });
    expect(allGstDocs).toHaveLength(2);
    expect(allGstDocs[0].version).toBe(1);
    expect(allGstDocs[0].status).toBe('SUPERSEDED');
    expect(allGstDocs[1].version).toBe(2);
    expect(allGstDocs[1].status).toBe('PENDING');

    // Verification request automatically returned to Under Review
    const vr = await prisma.customerVerificationRequest.findFirstOrThrow({ where: { requestCode } });
    expect(vr.verificationStatus).toBe('Under Review');
  });

  it('8. prevents cross-buyer tampering or document access', async () => {
    // Register second buyer
    const s1Buyer2 = await http().post('/api/v1/buyer/registration/step-1').send({
      companyName: `Buyer Two Pharma ${run}`,
      businessType: 'Distributor',
      gstNumber: 'TESTGST_BUYER2',
      panNumber: 'TESTPAN_BUYER2',
      drugLicenseNumber: `DL-B2-${run}`,
    });
    expect(s1Buyer2.status).toBe(201);
    const buyer2Code = s1Buyer2.body.registrationCode;

    for (const category of CATEGORIES) {
      await upload(category, buyer2Code);
    }

    await http().post('/api/v1/buyer/registration/submit').send({
      registrationCode: buyer2Code,
      companyName: `Buyer Two Pharma ${run}`,
      businessType: 'Distributor',
      gstNumber: 'TESTGST_BUYER2',
      panNumber: 'TESTPAN_BUYER2',
      drugLicenseNumber: `DL-B2-${run}`,
      contactPerson: 'Buyer Two',
      designation: 'Purchasing Lead',
      mobileNumber: '+91 91234 56789',
      email: buyer2Email,
      password: buyer2Password,
      billingAddress: 'Street 2',
      shippingAddress: 'Street 2',
      state: 'Gujarat',
      country: 'India',
      pincode: '380001',
      confirmAccurate: true,
    });

    const b2Login = await http().post('/api/v1/auth/login').send({
      usernameOrEmail: buyer2Email,
      password: buyer2Password,
    });
    expect(b2Login.status).toBe(200);
    buyer2AuthHeader = { Authorization: `Bearer ${b2Login.body.accessToken}` };

    // Buyer 2 tries to access Buyer 1's documents -> 403 Forbidden
    const crossAccess = await http().get('/api/v1/buyer/documents').query({ registrationCode: code }).set(buyer2AuthHeader);
    expect(crossAccess.status).toBe(403);

    // Buyer 2 tries to upload document to Buyer 1's registration -> 403 Forbidden
    const crossUpload = await upload('GST Certificate', code, 'application/pdf', 'hacked.pdf', buyer2AuthHeader);
    expect(crossUpload.status).toBe(403);
  });

  it('9. admin approves the replacement document and final case, unlocking buyer procurement', async () => {
    // Admin approves replacement document
    const activeDocs = await http().get('/api/v1/buyer/documents').query({ registrationCode: code }).set(adminAuthHeader);
    const replacementDoc = activeDocs.body.find((d: any) => d.category === rejectedDocCategory);
    expect(replacementDoc).toBeTruthy();

    const approveDoc = await http()
      .post(`/api/v1/compliance/customer-verifications/${requestCode}/documents/${replacementDoc.id}/review`)
      .set(adminAuthHeader)
      .send({ decision: 'APPROVED' });
    expect(approveDoc.status).toBe(201);
    expect(approveDoc.body.document.reviewDecision).toBe('APPROVED');

    // Admin approves the customer verification case
    const approveCase = await http()
      .post(`/api/v1/compliance/customer-verifications/${requestCode}/approve`)
      .set(adminAuthHeader)
      .send({});
    expect(approveCase.status).toBe(201);
    expect(approveCase.body.verificationStatus).toBe('Active');
    expect(approveCase.body.customerCode).toMatch(/^CUS/);

    // Buyer user account is now ACTIVE in database
    const user = await prisma.user.findUniqueOrThrow({ where: { email: buyerEmail } });
    expect(user.accountStatus).toBe('ACTIVE');

    // Approved buyer logs in and accesses procurement dashboard successfully
    const dashboard = await http().get('/api/v1/buyer/dashboard').set(buyerAuthHeader);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.portal).toBe('BUYER');
    expect(dashboard.body.message).toContain('access granted');
  });
});
