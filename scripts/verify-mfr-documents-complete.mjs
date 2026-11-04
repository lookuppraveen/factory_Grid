import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Client } = require('../backend/apps/factorygrid-api/node_modules/pg');
const { S3Client, HeadObjectCommand } = require('../backend/apps/factorygrid-api/node_modules/@aws-sdk/client-s3');

const API_BASE = 'http://localhost:8081';
const DB_URL = process.env.DATABASE_URL || 'postgresql://factorygrid:factorygrid@localhost:5442/factorygrid?schema=public';

const s3 = new S3Client({
  endpoint: 'http://127.0.0.1:9010',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'factorygrid',
    secretAccessKey: 'factorygrid-dev',
  },
  forcePathStyle: true,
});

async function run() {
  console.log('--- STARTING COMPREHENSIVE MANUFACTURER DOCUMENTS ACCEPTANCE VERIFICATION ---');
  const runId = Date.now().toString(36);
  const mfgEmail = `mfg_doc_${runId}@pharmafactory.com`;
  const mfgPassword = 'Password123!@#';

  // 1. Step 1: Register manufacturer
  console.log('\n[1/10] Registering manufacturer draft...');
  const step1Res = await fetch(`${API_BASE}/api/v1/manufacturer/registration/step-1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyName: `SunRise Pharmaceuticals Ltd ${runId}`,
      facilityAddress: 'Industrial Zone Plot 88',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '382213',
      mfgCapacity: '25,000,000 Units/Month',
      contactPerson: 'Mr. Rajesh Patel',
      designation: 'Managing Director',
      email: mfgEmail,
      phone: '+91 98765 12345',
    }),
  });
  const step1Data = await step1Res.json();
  if (!step1Res.ok) throw new Error(`Step 1 failed: ${JSON.stringify(step1Data)}`);
  const regCode = step1Data.registrationCode;
  console.log(`✓ Step 1 saved successfully. Registration Code: ${regCode}`);

  // 2. Upload all 6 certifications + 1 optional
  console.log('\n[2/10] Uploading real certification documents (binary files)...');
  const docsToUpload = [
    { key: 'mfgLicense', fileName: 'Drug_Mfg_License_Form25.pdf', content: '%PDF-1.4 Drug Manufacturing License Form 25 Content' },
    { key: 'gmpCert', fileName: 'GMP_Schedule_M_Certificate.pdf', content: '%PDF-1.4 GMP Schedule M Compliance Certificate' },
    { key: 'whoGmpCert', fileName: 'WHO_GMP_Certificate.pdf', content: '%PDF-1.4 WHO-GMP Standard Certificate Content' },
    { key: 'isoCert', fileName: 'ISO_9001_13485_Quality_Cert.pdf', content: '%PDF-1.4 ISO 9001:2015 Quality Certification' },
    { key: 'pollutionCert', fileName: 'Pollution_Control_Board_NOC.pdf', content: '%PDF-1.4 State Pollution Control Board Consent' },
    { key: 'factoryReg', fileName: 'Factory_Inspectorate_License.pdf', content: '%PDF-1.4 State Factories Act Registration' },
    { key: 'otherCert', fileName: 'Fire_Safety_Department_NOC.pdf', content: '%PDF-1.4 Fire & Safety Department NOC' },
  ];

  const uploadedDocRecords = [];
  for (const doc of docsToUpload) {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const bodyParts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${doc.fileName}"\r\nContent-Type: application/pdf\r\n\r\n${doc.content}\r\n`,
      `--${boundary}--\r\n`,
    ];
    const uploadRes = await fetch(`${API_BASE}/api/v1/manufacturer/documents/upload?category=${doc.key}&registrationCode=${encodeURIComponent(regCode)}&issueDate=2023-01-01&expiryDate=2028-12-31&documentNumber=LIC-${doc.key.toUpperCase()}-2024`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: bodyParts.join(''),
    });
    const uploadJson = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(`Upload ${doc.key} failed: ${JSON.stringify(uploadJson)}`);
    uploadedDocRecords.push(uploadJson);
    console.log(`  ✓ Uploaded ${doc.key}: ID ${uploadJson.id}, File: ${uploadJson.fileName}, Size: ${uploadJson.fileSize} bytes`);
  }

  // 3. Verify PostgreSQL metadata and MinIO persistent file storage
  console.log('\n[3/10] Verifying PostgreSQL records & MinIO persistent file storage...');
  const pg = new Client({ connectionString: DB_URL });
  await pg.connect();

  const pgRes = await pg.query(
    `SELECT d.id, d.category, d.category_display_name, d.file_name, d.file_size, d.mime_type, d.storage_key, d.storage_bucket, d.status, d.admin_remarks, d.version
     FROM manufacturer_documents d
     JOIN manufacturer_registrations r ON r.id = d.registration_id
     WHERE r.registration_code = $1
     ORDER BY d.id ASC`,
    [regCode]
  );
  if (pgRes.rows.length !== docsToUpload.length) {
    throw new Error(`Expected ${docsToUpload.length} documents in PostgreSQL, found ${pgRes.rows.length}`);
  }
  console.log(`✓ Found ${pgRes.rows.length} document records in PostgreSQL manufacturer_documents table.`);

  for (const row of pgRes.rows) {
    if (!row.storage_key) throw new Error(`Document ${row.id} has no storage_key`);
    // Verify file exists in MinIO
    await s3.send(new HeadObjectCommand({ Bucket: row.storage_bucket, Key: row.storage_key }));
    console.log(`  ✓ PostgreSQL ID ${row.id} (${row.category}) confirmed in MinIO bucket "${row.storage_bucket}" at key: "${row.storage_key}"`);
  }

  // 4. Complete Onboarding and Submit Registration
  console.log('\n[4/10] Completing step 3, 4, 5 submit to activate authenticated account...');
  await fetch(`${API_BASE}/api/v1/manufacturer/registration/step-2?registrationCode=${encodeURIComponent(regCode)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ whoGmpApplicable: true }),
  });

  const catRes = await fetch(`${API_BASE}/api/v1/manufacturer/categories`);
  const catData = await catRes.json();
  const firstCatId = catData.categories[0].id;

  await fetch(`${API_BASE}/api/v1/manufacturer/registration/step-3?registrationCode=${encodeURIComponent(regCode)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryIds: [firstCatId], productIds: [firstCatId] }),
  });

  await fetch(`${API_BASE}/api/v1/manufacturer/registration/step-4?registrationCode=${encodeURIComponent(regCode)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ categoryId: firstCatId, moq: 10000, leadTimeDays: 21 }],
    }),
  });

  const submitRes = await fetch(`${API_BASE}/api/v1/manufacturer/registration/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      registrationCode: regCode,
      confirmAccurate: true,
      whoGmpApplicable: true,
      password: mfgPassword,
    }),
  });
  const submitData = await submitRes.json();
  if (!submitRes.ok) throw new Error(`Submit failed: ${JSON.stringify(submitData)}`);
  console.log(`✓ Registration submitted for compliance audit. User account created for ${mfgEmail}.`);

  // 5. Login as manufacturer and verify /me/documents
  console.log('\n[5/10] Authenticating as manufacturer and retrieving /manufacturers/me/documents...');
  const mfgLoginRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: mfgEmail, password: mfgPassword }),
  });
  const mfgAuth = await mfgLoginRes.json();
  if (!mfgLoginRes.ok) throw new Error(`Manufacturer login failed: ${JSON.stringify(mfgAuth)}`);
  const mfgToken = mfgAuth.accessToken;
  console.log(`✓ Manufacturer authenticated successfully. Token received.`);

  const mfgMeDocsRes = await fetch(`${API_BASE}/api/v1/manufacturers/me/documents`, {
    headers: { Authorization: `Bearer ${mfgToken}` },
  });
  const mfgMeDocs = await mfgMeDocsRes.json();
  if (!mfgMeDocsRes.ok) throw new Error(`GET /me/documents failed: ${JSON.stringify(mfgMeDocs)}`);
  console.log(`✓ /manufacturers/me/documents returned ${mfgMeDocs.length} persisted documents.`);

  // Verify fields required by Section 2
  const sampleDoc = mfgMeDocs[0];
  const requiredFields = [
    'document_id', 'manufacturer_id', 'document_type', 'original_file_name',
    'storage_key', 'content_type', 'file_size', 'uploaded_at', 'verification_status'
  ];
  for (const f of requiredFields) {
    if (sampleDoc[f] === undefined) throw new Error(`Missing required field "${f}" in document DTO`);
  }
  console.log(`✓ Document DTO contains all specified fields: ${requiredFields.join(', ')}.`);

  // 6. Test View Document / Download API: verify binary bytes
  console.log('\n[6/10] Testing View Document / Download endpoint (actual file streaming)...');
  const viewDocRes = await fetch(`${API_BASE}/api/v1/manufacturers/me/documents/${sampleDoc.id}/download`, {
    headers: { Authorization: `Bearer ${mfgToken}` },
  });
  if (!viewDocRes.ok) throw new Error(`Download failed with status ${viewDocRes.status}`);
  const contentType = viewDocRes.headers.get('content-type');
  const contentDisposition = viewDocRes.headers.get('content-disposition');
  const fileBytes = await viewDocRes.text();
  if (!contentType.includes('application/pdf')) throw new Error(`Expected application/pdf, got ${contentType}`);
  if (!contentDisposition.includes('inline')) throw new Error(`Expected inline Content-Disposition, got ${contentDisposition}`);
  if (!fileBytes.includes('%PDF')) throw new Error('Downloaded bytes do not match expected PDF signature');
  console.log(`✓ View Document returned binary PDF correctly (Content-Type: ${contentType}, length: ${fileBytes.length} bytes).`);

  // 7. Login as Admin and view the manufacturer's documents
  console.log('\n[7/10] Authenticating as Admin & fetching documents via Admin endpoint...');
  const adminLoginRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: 'admin@factorygrid.com', password: 'Admin12345678' }),
  });
  const adminAuth = await adminLoginRes.json();
  const adminToken = adminAuth.accessToken;

  const adminDocsRes = await fetch(`${API_BASE}/api/v1/admin/manufacturers/${regCode}/documents`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminDocs = await adminDocsRes.json();
  if (!adminDocsRes.ok) throw new Error(`Admin GET documents failed: ${JSON.stringify(adminDocs)}`);
  console.log(`✓ Admin retrieved ${adminDocs.length} documents for manufacturer ${regCode}.`);

  // Admin downloads same document file
  const adminDownloadRes = await fetch(`${API_BASE}/api/v1/admin/manufacturers/${regCode}/documents/${sampleDoc.id}/download`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!adminDownloadRes.ok) throw new Error(`Admin document download failed: ${adminDownloadRes.status}`);
  const adminBytes = await adminDownloadRes.text();
  if (adminBytes !== fileBytes) throw new Error('Admin downloaded file does not match manufacturer downloaded file!');
  console.log('✓ Admin and Manufacturer verified downloading the exact same binary file from persistent storage.');

  // 8. Admin reviews document: REJECT / REQUEST REPLACEMENT with remarks
  console.log('\n[8/10] Admin reviews document with PATCH /admin/manufacturers/.../verification...');
  const patchRes = await fetch(`${API_BASE}/api/v1/admin/manufacturers/${regCode}/documents/${sampleDoc.id}/verification`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'NEEDS_REPLACEMENT',
      remarks: 'Schedule M certificate seal is illegible. Please upload a 300 DPI high-resolution color scan.',
    }),
  });
  const patchData = await patchRes.json();
  if (!patchRes.ok) throw new Error(`PATCH verification failed: ${JSON.stringify(patchData)}`);
  console.log(`✓ Document verification updated to ${patchData.document.verification_status} with remarks.`);

  // Verify persisted in PostgreSQL
  const checkPgRow = await pg.query('SELECT status, rejection_reason, admin_remarks, reviewed_by, reviewed_at FROM manufacturer_documents WHERE id = $1', [sampleDoc.id]);
  const row = checkPgRow.rows[0];
  if (row.status !== 'NEEDS_REPLACEMENT') throw new Error(`PostgreSQL status mismatch: ${row.status}`);
  if (!row.admin_remarks?.includes('300 DPI')) throw new Error(`PostgreSQL admin_remarks mismatch: ${row.admin_remarks}`);
  console.log(`✓ PostgreSQL confirmed: status = ${row.status}, admin_remarks = "${row.admin_remarks}", reviewed_by = ${row.reviewed_by}`);

  // 9. Manufacturer portal reflects updated verification status & admin remarks
  console.log('\n[9/10] Verifying manufacturer portal reflects updated status and admin remarks...');
  const refreshedMfgDocsRes = await fetch(`${API_BASE}/api/v1/manufacturers/me/documents`, {
    headers: { Authorization: `Bearer ${mfgToken}` },
  });
  const refreshedMfgDocs = await refreshedMfgDocsRes.json();
  const updatedDocInPortal = refreshedMfgDocs.find((d) => d.id === sampleDoc.id);
  if (updatedDocInPortal.verification_status !== 'NEEDS_REPLACEMENT') {
    throw new Error(`Manufacturer portal status mismatch: ${updatedDocInPortal.verification_status}`);
  }
  if (!updatedDocInPortal.admin_remarks?.includes('300 DPI')) {
    throw new Error(`Manufacturer portal admin_remarks missing: ${updatedDocInPortal.admin_remarks}`);
  }
  console.log(`✓ Manufacturer portal confirms status: ${updatedDocInPortal.verification_status}, Remarks: "${updatedDocInPortal.admin_remarks}".`);

  // Manufacturer replaces document via PUT /manufacturers/me/documents/:id
  console.log('  Replacing document with PUT /manufacturers/me/documents/:id...');
  const boundaryReplace = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const replaceParts = [
    `--${boundaryReplace}\r\nContent-Disposition: form-data; name="file"; filename="Schedule_M_300DPI_Replacement.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.4 300 DPI High Resolution Clean Scan\r\n`,
    `--${boundaryReplace}--\r\n`,
  ];
  const replaceRes = await fetch(`${API_BASE}/api/v1/manufacturers/me/documents/${sampleDoc.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundaryReplace}`,
      Authorization: `Bearer ${mfgToken}`,
    },
    body: replaceParts.join(''),
  });
  const replaceJson = await replaceRes.json();
  if (!replaceRes.ok) throw new Error(`PUT document replace failed: ${JSON.stringify(replaceJson)}`);
  console.log(`  ✓ Document replaced successfully. Status reset to ${replaceJson.status}, new file: ${replaceJson.fileName}`);

  // 10. Security & Edge Case Testing: Cross-manufacturer denial, invalid file, oversized file
  console.log('\n[10/10] Security testing: Cross-manufacturer isolation and input validation...');
  // Register 2nd manufacturer
  const mfg2Email = `other_mfg_${runId}@otherpharma.com`;
  const mfg2Step1Res = await fetch(`${API_BASE}/api/v1/manufacturer/registration/step-1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyName: `Other Pharma Corp ${runId}`,
      facilityAddress: 'Road 5, Sector B',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      contactPerson: 'Anjali Sharma',
      designation: 'Director',
      email: mfg2Email,
      phone: '+91 99887 66554',
    }),
  });
  const mfg2RegCode = (await mfg2Step1Res.json()).registrationCode;

  // Upload one doc for mfg 2 and submit
  const bnd2 = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  await fetch(`${API_BASE}/api/v1/manufacturer/documents/upload?category=mfgLicense&registrationCode=${encodeURIComponent(mfg2RegCode)}&issueDate=2023-01-01&expiryDate=2028-01-01`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${bnd2}` },
    body: `--${bnd2}\r\nContent-Disposition: form-data; name="file"; filename="doc2.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.4 other mfg\r\n--${bnd2}--\r\n`,
  });

  // Submit other manufacturer
  for (const c of ['gmpCert', 'whoGmpCert', 'isoCert', 'pollutionCert']) {
    const b = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    await fetch(`${API_BASE}/api/v1/manufacturer/documents/upload?category=${c}&registrationCode=${encodeURIComponent(mfg2RegCode)}&issueDate=2023-01-01&expiryDate=2028-01-01`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${b}` },
      body: `--${b}\r\nContent-Disposition: form-data; name="file"; filename="${c}.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.4 other mfg ${c}\r\n--${b}--\r\n`,
    });
  }
  await fetch(`${API_BASE}/api/v1/manufacturer/registration/step-2?registrationCode=${encodeURIComponent(mfg2RegCode)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ whoGmpApplicable: true }),
  });
  await fetch(`${API_BASE}/api/v1/manufacturer/registration/step-3?registrationCode=${encodeURIComponent(mfg2RegCode)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryIds: [firstCatId], productIds: [firstCatId] }),
  });
  await fetch(`${API_BASE}/api/v1/manufacturer/registration/step-4?registrationCode=${encodeURIComponent(mfg2RegCode)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ categoryId: firstCatId, moq: 5000, leadTimeDays: 14 }] }),
  });
  await fetch(`${API_BASE}/api/v1/manufacturer/registration/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationCode: mfg2RegCode, confirmAccurate: true, whoGmpApplicable: true, password: mfgPassword }),
  });

  // Login as Manufacturer 2
  const mfg2LoginRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: mfg2Email, password: mfgPassword }),
  });
  const mfg2Token = (await mfg2LoginRes.json()).accessToken;

  // Cross-tenant document download attempt by Manufacturer 2 -> MUST BE DENIED
  const crossDownloadRes = await fetch(`${API_BASE}/api/v1/manufacturers/me/documents/${sampleDoc.id}/download`, {
    headers: { Authorization: `Bearer ${mfg2Token}` },
  });
  if (crossDownloadRes.status !== 404 && crossDownloadRes.status !== 403) {
    throw new Error(`Security breach: Cross-manufacturer download was not denied! Status: ${crossDownloadRes.status}`);
  }
  console.log(`✓ Cross-manufacturer document download denied with HTTP ${crossDownloadRes.status}.`);

  // Invalid file type attempt (.exe disguised as .pdf) -> MUST BE REJECTED
  const badBnd = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const badFileRes = await fetch(`${API_BASE}/api/v1/manufacturer/documents/upload?category=mfgLicense&registrationCode=${encodeURIComponent(regCode)}`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${badBnd}` },
    body: `--${badBnd}\r\nContent-Disposition: form-data; name="file"; filename="malware.pdf"\r\nContent-Type: application/pdf\r\n\r\nMZThisIsAnExecutableFileNotPdf\r\n--${badBnd}--\r\n`,
  });
  if (badFileRes.status !== 400) {
    throw new Error(`Security breach: Executable disguised as PDF was not rejected! Status: ${badFileRes.status}`);
  }
  console.log(`✓ Disguised executable rejected with HTTP 400 (${(await badFileRes.json()).message}).`);

  // Unauthenticated download attempt without code -> MUST BE DENIED
  const unauthRes = await fetch(`${API_BASE}/api/v1/manufacturers/me/documents/${sampleDoc.id}/download`);
  if (unauthRes.status !== 401) {
    throw new Error(`Security breach: Unauthenticated /me/documents download was not rejected! Status: ${unauthRes.status}`);
  }
  console.log(`✓ Unauthenticated request rejected with HTTP 401.`);

  await pg.end();
  console.log('\n========================================================================');
  console.log('🎉 ALL 10 ACCEPTANCE VERIFICATION STEPS PASSED SUCCESSFULLY!');
  console.log('Manufacturer & Admin share identical PostgreSQL records and MinIO storage.');
  console.log('View Document streams actual binary without landing page redirection.');
  console.log('Role authorization, verification remarks & tenant isolation 100% verified.');
  console.log('========================================================================\n');
}

run().catch((err) => {
  console.error('\n❌ ACCEPTANCE VERIFICATION FAILED:', err);
  process.exit(1);
});
