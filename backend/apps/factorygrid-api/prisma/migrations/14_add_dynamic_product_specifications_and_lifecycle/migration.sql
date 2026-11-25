-- AlterTable: Add pre-allocated generic attribute specification columns to catalog_products
ALTER TABLE "catalog_products"
ADD COLUMN IF NOT EXISTS "attribute_1" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_2" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_3" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_4" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_5" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_6" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_7" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_8" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_9" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_10" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_11" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_12" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_13" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_14" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_15" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_16" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_17" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_18" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_19" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "attribute_20" VARCHAR(255);

-- Ensure index on lifecycle_status if not present
CREATE INDEX IF NOT EXISTS "idx_catalog_products_lifecycle_status" ON "catalog_products"("lifecycle_status");
