const path = require('path');
process.loadEnvFile(path.resolve(__dirname, '../backend/apps/factorygrid-api/.env'));
const pg = require(path.resolve(__dirname, '../backend/apps/factorygrid-api/node_modules/pg'));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  console.log('Inserting canonical Level 1 & Level 2 hierarchy records...');

  const l1Records = [
    { id: 'CAT_L1_MED_DRUG', pt: 'pt_med', cat: 'Drugs', code: 'DRUG', desc: 'Pharmaceutical Drugs & Formulations', order: 1 },
    { id: 'CAT_L1_MED_INJ', pt: 'pt_med', cat: 'Injectables', code: 'INJ', desc: 'Sterile Parenteral & Injectable Preparations', order: 2 },
    { id: 'CAT_L1_MED_PREP', pt: 'pt_med', cat: 'Medical Preparations', code: 'MED-PREP', desc: 'Medical Preparations & Topical Therapeutics', order: 3 },
    { id: 'CAT_L1_MED_OTC', pt: 'pt_med', cat: 'OTC Medicines', code: 'OTC-MED', desc: 'Over-The-Counter Consumer Health Medicines', order: 4 },
    { id: 'CAT_L1_NUT_SUP', pt: 'pt_nut', cat: 'Dietary Supplements', code: 'NUT-SUP', desc: 'Dietary Supplements & Nutritional Formulations', order: 1 },
    { id: 'CAT_L1_NUT_FNC', pt: 'pt_nut', cat: 'Functional Foods', code: 'NUT-FNC', desc: 'Functional Foods & Fortified Nutrition', order: 2 },
    { id: 'CAT_L1_COS_CLN', pt: 'pt_cos', cat: 'Clinical Skincare', code: 'COS-CLN', desc: 'Clinical Dermatological Skincare Products', order: 1 },
    { id: 'CAT_L1_COS_HAR', pt: 'pt_cos', cat: 'Haircare Formulations', code: 'COS-HAR', desc: 'Clinical & Specialized Haircare Formulations', order: 2 },
    { id: 'CAT_L1_AYR_CLS', pt: 'pt_ayr', cat: 'Classical Ayurvedic', code: 'AYR-CLS', desc: 'Classical Ayurvedic Formulations & Extracts', order: 1 },
    { id: 'CAT_L1_AYR_HRB', pt: 'pt_ayr', cat: 'Herbal Formulations', code: 'AYR-HRB', desc: 'Standardized Botanical & Herbal Preparations', order: 2 },
    { id: 'CAT_L1_VET_LIV', pt: 'pt_vet', cat: 'Livestock Health', code: 'VET-LIV', desc: 'Veterinary Livestock Health & Therapeutics', order: 1 },
    { id: 'CAT_L1_SRG_CON', pt: 'pt_srg', cat: 'Surgical Consumables', code: 'SRG-CON', desc: 'Sterile Surgical Devices & Hospital Consumables', order: 1 },
  ];

  const l2Records = [
    { id: 'CAT_L2_DRUG_TAB', pt: 'pt_med', cat: 'Drugs', sub: 'Tablets', code: 'DRUG-TAB', desc: 'Solid Oral Tablets Formulations', order: 1 },
    { id: 'CAT_L2_DRUG_CAP', pt: 'pt_med', cat: 'Drugs', sub: 'Capsules', code: 'DRUG-CAP', desc: 'Hard & Soft Gelatin Capsule Formulations', order: 2 },
    { id: 'CAT_L2_DRUG_SYR', pt: 'pt_med', cat: 'Drugs', sub: 'Syrups', code: 'DRUG-SYR', desc: 'Oral Liquid Syrups & Pediatric Suspensions', order: 3 },
    { id: 'CAT_L2_DRUG_INJ', pt: 'pt_med', cat: 'Drugs', sub: 'Injections', code: 'DRUG-INJ', desc: 'Systemic Parenteral Injections', order: 4 },
    { id: 'CAT_L2_INJ_VIAL', pt: 'pt_med', cat: 'Injectables', sub: 'Vials', code: 'INJ-VIAL', desc: 'Sterile Glass Injectable Vials', order: 1 },
    { id: 'CAT_L2_INJ_AMP', pt: 'pt_med', cat: 'Injectables', sub: 'Ampoules', code: 'INJ-AMP', desc: 'Single-Use Glass Ampoules', order: 2 },
    { id: 'CAT_L2_PREP_ONT', pt: 'pt_med', cat: 'Medical Preparations', sub: 'Ointments & Creams', code: 'PREP-ONT', desc: 'Topical Creams & Ointments', order: 1 },
    { id: 'CAT_L2_PREP_TOP', pt: 'pt_med', cat: 'Medical Preparations', sub: 'Topical Solutions', code: 'PREP-TOP', desc: 'Antiseptic & Therapeutic Topical Solutions', order: 2 },
    { id: 'CAT_L2_OTC_PAIN', pt: 'pt_med', cat: 'OTC Medicines', sub: 'Pain Relief', code: 'OTC-PAIN', desc: 'OTC Analgesic & Pain Therapeutics', order: 1 },
    { id: 'CAT_L2_OTC_CGH', pt: 'pt_med', cat: 'OTC Medicines', sub: 'Cough & Cold', code: 'OTC-CGH', desc: 'OTC Cough, Cold & Respiratory Relief', order: 2 },
    { id: 'CAT_L2_OTC_DIG', pt: 'pt_med', cat: 'OTC Medicines', sub: 'Digestive Health', code: 'OTC-DIG', desc: 'OTC Digestive Health & Gastrointestinal', order: 3 },
    { id: 'CAT_L2_NUT_TAB', pt: 'pt_nut', cat: 'Dietary Supplements', sub: 'Tablets', code: 'NUT-TAB', desc: 'Nutritional Supplement Tablets', order: 1 },
    { id: 'CAT_L2_NUT_SGC', pt: 'pt_nut', cat: 'Dietary Supplements', sub: 'Softgels', code: 'NUT-SGC', desc: 'Nutritional Softgel Capsules', order: 2 },
    { id: 'CAT_L2_NUT_POW', pt: 'pt_nut', cat: 'Dietary Supplements', sub: 'Powders', code: 'NUT-POW', desc: 'Nutritional & Protein Powders', order: 3 },
    { id: 'CAT_L2_NUT_BAR', pt: 'pt_nut', cat: 'Functional Foods', sub: 'Nutrition Bars', code: 'NUT-BAR', desc: 'Functional Nutrition & Energy Bars', order: 1 },
    { id: 'CAT_L2_COS_SER', pt: 'pt_cos', cat: 'Clinical Skincare', sub: 'Serums', code: 'COS-SER', desc: 'Clinical Skincare Serums', order: 1 },
    { id: 'CAT_L2_COS_SUN', pt: 'pt_cos', cat: 'Clinical Skincare', sub: 'Sunscreen & Lotions', code: 'COS-SUN', desc: 'Clinical Sunscreens & Barrier Lotions', order: 2 },
    { id: 'CAT_L2_COS_SHP', pt: 'pt_cos', cat: 'Haircare Formulations', sub: 'Shampoos', code: 'COS-SHP', desc: 'Clinical & Therapeutic Shampoos', order: 1 },
    { id: 'CAT_L2_AYR_ASV', pt: 'pt_ayr', cat: 'Classical Ayurvedic', sub: 'Asava & Arishta', code: 'AYR-ASV', desc: 'Ayurvedic Asava & Arishta Fermentations', order: 1 },
    { id: 'CAT_L2_AYR_CHR', pt: 'pt_ayr', cat: 'Classical Ayurvedic', sub: 'Churna', code: 'AYR-CHR', desc: 'Ayurvedic Churna Herbal Powders', order: 2 },
    { id: 'CAT_L2_AYR_SYR', pt: 'pt_ayr', cat: 'Herbal Formulations', sub: 'Herbal Syrups', code: 'AYR-SYR', desc: 'Botanical Herbal Syrups', order: 1 },
    { id: 'CAT_L2_VET_BOL', pt: 'pt_vet', cat: 'Livestock Health', sub: 'Bolus', code: 'VET-BOL', desc: 'Veterinary Livestock Bolus Formulations', order: 1 },
    { id: 'CAT_L2_VET_FMS', pt: 'pt_vet', cat: 'Livestock Health', sub: 'Feed Supplements', code: 'VET-FMS', desc: 'Veterinary Feed Supplements & Premixes', order: 2 },
    { id: 'CAT_L2_SRG_GLV', pt: 'pt_srg', cat: 'Surgical Consumables', sub: 'Gloves & Drapes', code: 'SRG-GLV', desc: 'Surgical Gloves & Hospital Drapes', order: 1 },
    { id: 'CAT_L2_SRG_CAN', pt: 'pt_srg', cat: 'Surgical Consumables', sub: 'Cannula & IV Sets', code: 'SRG-CAN', desc: 'Surgical Cannula & Infusion Sets', order: 2 },
  ];

  for (const r of l1Records) {
    await pool.query(`
      INSERT INTO categories (id, category_id, product_type_id, category, sub_category, sub_sub_category, category_code, description, lifecycle_status, display_order)
      VALUES ($1, $1, $2, $3, NULL, NULL, $4, $5, 'ACTIVE', $6)
      ON CONFLICT (id) DO NOTHING
    `, [r.id, r.pt, r.cat, r.code, r.desc, r.order]);

    await pool.query(`
      INSERT INTO catalog_products (id, product_code, name, generic_name, dosage_form, category, pack_size)
      VALUES ($1, $2, $3, $3, 'Category Node', $3, 'Standard')
      ON CONFLICT (id) DO NOTHING
    `, [r.id, r.code, r.cat]);
  }
  console.log(`Seeded ${l1Records.length} Level 1 records.`);

  for (const r of l2Records) {
    await pool.query(`
      INSERT INTO categories (id, category_id, product_type_id, category, sub_category, sub_sub_category, category_code, description, lifecycle_status, display_order)
      VALUES ($1, $1, $2, $3, $4, NULL, $5, $6, 'ACTIVE', $7)
      ON CONFLICT (id) DO NOTHING
    `, [r.id, r.pt, r.cat, r.sub, r.code, r.desc, r.order]);

    await pool.query(`
      INSERT INTO catalog_products (id, product_code, name, generic_name, dosage_form, category, pack_size)
      VALUES ($1, $2, $3, $3, 'Sub-Category Node', $4, 'Standard')
      ON CONFLICT (id) DO NOTHING
    `, [r.id, r.code, `${r.cat} - ${r.sub}`, r.cat]);
  }
  console.log(`Seeded ${l2Records.length} Level 2 records.`);

  const counts = await pool.query(`
    SELECT 
      COUNT(*) filter (where sub_category is null and sub_sub_category is null) as level1,
      COUNT(*) filter (where sub_category is not null and sub_sub_category is null) as level2,
      COUNT(*) filter (where sub_category is not null and sub_sub_category is not null) as level3,
      COUNT(*) as total
    FROM categories
  `);
  console.table(counts.rows);

  await pool.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});

