-- Create product_type_attributes table
CREATE TABLE IF NOT EXISTS "product_type_attributes" (
  "id" BIGSERIAL NOT NULL,
  "product_type_id" VARCHAR(50) NOT NULL,
  "attribute_id" VARCHAR(50) NOT NULL,
  "is_required" BOOLEAN NOT NULL DEFAULT false,
  "display_order" INTEGER NOT NULL DEFAULT 1,
  "lifecycle_status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_type_attributes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_product_type_attribute" ON "product_type_attributes"("product_type_id", "attribute_id");
CREATE INDEX IF NOT EXISTS "idx_pta_product_type_id" ON "product_type_attributes"("product_type_id");
CREATE INDEX IF NOT EXISTS "idx_pta_attribute_id" ON "product_type_attributes"("attribute_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_type_attributes_product_type_id_fkey') THEN
    ALTER TABLE "product_type_attributes" ADD CONSTRAINT "product_type_attributes_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_type_attributes_attribute_id_fkey') THEN
    ALTER TABLE "product_type_attributes" ADD CONSTRAINT "product_type_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Safely migrate existing category-attribute assignments into product_type_attributes
INSERT INTO "product_type_attributes" ("product_type_id", "attribute_id", "is_required", "display_order", "lifecycle_status", "created_at", "updated_at")
SELECT DISTINCT c.product_type_id, ca.attribute_id, ca.is_required, ca.display_order, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "category_attributes" ca
JOIN "categories" c ON ca.category_id = c.id
JOIN "product_types" pt ON c.product_type_id = pt.id
ON CONFLICT ("product_type_id", "attribute_id") DO NOTHING;
