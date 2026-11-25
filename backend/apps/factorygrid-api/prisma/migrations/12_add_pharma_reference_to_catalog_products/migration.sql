-- AlterTable: add pharma_reference to catalog_products table
ALTER TABLE "catalog_products" ADD COLUMN IF NOT EXISTS "pharma_reference" VARCHAR(255);
