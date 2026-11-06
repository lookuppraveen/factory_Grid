-- =====================================================================
-- Migration: 11_product_pricing_tax_uom
-- Description: Centralized Product Price, Tax, UOM and Customer Segments
-- =====================================================================

-- 1. Create customer_segments table if not exists
CREATE TABLE IF NOT EXISTS "customer_segments" (
  "id" VARCHAR(50) NOT NULL,
  "segment_code" VARCHAR(50) NOT NULL,
  "segment_name" VARCHAR(150) NOT NULL,
  "description" VARCHAR(500),
  "lifecycle_status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customer_segments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "customer_segments_segment_code_key" ON "customer_segments"("segment_code");
CREATE INDEX IF NOT EXISTS "idx_cust_seg_code" ON "customer_segments"("segment_code");
CREATE INDEX IF NOT EXISTS "idx_cust_seg_status" ON "customer_segments"("lifecycle_status");

-- 2. Seed standard customer segments if not existing
INSERT INTO "customer_segments" ("id", "segment_code", "segment_name", "description", "lifecycle_status")
VALUES
  ('seg_dist', 'DIST', 'Distributor / Stockist', 'Wholesale pharmaceutical distributors and regional stockists', 'ACTIVE'),
  ('seg_ret', 'RET', 'Retail Pharmacy Chain', 'Retail pharmacy chains, standalone community chemists and dispensaries', 'ACTIVE'),
  ('seg_hosp', 'HOSP', 'Hospital / Institutional', 'Corporate hospitals, clinics and government healthcare institutions', 'ACTIVE'),
  ('seg_pcd', 'PCD', 'PCD Franchise Partner', 'Propaganda Cum Distribution monopoly rights franchise partners', 'ACTIVE'),
  ('seg_gen', 'GEN', 'General Public (OTC)', 'Over the counter non-prescription direct consumers', 'ACTIVE')
ON CONFLICT ("id") DO NOTHING;

-- 3. Add FK from product_prices to customer_segments if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_prices_customer_segment_id_fkey'
  ) THEN
    ALTER TABLE "product_prices"
      ADD CONSTRAINT "product_prices_customer_segment_id_fkey"
      FOREIGN KEY ("customer_segment_id") REFERENCES "customer_segments"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "idx_prod_prices_cust_seg_id" ON "product_prices"("customer_segment_id");

-- 4. Create product_taxes table if not exists
CREATE TABLE IF NOT EXISTS "product_taxes" (
  "id" BIGSERIAL NOT NULL,
  "product_id" VARCHAR(50) NOT NULL,
  "tax_code" VARCHAR(50) NOT NULL,
  "tax_rate" DECIMAL(5, 2) NOT NULL,
  "effective_from" DATE,
  "effective_to" DATE,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_taxes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_prod_taxes_product_id" ON "product_taxes"("product_id");
CREATE INDEX IF NOT EXISTS "idx_prod_taxes_status" ON "product_taxes"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_taxes_product_id_fkey'
  ) THEN
    ALTER TABLE "product_taxes"
      ADD CONSTRAINT "product_taxes_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 5. Create product_uoms table if not exists
CREATE TABLE IF NOT EXISTS "product_uoms" (
  "id" BIGSERIAL NOT NULL,
  "product_id" VARCHAR(50) NOT NULL,
  "uom" VARCHAR(50) NOT NULL,
  "conversion_factor" DECIMAL(10, 4) NOT NULL DEFAULT 1.0000,
  "is_base_uom" BOOLEAN NOT NULL DEFAULT false,
  "is_order_uom" BOOLEAN NOT NULL DEFAULT true,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_uoms_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_product_uom" ON "product_uoms"("product_id", "uom");
CREATE INDEX IF NOT EXISTS "idx_prod_uoms_product_id" ON "product_uoms"("product_id");
CREATE INDEX IF NOT EXISTS "idx_prod_uoms_active" ON "product_uoms"("is_active");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_uoms_product_id_fkey'
  ) THEN
    ALTER TABLE "product_uoms"
      ADD CONSTRAINT "product_uoms_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 6. Seed initial authentic product taxes for catalog products
INSERT INTO "product_taxes" ("product_id", "tax_code", "tax_rate", "effective_from", "effective_to", "status")
SELECT p.id, 'HSN-3004-10', 12.00, '2025-01-01', NULL, 'ACTIVE'
FROM "catalog_products" p
WHERE p.id IN ('p1', 'p2', 'p3', 'p4', 'p5', 'p6')
  AND NOT EXISTS (SELECT 1 FROM "product_taxes" pt WHERE pt.product_id = p.id AND pt.tax_code = 'HSN-3004-10');

INSERT INTO "product_taxes" ("product_id", "tax_code", "tax_rate", "effective_from", "effective_to", "status")
SELECT p.id, 'HSN-2106-90', 18.00, '2025-01-01', NULL, 'ACTIVE'
FROM "catalog_products" p
WHERE p.id IN ('p14')
  AND NOT EXISTS (SELECT 1 FROM "product_taxes" pt WHERE pt.product_id = p.id AND pt.tax_code = 'HSN-2106-90');

INSERT INTO "product_taxes" ("product_id", "tax_code", "tax_rate", "effective_from", "effective_to", "status")
SELECT p.id, 'HSN-3304-99', 18.00, '2025-01-01', NULL, 'ACTIVE'
FROM "catalog_products" p
WHERE p.id IN ('p15')
  AND NOT EXISTS (SELECT 1 FROM "product_taxes" pt WHERE pt.product_id = p.id AND pt.tax_code = 'HSN-3304-99');

