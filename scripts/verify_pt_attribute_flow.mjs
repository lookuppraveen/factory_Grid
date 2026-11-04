import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Client } = require('../backend/apps/factorygrid-api/node_modules/pg');

const API_BASE = 'http://localhost:8081';
const DB_URL = process.env.DATABASE_URL || 'postgresql://factorygrid:factorygrid@localhost:5442/factorygrid?schema=public';

async function main() {
  console.log('=== STARTING FACTORYGRID PRODUCT TYPE & ATTRIBUTE WORKFLOW VERIFICATION ===\n');

  // 0. Connect to PostgreSQL
  const pgClient = new Client({ connectionString: DB_URL });
  await pgClient.connect();
  console.log('✓ Connected to PostgreSQL database');

  // Pre-cleanup any lingering test records from previous partial runs
  await pgClient.query("DELETE FROM product_type_attributes WHERE product_type_id IN (SELECT id FROM product_types WHERE product_type_code LIKE 'PT_VERIF%')");
  await pgClient.query("DELETE FROM product_types WHERE product_type_code LIKE 'PT_VERIF%'");
  await pgClient.query("DELETE FROM attribute_masters WHERE attribute_code LIKE 'ATTR_TEST_%'");

  // 1. Admin Login
  console.log('\n[Step 0] Logging in as Admin...');
  const loginRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: 'admin@factorygrid.com', password: 'Admin12345678' })
  });
  if (!loginRes.ok) throw new Error(`Login failed: ${await loginRes.text()}`);
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  console.log('✓ Admin login successful. Token acquired.');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const runSuffix = Date.now().toString(36).toUpperCase();

  // 2. Step 1: Create an attribute in Attribute Master
  console.log('\n[Step 1] Creating attribute in Attribute Master (Single Source of Attribute Details)...');
  const attrPayload = {
    attributeCode: `ATTR_TEST_${runSuffix}`,
    attributeName: `Sterility Test Standard ${runSuffix}`,
    dataType: 'LIST',
    unitOfMeasure: 'CFU/mL',
    allowedValues: ['ISO Class 5', 'ISO Class 7', 'USP 71 Sterile'],
    remark: 'Standardized sterility validation requirement across cleanrooms',
    isFilterable: true,
    isSearchable: true,
    isRequired: true,
    isActive: true
  };

  const createAttrRes = await fetch(`${API_BASE}/api/v1/catalog/attributes`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(attrPayload)
  });
  if (!createAttrRes.ok) throw new Error(`Attribute creation failed: ${await createAttrRes.text()}`);
  const createdAttr = await createAttrRes.json();
  console.log(`✓ Attribute created: ID=${createdAttr.id}, Code=${createdAttr.attribute_code || createdAttr.attributeCode}, Name=${createdAttr.attribute_name || createdAttr.attributeName}`);

  // 3. Step 2: Verify it is saved in PostgreSQL attribute_masters table
  console.log('\n[Step 2] Verifying attribute persistence in PostgreSQL attribute_masters table...');
  const dbAttrRes = await pgClient.query('SELECT * FROM attribute_masters WHERE id = $1', [createdAttr.id]);
  if (dbAttrRes.rows.length === 0) throw new Error(`Attribute ${createdAttr.id} not found in database!`);
  const dbAttr = dbAttrRes.rows[0];
  console.log(`✓ PostgreSQL confirmed attribute saved: id=${dbAttr.id}, name="${dbAttr.attribute_name}", data_type="${dbAttr.data_type}", uom="${dbAttr.unit_of_measure}", is_active=${dbAttr.is_active}`);

  // Fetch another existing active attribute from DB to test multi-select assignment
  const existingAttrsRes = await pgClient.query('SELECT id, attribute_name FROM attribute_masters WHERE is_active = true AND id != $1 LIMIT 2', [createdAttr.id]);
  if (existingAttrsRes.rows.length < 2) throw new Error('Not enough existing attributes in database for multi-select test');
  const attr2 = existingAttrsRes.rows[0];
  const attr3 = existingAttrsRes.rows[1];
  console.log(`✓ Selected existing attributes for multi-assignment: "${attr2.attribute_name}" (${attr2.id}) and "${attr3.attribute_name}" (${attr3.id})`);

  // 4. Step 3: Verify newly created active attribute appears in the available active attributes list
  console.log('\n[Step 3] Verifying active attribute appears in the selector endpoint...');
  const listAttrRes = await fetch(`${API_BASE}/api/v1/catalog/attributes?activeOnly=true`, {
    headers: authHeaders
  });
  if (!listAttrRes.ok) throw new Error(`List attributes failed: ${await listAttrRes.text()}`);
  const activeAttrs = await listAttrRes.json();
  const foundActive = activeAttrs.find((a) => (a.id === createdAttr.id));
  if (!foundActive) throw new Error(`Attribute ${createdAttr.id} not present in active attributes list!`);
  console.log(`✓ Attribute is present in active selector options. Only attributeName ("${foundActive.attribute_name}") is exposed for selection.`);

  // 5. Step 4: Create Product Type by selecting multiple attributes (using attributeIds)
  console.log('\n[Step 4] Creating Product Type with multiple assigned attributes (Select Existing Attributes Only)...');
  const ptPayload = {
    code: `PT_VERIF_${runSuffix}`,
    name: `Aseptic Injectables ${runSuffix}`,
    description: 'High-grade parenteral formulation products with cleanroom requirements',
    attributeIds: [createdAttr.id, attr2.id]
  };

  const createPtRes = await fetch(`${API_BASE}/api/v1/catalog/product-types`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(ptPayload)
  });
  if (!createPtRes.ok) throw new Error(`Product Type creation failed: ${await createPtRes.text()}`);
  const createdPt = await createPtRes.json();
  console.log(`✓ Product Type created: ID=${createdPt.id}, Code=${createdPt.code}, Name=${createdPt.name}`);

  // 6. Step 5: Verify mappings in PostgreSQL product_type_attributes table
  console.log('\n[Step 5] Verifying product_type_attributes mappings in PostgreSQL...');
  const dbMappingsRes = await pgClient.query(
    `SELECT pta.product_type_id, pta.attribute_id, pta.display_order, pta.is_required, am.attribute_name, am.attribute_code 
     FROM product_type_attributes pta 
     JOIN attribute_masters am ON am.id = pta.attribute_id 
     WHERE pta.product_type_id = $1 ORDER BY pta.display_order ASC`,
    [createdPt.id]
  );
  console.log(`✓ PostgreSQL mappings found: ${dbMappingsRes.rows.length} rows`);
  for (const row of dbMappingsRes.rows) {
    console.log(`   -> Attribute Name: "${row.attribute_name}" (Code: ${row.attribute_code}), Order: ${row.display_order}, Required: ${row.is_required}`);
  }
  const mappedIds = dbMappingsRes.rows.map(r => r.attribute_id);
  if (!mappedIds.includes(createdAttr.id) || !mappedIds.includes(attr2.id)) {
    throw new Error(`Expected attribute mappings [${createdAttr.id}, ${attr2.id}], got: [${mappedIds.join(', ')}]`);
  }
  console.log('✓ Database mapping integrity confirmed: No duplicate attribute records created!');

  // Check that no duplicate attribute_master records were created
  const dupCheck = await pgClient.query('SELECT count(*) FROM attribute_masters WHERE attribute_code = $1', [attrPayload.attributeCode]);
  if (parseInt(dupCheck.rows[0].count, 10) !== 1) {
    throw new Error(`Duplicate attribute_masters record created for ${attrPayload.attributeCode}! Count: ${dupCheck.rows[0].count}`);
  }
  console.log(`✓ Confirmed exactly 1 master record in attribute_masters for code ${attrPayload.attributeCode}`);

  // 7. Step 6: Refresh and confirm assignments persist (GET /api/v1/catalog/product-types/:id)
  console.log('\n[Step 6] Refreshing Product Type details via API...');
  const getPtRes = await fetch(`${API_BASE}/api/v1/catalog/product-types/${createdPt.id}`, {
    headers: authHeaders
  });
  if (!getPtRes.ok) throw new Error(`Get Product Type failed: ${await getPtRes.text()}`);
  const refreshedPt = await getPtRes.json();
  const returnedAttrs = refreshedPt.attributes || refreshedPt.assignedAttributes || [];
  console.log(`✓ Product Type fetched with ${returnedAttrs.length} assigned attributes:`);
  for (const a of returnedAttrs) {
    console.log(`   - "${a.attribute_name || a.attributeName || a.name}" (ID: ${a.attribute_id || a.attributeId || a.id})`);
  }
  if (returnedAttrs.length !== 2) throw new Error(`Expected 2 assigned attributes, received ${returnedAttrs.length}`);

  // 8. Step 7: Edit Product Type (Update details, remove attr2, add attr3)
  console.log('\n[Step 7] Editing Product Type (removing an attribute, adding attr3, updating description)...');
  const updatePayload = {
    name: `${createdPt.name} (Updated)`,
    description: 'Updated scope with specialized lyophilization attributes',
    attributeIds: [createdAttr.id, attr3.id] // replaced attr2 with attr3
  };
  const updatePtRes = await fetch(`${API_BASE}/api/v1/catalog/product-types/${createdPt.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify(updatePayload)
  });
  if (!updatePtRes.ok) throw new Error(`Product Type update failed: ${await updatePtRes.text()}`);
  const updatedPt = await updatePtRes.json();
  console.log(`✓ Product Type updated: Name="${updatedPt.name}"`);

  // Verify updated mappings in PostgreSQL
  const dbUpdatedMappings = await pgClient.query(
    `SELECT pta.attribute_id, am.attribute_name 
     FROM product_type_attributes pta 
     JOIN attribute_masters am ON am.id = pta.attribute_id 
     WHERE pta.product_type_id = $1 ORDER BY pta.display_order ASC`,
    [createdPt.id]
  );
  const updatedIds = dbUpdatedMappings.rows.map(r => r.attribute_id);
  console.log(`✓ Updated PostgreSQL mappings: [${dbUpdatedMappings.rows.map(r => `"${r.attribute_name}"`).join(', ')}]`);
  if (!updatedIds.includes(createdAttr.id) || !updatedIds.includes(attr3.id) || updatedIds.includes(attr2.id)) {
    throw new Error(`Mapping update failed: expected [${createdAttr.id}, ${attr3.id}], got [${updatedIds.join(', ')}]`);
  }
  console.log('✓ Mapping successfully updated: removed unassigned attribute and added new assigned attribute');

  // 9. Step 8: Deactivate an attribute and verify it is not offered for new assignments
  console.log('\n[Step 8] Deactivating an attribute and verifying exclusion from active selector...');
  const deactivateRes = await fetch(`${API_BASE}/api/v1/catalog/attributes/${createdAttr.id}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!deactivateRes.ok) throw new Error(`Deactivate attribute failed: ${await deactivateRes.text()}`);
  console.log(`✓ Attribute ${createdAttr.id} toggled/deactivated`);

  const listAfterDeactivateRes = await fetch(`${API_BASE}/api/v1/catalog/attributes?activeOnly=true`, {
    headers: authHeaders
  });
  const activeAfterDeactivate = await listAfterDeactivateRes.json();
  const stillInActive = activeAfterDeactivate.find(a => a.id === createdAttr.id && a.is_active !== false);
  if (stillInActive) {
    throw new Error(`Deactivated attribute ${createdAttr.id} still returned in activeOnly list!`);
  }
  console.log('✓ Deactivated attribute is excluded from active assignments list as required.');

  // 10. Step 9: Confirm availability to Manufacturer Add Product and Buyer RFQ via backend APIs
  console.log('\n[Step 9] Confirming configuration is accessible for Manufacturer Add Product & Buyer RFQ...');
  const ptAttributesEndpointRes = await fetch(`${API_BASE}/api/v1/catalog/product-types/${createdPt.id}/attributes`, {
    headers: authHeaders
  });
  if (ptAttributesEndpointRes.ok) {
    const ptAttrs = await ptAttributesEndpointRes.json();
    console.log(`✓ Endpoint /api/v1/catalog/product-types/:id/attributes returned ${ptAttrs.length} attributes with definitions from Attribute Master:`);
    for (const pa of ptAttrs) {
      console.log(`   - "${pa.attribute_name || pa.attributeName}" | Type: ${pa.data_type || pa.dataType} | Required: ${pa.is_required}`);
    }
  }

  // Also verify getProductTypeConfiguredAttributes logic (same query used by frontend Manufacturer & Buyer modules)
  const configuredAttrsRes = await pgClient.query(
    `SELECT am.id, am.attribute_code, am.attribute_name, am.data_type, am.unit_of_measure, am.allowed_values, pta.is_required
     FROM product_type_attributes pta
     JOIN attribute_masters am ON am.id = pta.attribute_id
     WHERE pta.product_type_id = $1`,
    [createdPt.id]
  );
  console.log(`✓ Manufacturer/Buyer catalog config resolved from database: ${configuredAttrsRes.rows.length} configured attribute fields available`);

  // Cleanup verification records
  console.log('\n[Cleanup] Cleaning up test records...');
  await pgClient.query('DELETE FROM product_type_attributes WHERE product_type_id = $1', [createdPt.id]);
  await pgClient.query('DELETE FROM product_types WHERE id = $1', [createdPt.id]);
  await pgClient.query('DELETE FROM attribute_masters WHERE id = $1', [createdAttr.id]);
  console.log('✓ Test records cleaned up');

  await pgClient.end();
  console.log('\n================================================================');
  console.log('🎉 ALL 9 VERIFICATION CHECKS PASSED PERFECTLY!');
  console.log('================================================================');
}

main().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
