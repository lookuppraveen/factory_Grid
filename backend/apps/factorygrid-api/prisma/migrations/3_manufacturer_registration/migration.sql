-- Manufacturer registration workflow: registrations, documents, product capabilities and a seeded master catalogue.
CREATE TABLE IF NOT EXISTS "catalog_products" (
    "id" VARCHAR(50) NOT NULL,
    "product_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "generic_name" VARCHAR(250) NOT NULL,
    "dosage_form" VARCHAR(100) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "pack_size" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "catalog_products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "catalog_products_product_code_key" ON "catalog_products"("product_code");
CREATE INDEX IF NOT EXISTS "idx_catalog_products_category" ON "catalog_products"("category");

CREATE TABLE IF NOT EXISTS "manufacturer_registrations" (
    "id" BIGSERIAL NOT NULL,
    "registration_code" VARCHAR(50) NOT NULL,
    "user_id" BIGINT,
    "company_name" VARCHAR(150) NOT NULL,
    "facility_address" VARCHAR(500) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(20) NOT NULL,
    "mfg_capacity" VARCHAR(150) NOT NULL,
    "contact_person" VARCHAR(150) NOT NULL,
    "designation" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMPTZ(6),
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by" VARCHAR(150),
    "rejection_reason" VARCHAR(500),
    "manufacturer_code" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "manufacturer_registrations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "manufacturer_registrations_registration_code_key" ON "manufacturer_registrations"("registration_code");
CREATE INDEX IF NOT EXISTS "idx_mfg_reg_user_id" ON "manufacturer_registrations"("user_id");
CREATE INDEX IF NOT EXISTS "idx_mfg_reg_email" ON "manufacturer_registrations"("email");
CREATE INDEX IF NOT EXISTS "idx_mfg_reg_status" ON "manufacturer_registrations"("status");
ALTER TABLE "manufacturer_registrations" ADD CONSTRAINT "manufacturer_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "manufacturer_documents" (
    "id" BIGSERIAL NOT NULL,
    "registration_id" BIGINT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "category_display_name" VARCHAR(100) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "storage_bucket" VARCHAR(100) NOT NULL,
    "issue_date" DATE NOT NULL,
    "expiry_date" DATE NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "rejection_reason" VARCHAR(500),
    "reviewed_by" VARCHAR(150),
    "reviewed_at" TIMESTAMPTZ(6),
    "review_decision" VARCHAR(50),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "manufacturer_documents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_mfg_doc_registration_id" ON "manufacturer_documents"("registration_id");
CREATE INDEX IF NOT EXISTS "idx_mfg_doc_category" ON "manufacturer_documents"("category");
ALTER TABLE "manufacturer_documents" ADD CONSTRAINT "manufacturer_documents_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "manufacturer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "manufacturer_products" (
    "id" BIGSERIAL NOT NULL,
    "registration_id" BIGINT NOT NULL,
    "product_id" VARCHAR(50) NOT NULL,
    "moq" INTEGER,
    "lead_time_days" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "manufacturer_products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_mfg_product_registration_product" ON "manufacturer_products"("registration_id", "product_id");
ALTER TABLE "manufacturer_products" ADD CONSTRAINT "manufacturer_products_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "manufacturer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "manufacturer_products" ADD CONSTRAINT "manufacturer_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed the master catalogue (same product master the frontend ships with).
INSERT INTO "catalog_products" ("id", "product_code", "name", "generic_name", "dosage_form", "category", "pack_size") VALUES
  ('p1', 'PRD001001', 'Amoxyclav 625mg Tablets', 'Amoxicillin + Potassium Clavulanate', 'Tablet', 'Drugs', '10 x 1 x 10 Strip'),
  ('p2', 'PRD001002', 'Paracetamol 650mg ER Tablets', 'Paracetamol Extended Release', 'Tablet', 'Drugs', '10 x 15 Strip'),
  ('p3', 'PRD001003', 'Azithromycin 500mg Tablets', 'Azithromycin Dihydrate', 'Tablet', 'Drugs', '10 x 3 Strip'),
  ('p4', 'PRD001004', 'Pantoprazole 40mg + Domperidone 30mg SR', 'Pantoprazole + Domperidone SR', 'Capsule', 'Drugs', '10 x 10 Strip'),
  ('p5', 'PRD001005', 'Metformin SR 500mg Tablets', 'Metformin Hydrochloride Sustained Release', 'Tablet', 'Drugs', '10 x 15 Strip'),
  ('p6', 'PRD001006', 'Paracetamol 500mg Tablets', 'Paracetamol', 'Tablet', 'Drugs', '10 x 10 Strip'),
  ('p7', 'PRD001007', 'Cough Relief Dextromethorphan Syrup 100ml', 'Dextromethorphan Hydrobromide + Chlorpheniramine', 'Syrup', 'Drugs', '1 x 100ml Bottle'),
  ('p8', 'PRD001008', 'Ceftriaxone 1000mg Injection Vial', 'Ceftriaxone Sodium Sterile', 'Injection', 'Drugs', '1 Vial + Sterile Water'),
  ('p9', 'PRD001009', 'Diclofenac Diethylamine Gel 30g', 'Diclofenac + Linseed Oil + Methyl Salicylate', 'Gel', 'Drugs', '1 x 30g Lami Tube'),
  ('p10', 'PRD001010', 'Ciprofloxacin 500mg Tablets', 'Ciprofloxacin Hydrochloride', 'Tablet', 'Drugs', '10 x 10 Strip'),
  ('p11', 'PRD001011', 'Ibuprofen 400mg Film-Coated Tablets', 'Ibuprofen', 'Tablet', 'Drugs', '10 x 10 Strip'),
  ('p12', 'PRD001012', 'Omeprazole 20mg Delayed Release Capsules', 'Omeprazole', 'Capsule', 'Drugs', '10 x 15 Strip'),
  ('p13', 'PRD001013', 'Glimepiride 2mg Tablets', 'Glimepiride', 'Tablet', 'Drugs', '10 x 10 Strip'),
  ('p14', 'PRD001014', 'Multivitamin & Mineral Softgel Capsules', 'Multivitamins with Zinc & Ginseng Extract', 'Capsule', 'Nutraceuticals/Food', '3 x 10 Blister Pack'),
  ('p15', 'PRD001015', 'Dermacare Vitamin C Radiance Serum 30ml', 'Vitamin C + Ferulic Acid + Hyaluronic Acid', 'Cosmetics', 'Cosmetics', '1 x 30ml Dropper Bottle'),
  ('gen-p1', 'GEN001001', 'Paracetamol 500mg Tablets (Generic)', 'Paracetamol', 'Tablet', 'Drugs', '10 x 10 Strip'),
  ('gen-p2', 'GEN001002', 'Amoxicillin 250mg Capsules (Generic)', 'Amoxicillin', 'Capsule', 'Drugs', '10 x 10 Strip')
ON CONFLICT ("id") DO NOTHING;
