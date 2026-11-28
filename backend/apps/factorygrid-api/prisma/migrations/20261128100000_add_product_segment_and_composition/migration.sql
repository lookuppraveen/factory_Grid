-- Add segment_id and composition to catalog_products (non-destructive migration)
ALTER TABLE "catalog_products"
  ADD COLUMN IF NOT EXISTS "segment_id" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "composition" VARCHAR(500);

-- Safely backfill composition from existing generic_name without destroying any data
UPDATE "catalog_products"
SET "composition" = "generic_name"
WHERE "composition" IS NULL
  AND "generic_name" IS NOT NULL
  AND TRIM("generic_name") <> '';

CREATE INDEX IF NOT EXISTS "idx_catalog_products_segment" ON "catalog_products"("segment_id");
