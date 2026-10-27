-- 1. Create single Category table matching client architectural model
CREATE TABLE IF NOT EXISTS "categories" (
    "id" VARCHAR(50) NOT NULL,
    "category_id" VARCHAR(50) NOT NULL,
    "product_type_id" VARCHAR(50) NOT NULL DEFAULT 'pt_med',
    "category" VARCHAR(150) NOT NULL,
    "sub_category" VARCHAR(150),
    "sub_sub_category" VARCHAR(150),
    "category_code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "lifecycle_status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "display_order" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "categories_category_id_key" ON "categories"("category_id");
CREATE UNIQUE INDEX IF NOT EXISTS "categories_category_code_key" ON "categories"("category_code");
CREATE INDEX IF NOT EXISTS "idx_categories_category" ON "categories"("category");
CREATE INDEX IF NOT EXISTS "idx_categories_sub_category" ON "categories"("sub_category");
CREATE INDEX IF NOT EXISTS "idx_categories_product_type_id" ON "categories"("product_type_id");

-- 2. Seed all 32 canonical categories from the approved master hierarchy
INSERT INTO "categories" ("id", "category_id", "product_type_id", "category", "sub_category", "sub_sub_category", "category_code", "description", "lifecycle_status", "display_order") VALUES
  ('CAT001', 'CAT001', 'pt_med', 'Drugs', 'Tablets', 'Film Coated Tablets', 'DRUG-TAB-FCT', 'Tablets coated with polymeric protective film for swallowability, stability, and taste masking', 'ACTIVE', 1),
  ('CAT002', 'CAT002', 'pt_med', 'Drugs', 'Tablets', 'Uncoated Tablets', 'DRUG-TAB-UNC', 'Directly compressed solid unit dosage tablets without specialized coating film', 'ACTIVE', 2),
  ('CAT003', 'CAT003', 'pt_med', 'Drugs', 'Tablets', 'Chewable Tablets', 'DRUG-TAB-CHW', 'Palatably formulated tablets designed to be masticated prior to ingestion', 'ACTIVE', 3),
  ('CAT004', 'CAT004', 'pt_med', 'Drugs', 'Tablets', 'Extended Release Tablets', 'DRUG-TAB-EXT', 'Delayed-release and modified release coated tablets for controlled intestinal absorption', 'ACTIVE', 4),
  ('CAT005', 'CAT005', 'pt_med', 'Drugs', 'Capsules', 'Hard Gelatin Capsules', 'DRUG-CAP-HGC', 'Two-piece telescoping gelatin capsule shells containing granules, pellets, or powder', 'ACTIVE', 5),
  ('CAT006', 'CAT006', 'pt_med', 'Drugs', 'Capsules', 'Soft Gelatin Capsules', 'DRUG-CAP-SGC', 'One-piece hermetically sealed soft gelatin capsules containing liquids or suspensions', 'ACTIVE', 6),
  ('CAT007', 'CAT007', 'pt_med', 'Drugs', 'Syrups', 'Oral Syrups', 'DRUG-SYR-ORL', 'Liquid ready-to-administer pharmaceutical syrups and pediatric solutions', 'ACTIVE', 7),
  ('CAT008', 'CAT008', 'pt_med', 'Drugs', 'Syrups', 'Dry Syrups', 'DRUG-SYR-DRY', 'Dry powder antibiotic and pediatric syrup formulations for reconstitution with sterile water', 'ACTIVE', 8),
  ('CAT009', 'CAT009', 'pt_med', 'Drugs', 'Injections', 'IV Injection', 'DRUG-INJ-IV', 'Sterile intravenous injections for systemic intravenous perfusion and bolus', 'ACTIVE', 9),
  ('CAT010', 'CAT010', 'pt_med', 'Drugs', 'Injections', 'IM Injection', 'DRUG-INJ-IM', 'Sterile intramuscular parenterals for deep tissue administration', 'ACTIVE', 10),
  ('CAT011', 'CAT011', 'pt_med', 'Drugs', 'Injections', 'SC Injection', 'DRUG-INJ-SC', 'Sterile subcutaneous parenterals for hypodermic administration', 'ACTIVE', 11),
  ('CAT012', 'CAT012', 'pt_med', 'OTC Medicines', 'Pain Relief', 'Analgesic Balms & Sprays', 'OTC-PAIN-BLM', 'Analgesic balms, topical sprays, and fast-acting headache formulas', 'ACTIVE', 12),
  ('CAT013', 'CAT013', 'pt_med', 'OTC Medicines', 'Cough & Cold', 'Lozenges & Inhalers', 'OTC-CGH-LOZ', 'Cough lozenges, inhalers, and vaporizing chest rubs', 'ACTIVE', 13),
  ('CAT014', 'CAT014', 'pt_med', 'OTC Medicines', 'Digestive Health', 'Antacids & Gas Relief', 'OTC-DIG-ANT', 'Antacids, gas relief suspensions, and oral rehydration salts', 'ACTIVE', 14),
  ('CAT015', 'CAT015', 'pt_med', 'Injectables', 'Vials', 'Multi-Dose Sterile Vials', 'INJ-VIAL-MDV', 'Multi-dose glass and polymer injectable sterile vials', 'ACTIVE', 15),
  ('CAT016', 'CAT016', 'pt_med', 'Injectables', 'Ampoules', 'Single-Use Glass Ampoules', 'INJ-AMP-SGL', 'Single-use hermetic glass ampoules for emergency parenterals', 'ACTIVE', 16),
  ('CAT017', 'CAT017', 'pt_med', 'Medical Preparations', 'Ointments & Creams', 'Topical Antibacterial Creams', 'PREP-ONT-CRM', 'Antibacterial, antifungal, and corticosteroid topical creams', 'ACTIVE', 17),
  ('CAT018', 'CAT018', 'pt_med', 'Medical Preparations', 'Topical Solutions', 'Antiseptic Washes', 'PREP-TOP-SOL', 'Povidone iodine washes, chlorhexidine scrubs, and hydrogen peroxide lotions', 'ACTIVE', 18),
  ('CAT019', 'CAT019', 'pt_nut', 'Dietary Supplements', 'Tablets', 'Multivitamin & Mineral Tablets', 'NUT-SUP-TAB', 'Multivitamin and mineral dietary supplement tablets', 'ACTIVE', 19),
  ('CAT020', 'CAT020', 'pt_nut', 'Dietary Supplements', 'Softgels', 'Omega-3 Fish Oil Softgels', 'NUT-SUP-SGC', 'Omega-3, Fish oil, CoQ10, and vitamin softgel supplements', 'ACTIVE', 20),
  ('CAT021', 'CAT021', 'pt_nut', 'Dietary Supplements', 'Powders', 'Protein & Peptide Powders', 'NUT-SUP-POW', 'Protein powders, collagen peptide jars, and electrolyte mixes', 'ACTIVE', 21),
  ('CAT022', 'CAT022', 'pt_nut', 'Functional Foods', 'Nutrition Bars', 'Energy & Protein Bars', 'NUT-FNC-BAR', 'Energy bars, fortified snacks, and meal replacement nutrition bars', 'ACTIVE', 22),
  ('CAT023', 'CAT023', 'pt_cos', 'Clinical Skincare', 'Serums', 'Facial Active Serums', 'COS-CLN-SER', 'Facial active serums, Vitamin C, Hyaluronic acid serums', 'ACTIVE', 23),
  ('CAT024', 'CAT024', 'pt_cos', 'Clinical Skincare', 'Sunscreen & Lotions', 'Broad Spectrum Sunscreens', 'COS-CLN-SUN', 'Broad spectrum SPF sunscreens and barrier repair moisturizing lotions', 'ACTIVE', 24),
  ('CAT025', 'CAT025', 'pt_cos', 'Haircare Formulations', 'Shampoos', 'Anti-Dandruff & Peptide Shampoos', 'COS-HAR-SHP', 'Clinical shampoos, peptide hair regrowth cleansers', 'ACTIVE', 25),
  ('CAT026', 'CAT026', 'pt_ayr', 'Classical Ayurvedic', 'Asava & Arishta', 'Herbal Fermented Extracts', 'AYR-CLS-ASV', 'Naturally fermented self-generated herbal alcoholic extracts', 'ACTIVE', 26),
  ('CAT027', 'CAT027', 'pt_ayr', 'Classical Ayurvedic', 'Churna', 'Micronized Herbal Powders', 'AYR-CLS-CHR', 'Micro-pulverized classical herbal compound powders', 'ACTIVE', 27),
  ('CAT028', 'CAT028', 'pt_ayr', 'Herbal Formulations', 'Herbal Syrups', 'Natural Cough & Liver Tonics', 'AYR-HRB-SYR', 'Standardized modern botanical extract syrups and tonics', 'ACTIVE', 28),
  ('CAT029', 'CAT029', 'pt_vet', 'Livestock Health', 'Bolus', 'Cattle Oral Bolus', 'VET-LIV-BOL', 'Large-dose veterinary solid oral bolus for ruminants', 'ACTIVE', 29),
  ('CAT030', 'CAT030', 'pt_vet', 'Livestock Health', 'Feed Supplements', 'Mineral Feed Premixes', 'VET-LIV-FMS', 'Mineral mixtures, calcium tonics, and lactation boosters', 'ACTIVE', 30),
  ('CAT031', 'CAT031', 'pt_srg', 'Surgical Consumables', 'Gloves & Drapes', 'Latex & Nitrile Gloves', 'SRG-CON-GLV', 'Latex surgical gloves, nitrile examination gloves, and sterile surgical drapes', 'ACTIVE', 31),
  ('CAT032', 'CAT032', 'pt_srg', 'Surgical Consumables', 'Cannula & IV Sets', 'IV Cannula & Infusion Sets', 'SRG-CON-CAN', 'IV cannulas with injection port, infusion transfusion sets, and hypodermic needles', 'ACTIVE', 32)
ON CONFLICT ("id") DO NOTHING;

-- 3. Also register them into catalog_products to guarantee foreign key integrity for manufacturer_products
INSERT INTO "catalog_products" ("id", "product_code", "name", "generic_name", "dosage_form", "category", "pack_size") VALUES
  ('CAT001', 'DRUG-TAB-FCT', 'Film Coated Tablets', 'Tablets - Film Coated', 'Tablet', 'Drugs', 'Standard Batch'),
  ('CAT002', 'DRUG-TAB-UNC', 'Uncoated Tablets', 'Tablets - Uncoated', 'Tablet', 'Drugs', 'Standard Batch'),
  ('CAT003', 'DRUG-TAB-CHW', 'Chewable Tablets', 'Tablets - Chewable', 'Tablet', 'Drugs', 'Standard Batch'),
  ('CAT004', 'DRUG-TAB-EXT', 'Extended Release Tablets', 'Tablets - Extended Release', 'Tablet', 'Drugs', 'Standard Batch'),
  ('CAT005', 'DRUG-CAP-HGC', 'Hard Gelatin Capsules', 'Capsules - Hard Gelatin', 'Capsule', 'Drugs', 'Standard Batch'),
  ('CAT006', 'DRUG-CAP-SGC', 'Soft Gelatin Capsules', 'Capsules - Soft Gelatin', 'Capsule', 'Drugs', 'Standard Batch'),
  ('CAT007', 'DRUG-SYR-ORL', 'Oral Syrups', 'Syrups - Oral Liquid', 'Syrup', 'Drugs', 'Standard Batch'),
  ('CAT008', 'DRUG-SYR-DRY', 'Dry Syrups', 'Syrups - Dry Powder', 'Syrup', 'Drugs', 'Standard Batch'),
  ('CAT009', 'DRUG-INJ-IV', 'IV Injection', 'Injections - Intravenous', 'Injection', 'Drugs', 'Standard Batch'),
  ('CAT010', 'DRUG-INJ-IM', 'IM Injection', 'Injections - Intramuscular', 'Injection', 'Drugs', 'Standard Batch'),
  ('CAT011', 'DRUG-INJ-SC', 'SC Injection', 'Injections - Subcutaneous', 'Injection', 'Drugs', 'Standard Batch'),
  ('CAT012', 'OTC-PAIN-BLM', 'Analgesic Balms & Sprays', 'OTC - Pain Relief', 'Balm/Spray', 'OTC Medicines', 'Standard Batch'),
  ('CAT013', 'OTC-CGH-LOZ', 'Lozenges & Inhalers', 'OTC - Cough & Cold', 'Lozenges', 'OTC Medicines', 'Standard Batch'),
  ('CAT014', 'OTC-DIG-ANT', 'Antacids & Gas Relief', 'OTC - Digestive Health', 'Suspension', 'OTC Medicines', 'Standard Batch'),
  ('CAT015', 'INJ-VIAL-MDV', 'Multi-Dose Sterile Vials', 'Injectables - Multi-Dose Vials', 'Vial', 'Injectables', 'Standard Batch'),
  ('CAT016', 'INJ-AMP-SGL', 'Single-Use Glass Ampoules', 'Injectables - Single-Use Ampoules', 'Ampoule', 'Injectables', 'Standard Batch'),
  ('CAT017', 'PREP-ONT-CRM', 'Topical Antibacterial Creams', 'Medical Preparations - Ointments & Creams', 'Cream', 'Medical Preparations', 'Standard Batch'),
  ('CAT018', 'PREP-TOP-SOL', 'Antiseptic Washes', 'Medical Preparations - Topical Solutions', 'Solution', 'Medical Preparations', 'Standard Batch'),
  ('CAT019', 'NUT-SUP-TAB', 'Multivitamin & Mineral Tablets', 'Dietary Supplements - Tablets', 'Tablet', 'Dietary Supplements', 'Standard Batch'),
  ('CAT020', 'NUT-SUP-SGC', 'Omega-3 Fish Oil Softgels', 'Dietary Supplements - Softgels', 'Softgel', 'Dietary Supplements', 'Standard Batch'),
  ('CAT021', 'NUT-SUP-POW', 'Protein & Peptide Powders', 'Dietary Supplements - Powders', 'Powder', 'Dietary Supplements', 'Standard Batch'),
  ('CAT022', 'NUT-FNC-BAR', 'Energy & Protein Bars', 'Functional Foods - Bars', 'Bar', 'Functional Foods', 'Standard Batch'),
  ('CAT023', 'COS-CLN-SER', 'Facial Active Serums', 'Clinical Skincare - Serums', 'Serum', 'Clinical Skincare', 'Standard Batch'),
  ('CAT024', 'COS-CLN-SUN', 'Broad Spectrum Sunscreens', 'Clinical Skincare - Sunscreens', 'Lotion', 'Clinical Skincare', 'Standard Batch'),
  ('CAT025', 'COS-HAR-SHP', 'Anti-Dandruff & Peptide Shampoos', 'Haircare - Shampoos', 'Liquid', 'Haircare Formulations', 'Standard Batch'),
  ('CAT026', 'AYR-CLS-ASV', 'Herbal Fermented Extracts', 'Classical Ayurvedic - Asava & Arishta', 'Extract', 'Classical Ayurvedic', 'Standard Batch'),
  ('CAT027', 'AYR-CLS-CHR', 'Micronized Herbal Powders', 'Classical Ayurvedic - Churna', 'Powder', 'Classical Ayurvedic', 'Standard Batch'),
  ('CAT028', 'AYR-HRB-SYR', 'Natural Cough & Liver Tonics', 'Herbal Formulations - Syrups', 'Syrup', 'Herbal Formulations', 'Standard Batch'),
  ('CAT029', 'VET-LIV-BOL', 'Cattle Oral Bolus', 'Livestock Health - Bolus', 'Bolus', 'Livestock Health', 'Standard Batch'),
  ('CAT030', 'VET-LIV-FMS', 'Mineral Feed Premixes', 'Livestock Health - Feed Supplements', 'Premix', 'Livestock Health', 'Standard Batch'),
  ('CAT031', 'SRG-CON-GLV', 'Latex & Nitrile Gloves', 'Surgical Consumables - Gloves', 'Gloves', 'Surgical Consumables', 'Standard Batch'),
  ('CAT032', 'SRG-CON-CAN', 'IV Cannula & Infusion Sets', 'Surgical Consumables - Cannula & Sets', 'Device', 'Surgical Consumables', 'Standard Batch')
ON CONFLICT ("id") DO NOTHING;
