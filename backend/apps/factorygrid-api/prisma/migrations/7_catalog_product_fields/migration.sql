-- AlterTable: add approved Product fields to catalog_products table
ALTER TABLE "catalog_products"
  ADD COLUMN IF NOT EXISTS "short_name" VARCHAR(150),
  ADD COLUMN IF NOT EXISTS "product_type_id" VARCHAR(50) DEFAULT 'pt_med',
  ADD COLUMN IF NOT EXISTS "category_id" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "sub_category" VARCHAR(150),
  ADD COLUMN IF NOT EXISTS "sub_sub_category" VARCHAR(150),
  ADD COLUMN IF NOT EXISTS "brand" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "brand_id" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "description" VARCHAR(1000),
  ADD COLUMN IF NOT EXISTS "base_uom" VARCHAR(50) DEFAULT 'Unit',
  ADD COLUMN IF NOT EXISTS "pack_uom" VARCHAR(50) DEFAULT 'Strip',
  ADD COLUMN IF NOT EXISTS "lifecycle_status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "available_from" DATE,
  ADD COLUMN IF NOT EXISTS "discontinued_on" DATE,
  ADD COLUMN IF NOT EXISTS "replacement_product_id" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "is_sellable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "attributes" JSONB,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_catalog_products_category_id" ON "catalog_products"("category_id");
CREATE INDEX IF NOT EXISTS "idx_catalog_products_product_type_id" ON "catalog_products"("product_type_id");
CREATE INDEX IF NOT EXISTS "idx_catalog_products_lifecycle_status" ON "catalog_products"("lifecycle_status");

-- Backfill existing rows with matching category data from categories table where applicable
UPDATE "catalog_products" cp
SET
  "category_id" = c."id",
  "product_type_id" = c."product_type_id",
  "sub_category" = c."sub_category",
  "sub_sub_category" = c."sub_sub_category"
FROM "categories" c
WHERE cp."id" = c."id" OR cp."product_code" = c."category_code";
