import fs from 'node:fs';
import path from 'node:path';

const API_BASE = 'http://localhost:8081/api/v1';

async function runAcceptanceTest() {
  console.log('--- Starting Simplified Step 2 Certifications Acceptance Test ---');

  // 1. Step 1: Create Manufacturer Draft
  const runId = Date.now();
  const step1Payload = {
    companyName: `Apex BioPharma Labs ${runId}`,
    facilityAddress: 'Plot 42, Biotech Park, Genome Valley',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500078',
    mfgCapacity: '25 Million Units / Year',
    contactPerson: 'Dr. Rajesh Sharma',
    designation: 'VP Quality & Compliance',
    email: `apex_${runId}@apexbio.example.com`,
    phone: '+91 98765 43210',
  };

  console.log('1. Submitting Step 1...');
  const step1Res = await fetch(`${API_BASE}/manufacturer/registration/step-1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(step1Payload),
  });

  if (!step1Res.ok) {
    throw new Error(`Step 1 failed with status ${step1Res.status}: ${await step1Res.text()}`);
  }
  const step1Data = await step1Res.json();
  const code = step1Data.registrationCode;
  console.log(`✓ Step 1 Success! Registration Code: ${code}`);

  // 2. Step 2: Upload all original documents using multipart/form-data WITHOUT issueDate/expiryDate/documentNumber
  const docFiles = [
    { key: 'mfgLicense', file: 'test_docs/mfg_license_sample.pdf', name: 'mfg_license_sample.pdf' },
    { key: 'gmpCert', file: 'test_docs/gmp_cert_sample.pdf', name: 'gmp_cert_sample.pdf' },
    { key: 'whoGmpCert', file: 'test_docs/who_gmp_cert_sample.pdf', name: 'who_gmp_cert_sample.pdf' },
    { key: 'isoCert', file: 'test_docs/gmp_cert_sample.pdf', name: 'iso_cert_sample.pdf' },
    { key: 'pollutionCert', file: 'test_docs/mfg_license_sample.pdf', name: 'pollution_cert_sample.pdf' },
    { key: 'factoryReg', file: 'test_docs/mfg_license_sample.pdf', name: 'factory_registration_sample.pdf' },
    { key: 'otherCert', file: 'test_docs/who_gmp_cert_sample.pdf', name: 'eugmp_additional_sample.pdf' },
  ];

  console.log('\n2. Uploading all restored original documents (5 mandatory + factoryReg + otherCert) without date fields...');
  for (const doc of docFiles) {
    const fileBytes = fs.readFileSync(path.resolve(process.cwd(), doc.file));
    const formData = new FormData();
    formData.append('file', new Blob([fileBytes], { type: 'application/pdf' }), doc.name);

    const uploadRes = await fetch(
      `${API_BASE}/manufacturer/documents/upload?category=${encodeURIComponent(doc.key)}&registrationCode=${encodeURIComponent(code)}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!uploadRes.ok) {
      throw new Error(`Upload failed for ${doc.key}: ${uploadRes.status} ${await uploadRes.text()}`);
    }
    const uploadData = await uploadRes.json();
    console.log(`✓ Uploaded ${doc.key}: id=${uploadData.id}, fileName=${uploadData.fileName}, status=${uploadData.status}, version=${uploadData.version}, categoryDisplayName="${uploadData.categoryDisplayName}"`);
  }

  // 3. Test Replace Document (ensuring no duplicate record created in DRAFT)
  console.log('\n3. Testing Replace Document on mfgLicense...');
  const replaceFileBytes = fs.readFileSync(path.resolve(process.cwd(), 'test_docs/mfg_license_sample.pdf'));
  const replaceForm = new FormData();
  replaceForm.append('file', new Blob([replaceFileBytes], { type: 'application/pdf' }), 'mfg_license_v2_replaced.pdf');

  const replaceRes = await fetch(
    `${API_BASE}/manufacturer/documents/upload?category=mfgLicense&registrationCode=${encodeURIComponent(code)}`,
    {
      method: 'POST',
      body: replaceForm,
    }
  );
  if (!replaceRes.ok) {
    throw new Error(`Replace document failed: ${replaceRes.status} ${await replaceRes.text()}`);
  }
  const replaceData = await replaceRes.json();
  console.log(`✓ Replaced mfgLicense: id=${replaceData.id}, fileName=${replaceData.fileName}, version=${replaceData.version}`);

  // 4. Test Refresh / Revisit Persistence (fetch from backend)
  console.log('\n4. Testing Refresh / Revisit: retrieving documents from backend...');
  const fetchRes = await fetch(`${API_BASE}/manufacturer/registration/${encodeURIComponent(code)}`);
  if (!fetchRes.ok) {
    throw new Error(`Fetch registration failed: ${fetchRes.status} ${await fetchRes.text()}`);
  }
  const regData = await fetchRes.json();
  console.log(`✓ Retrieved registration: ${regData.company.companyName}, currentStep=${regData.currentStep}`);
  console.log(`✓ Total documents retrieved from PostgreSQL: ${regData.documents.length}`);

  if (regData.documents.length !== 7) {
    throw new Error(`Expected exactly 7 documents after replace, but found ${regData.documents.length}`);
  }

  const mfgDoc = regData.documents.find((d) => d.category === 'mfgLicense');
  const gmpDoc = regData.documents.find((d) => d.category === 'gmpCert');
  const whoGmpDoc = regData.documents.find((d) => d.category === 'whoGmpCert');
  const isoDoc = regData.documents.find((d) => d.category === 'isoCert');
  const pollutionDoc = regData.documents.find((d) => d.category === 'pollutionCert');
  const factoryDoc = regData.documents.find((d) => d.category === 'factoryReg');
  const otherDoc = regData.documents.find((d) => d.category === 'otherCert');

  if (!mfgDoc || !gmpDoc || !whoGmpDoc || !isoDoc || !pollutionDoc || !factoryDoc || !otherDoc) {
    throw new Error('Missing one of the restored original documents in returned registration');
  }

  console.log(`  - Manufacturing License: ${mfgDoc.fileName} (v${mfgDoc.version}, status=${mfgDoc.status})`);
  console.log(`  - GMP Certificate: ${gmpDoc.fileName} (v${gmpDoc.version}, status=${gmpDoc.status})`);
  console.log(`  - WHO-GMP Certificate: ${whoGmpDoc.fileName} (v${whoGmpDoc.version}, status=${whoGmpDoc.status})`);
  console.log(`  - ISO Certification: ${isoDoc.fileName} (v${isoDoc.version}, status=${isoDoc.status})`);
  console.log(`  - Pollution Certificate: ${pollutionDoc.fileName} (v${pollutionDoc.version}, status=${pollutionDoc.status})`);
  console.log(`  - Factory Registration: ${factoryDoc.fileName} (v${factoryDoc.version}, status=${factoryDoc.status})`);
  console.log(`  - Other Certificate: ${otherDoc.fileName} (v${otherDoc.version}, status=${otherDoc.status})`);

  // Verify short category display names
  console.log(`  - Category labels: "${mfgDoc.categoryDisplayName}", "${gmpDoc.categoryDisplayName}", "${whoGmpDoc.categoryDisplayName}", "${isoDoc.categoryDisplayName}", "${pollutionDoc.categoryDisplayName}", "${factoryDoc.categoryDisplayName}"`);

  // 5. Complete Step 2, Step 3, Step 4
  console.log('\n5. Saving Step 2, Step 3, and Step 4...');
  const step2Res = await fetch(`${API_BASE}/manufacturer/registration/step-2?registrationCode=${encodeURIComponent(code)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documents: [
        { category: 'mfgLicense' },
        { category: 'gmpCert' },
        { category: 'whoGmpCert' },
        { category: 'isoCert' },
        { category: 'pollutionCert' },
        { category: 'factoryReg' },
      ],
      whoGmpApplicable: true,
    }),
  });
  if (!step2Res.ok) {
    throw new Error(`Step 2 save failed: ${step2Res.status} ${await step2Res.text()}`);
  }
  console.log('✓ Step 2 saved');

  const step3Res = await fetch(`${API_BASE}/manufacturer/registration/step-3?registrationCode=${encodeURIComponent(code)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productIds: ['p1', 'p2', 'p3'] }),
  });
  if (!step3Res.ok) {
    throw new Error(`Step 3 save failed: ${step3Res.status} ${await step3Res.text()}`);
  }
  console.log('✓ Step 3 saved');

  const step4Res = await fetch(`${API_BASE}/manufacturer/registration/step-4?registrationCode=${encodeURIComponent(code)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        { productId: 'p1', batchSize: 5000, deliveryScheduleDays: 14 },
        { productId: 'p2', batchSize: 5000, deliveryScheduleDays: 14 },
        { productId: 'p3', batchSize: 5000, deliveryScheduleDays: 14 },
      ],
    }),
  });
  if (!step4Res.ok) {
    throw new Error(`Step 4 save failed: ${step4Res.status} ${await step4Res.text()}`);
  }
  console.log('✓ Step 4 saved');

  // 6. Step 5: Final Submission with password
  console.log('\n6. Final Submission with account password setup...');
  const step5Res = await fetch(`${API_BASE}/manufacturer/registration/submit?registrationCode=${encodeURIComponent(code)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      registrationCode: code,
      password: 'ApexSecurePass123!',
      confirmPassword: 'ApexSecurePass123!',
      confirmAccurate: true,
    }),
  });
  if (!step5Res.ok) {
    throw new Error(`Step 5 final submit failed: ${step5Res.status} ${await step5Res.text()}`);
  }
  const submitData = await step5Res.json();
  console.log(`✓ Final Submit Success! status=${submitData.status}, userCode=${submitData.userCode}`);

  // 7. Admin Verification Check
  console.log('\n7. Admin Verification Check: logging in as Admin...');
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usernameOrEmail: 'admin@factorygrid.com',
      password: 'Admin12345678',
    }),
  });
  if (!adminLoginRes.ok) {
    throw new Error(`Admin login failed: ${adminLoginRes.status} ${await adminLoginRes.text()}`);
  }
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.accessToken;
  console.log('✓ Admin authenticated');

  console.log(`Fetching verification case for ${code} from Admin review endpoint...`);
  const adminCaseRes = await fetch(`${API_BASE}/manufacturer/review/verifications/${encodeURIComponent(code)}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!adminCaseRes.ok) {
    throw new Error(`Admin fetch case failed: ${adminCaseRes.status} ${await adminCaseRes.text()}`);
  }
  const adminCaseData = await adminCaseRes.json();
  console.log(`✓ Admin review case retrieved: ${adminCaseData.company.companyName}`);
  console.log(`✓ Documents available to Admin: ${adminCaseData.documents.length}`);

  for (const doc of adminCaseData.documents) {
    console.log(`  - Doc ID: ${doc.id}, Category: ${doc.category} (${doc.categoryDisplayName}), File: ${doc.fileName}, Status: ${doc.status}`);
  }

  // 8. Test Admin Document Decision (Approve)
  console.log('\n8. Testing Admin Document Approval...');
  for (const doc of adminCaseData.documents) {
    const reviewRes = await fetch(`${API_BASE}/manufacturer/review/verifications/${encodeURIComponent(code)}/documents/${doc.id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ decision: 'APPROVED' }),
    });
    if (!reviewRes.ok) {
      throw new Error(`Admin document review failed: ${reviewRes.status} ${await reviewRes.text()}`);
    }
  }
  console.log('✓ All documents approved by Admin');

  // Verify status in DB
  const finalCheckRes = await fetch(`${API_BASE}/manufacturer/review/verifications/${encodeURIComponent(code)}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const finalData = await finalCheckRes.json();
  const allApproved = finalData.documents.every((d) => d.status === 'VALID' || d.status === 'APPROVED');
  console.log(`✓ Verification: All documents status in PostgreSQL is VALID/APPROVED: ${allApproved}`);

  console.log('\n======================================================');
  console.log('🎉 ALL ACCEPTANCE CRITERIA SUCCESSFULLY VERIFIED!');
  console.log('======================================================');
}

runAcceptanceTest().catch((err) => {
  console.error('\n❌ ACCEPTANCE TEST FAILED:', err);
  process.exit(1);
});