-- 7. Seed initial authentic product UOMs for catalog products
-- Base units (1x)
INSERT INTO "product_uoms" ("product_id", "uom", "conversion_factor", "is_base_uom", "is_order_uom", "is_active")
SELECT p.id, 'Strip', 1.0000, true, false, true
FROM "catalog_products" p
WHERE p.id IN ('p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p14')
  AND NOT EXISTS (SELECT 1 FROM "product_uoms" pu WHERE pu.product_id = p.id AND pu.uom = 'Strip');

-- Order units (Boxes)
INSERT INTO "product_uoms" ("product_id", "uom", "conversion_factor", "is_base_uom", "is_order_uom", "is_active")
SELECT p.id, 'Box', 10.0000, false, true, true
FROM "catalog_products" p
WHERE p.id IN ('p1', 'p4', 'p6')
  AND NOT EXISTS (SELECT 1 FROM "product_uoms" pu WHERE pu.product_id = p.id AND pu.uom = 'Box');

INSERT INTO "product_uoms" ("product_id", "uom", "conversion_factor", "is_base_uom", "is_order_uom", "is_active")
SELECT p.id, 'Box', 15.0000, false, true, true
FROM "catalog_products" p
WHERE p.id IN ('p2', 'p5')
  AND NOT EXISTS (SELECT 1 FROM "product_uoms" pu WHERE pu.product_id = p.id AND pu.uom = 'Box');

-- 8. Seed initial authentic prices for p1, p2, p3 across segments if not existing
INSERT INTO "product_prices" ("product_id", "customer_segment_id", "price_type", "currency", "unit_price", "min_quantity", "max_quantity", "effective_from", "effective_to", "price_status")
SELECT 'p1', 'seg_dist', 'TIERED', 'INR', 42.00, 1000, NULL, '2025-01-01', '2027-12-31', 'ACTIVE'
WHERE EXISTS (SELECT 1 FROM "catalog_products" WHERE id = 'p1')
  AND NOT EXISTS (SELECT 1 FROM "product_prices" WHERE product_id = 'p1' AND customer_segment_id = 'seg_dist');

INSERT INTO "product_prices" ("product_id", "customer_segment_id", "price_type", "currency", "unit_price", "min_quantity", "max_quantity", "effective_from", "effective_to", "price_status")
SELECT 'p1', 'seg_ret', 'FIXED', 'INR', 45.00, 200, 999, '2025-01-01', '2027-12-31', 'ACTIVE'
WHERE EXISTS (SELECT 1 FROM "catalog_products" WHERE id = 'p1')
  AND NOT EXISTS (SELECT 1 FROM "product_prices" WHERE product_id = 'p1' AND customer_segment_id = 'seg_ret');

INSERT INTO "product_prices" ("product_id", "customer_segment_id", "price_type", "currency", "unit_price", "min_quantity", "max_quantity", "effective_from", "effective_to", "price_status")
SELECT 'p1', 'seg_hosp', 'CONTRACT', 'INR', 39.50, 5000, NULL, '2025-01-01', '2027-12-31', 'ACTIVE'
WHERE EXISTS (SELECT 1 FROM "catalog_products" WHERE id = 'p1')
  AND NOT EXISTS (SELECT 1 FROM "product_prices" WHERE product_id = 'p1' AND customer_segment_id = 'seg_hosp');

INSERT INTO "product_prices" ("product_id", "customer_segment_id", "price_type", "currency", "unit_price", "min_quantity", "max_quantity", "effective_from", "effective_to", "price_status")
SELECT 'p2', 'seg_dist', 'TIERED', 'INR', 11.00, 2000, NULL, '2025-01-01', '2027-12-31', 'ACTIVE'
WHERE EXISTS (SELECT 1 FROM "catalog_products" WHERE id = 'p2')
  AND NOT EXISTS (SELECT 1 FROM "product_prices" WHERE product_id = 'p2' AND customer_segment_id = 'seg_dist');

INSERT INTO "product_prices" ("product_id", "customer_segment_id", "price_type", "currency", "unit_price", "min_quantity", "max_quantity", "effective_from", "effective_to", "price_status")
SELECT 'p2', 'seg_pcd', 'FIXED', 'INR', 12.00, 1000, NULL, '2025-01-01', '2027-12-31', 'ACTIVE'
WHERE EXISTS (SELECT 1 FROM "catalog_products" WHERE id = 'p2')
  AND NOT EXISTS (SELECT 1 FROM "product_prices" WHERE product_id = 'p2' AND customer_segment_id = 'seg_pcd');

INSERT INTO "product_prices" ("product_id", "customer_segment_id", "price_type", "currency", "unit_price", "min_quantity", "max_quantity", "effective_from", "effective_to", "price_status")
SELECT 'p3', 'seg_dist', 'TIERED', 'INR', 52.00, 500, NULL, '2025-01-01', '2027-12-31', 'ACTIVE'
WHERE EXISTS (SELECT 1 FROM "catalog_products" WHERE id = 'p3')
  AND NOT EXISTS (SELECT 1 FROM "product_prices" WHERE product_id = 'p3' AND customer_segment_id = 'seg_dist');

