-- AlterTable: add who_gmp_applicable to manufacturer_registrations
ALTER TABLE "manufacturer_registrations"
  ADD COLUMN IF NOT EXISTS "who_gmp_applicable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: add document_number to manufacturer_documents
ALTER TABLE "manufacturer_documents"
  ADD COLUMN IF NOT EXISTS "document_number" VARCHAR(100);

-- Migrate legacy GLP display names to GMP
UPDATE "manufacturer_documents"
SET "category_display_name" = 'GMP Certificate (Good Manufacturing Practice)'
WHERE "category" = 'gmpCert' OR "category_display_name" ILIKE '%GLP Certificate%';

-- Migrate legacy WHO-GLP display names to WHO-GMP
UPDATE "manufacturer_documents"
SET "category_display_name" = 'WHO-GMP Certificate (World Health Organization GMP)'
WHERE "category" = 'whoGmpCert' OR "category_display_name" ILIKE '%WHO-GLP%';
