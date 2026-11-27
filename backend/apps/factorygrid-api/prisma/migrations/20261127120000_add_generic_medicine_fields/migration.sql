-- Add Generic Medicine classification and price support to catalog_products and manufacturer_products
ALTER TABLE "catalog_products"
  ADD COLUMN IF NOT EXISTS "is_generic_medicine" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "generic_medicine_price" DECIMAL(12,2);

ALTER TABLE "manufacturer_products"
  ADD COLUMN IF NOT EXISTS "is_generic_medicine" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "generic_medicine_price" DECIMAL(12,2);

CREATE INDEX IF NOT EXISTS "idx_catalog_products_is_generic_medicine"
  ON "catalog_products"("is_generic_medicine");

CREATE INDEX IF NOT EXISTS "idx_mfg_products_is_generic_medicine"
  ON "manufacturer_products"("is_generic_medicine");
