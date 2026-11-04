-- AlterTable: add missing columns to manufacturer_products
ALTER TABLE "manufacturer_products"
  ADD COLUMN IF NOT EXISTS "manufacturer_product_code" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "manufacturer_part_number" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "manufacturer_sku" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "lifecycle_status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "effective_from" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "effective_to" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "is_preferred" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "packaging_details" VARCHAR(255);

-- Create product types if not exists
CREATE TABLE IF NOT EXISTS "product_types" (
  "id" VARCHAR(50) NOT NULL,
  "product_type_code" VARCHAR(50) NOT NULL,
  "product_type_name" VARCHAR(150) NOT NULL,
  "description" VARCHAR(500),
  "lifecycle_status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  "display_order" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "product_types_product_type_code_key" ON "product_types"("product_type_code");
CREATE INDEX IF NOT EXISTS "idx_product_types_code" ON "product_types"("product_type_code");
CREATE INDEX IF NOT EXISTS "idx_product_types_status" ON "product_types"("lifecycle_status");

-- Create attribute masters if not exists
CREATE TABLE IF NOT EXISTS "attribute_masters" (
  "id" VARCHAR(50) NOT NULL,
  "attribute_code" VARCHAR(50) NOT NULL,
  "attribute_name" VARCHAR(150) NOT NULL,
  "data_type" VARCHAR(50) NOT NULL DEFAULT 'TEXT',
  "validation_rules" JSONB,
  "description" VARCHAR(500),
  "is_filterable" BOOLEAN NOT NULL DEFAULT false,
  "is_searchable" BOOLEAN NOT NULL DEFAULT false,
  "is_required" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attribute_masters_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "attribute_masters_attribute_code_key" ON "attribute_masters"("attribute_code");
CREATE INDEX IF NOT EXISTS "idx_attr_masters_code" ON "attribute_masters"("attribute_code");
CREATE INDEX IF NOT EXISTS "idx_attr_masters_data_type" ON "attribute_masters"("data_type");

-- Create category attributes if not exists
CREATE TABLE IF NOT EXISTS "category_attributes" (
  "id" BIGSERIAL NOT NULL,
  "category_id" VARCHAR(50) NOT NULL,
  "attribute_id" VARCHAR(50) NOT NULL,
  "is_required" BOOLEAN NOT NULL DEFAULT false,
  "display_order" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "category_attributes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_category_attribute" ON "category_attributes"("category_id", "attribute_id");
CREATE INDEX IF NOT EXISTS "idx_cat_attrs_category_id" ON "category_attributes"("category_id");
CREATE INDEX IF NOT EXISTS "idx_cat_attrs_attribute_id" ON "category_attributes"("attribute_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'category_attributes_category_id_fkey') THEN
    ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'category_attributes_attribute_id_fkey') THEN
    ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Create product attributes if not exists
CREATE TABLE IF NOT EXISTS "product_attributes" (
  "id" BIGSERIAL NOT NULL,
  "product_id" VARCHAR(50) NOT NULL,
  "attribute_id" VARCHAR(50) NOT NULL,
  "attribute_value" TEXT,
  "attribute_value_json" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_product_attribute" ON "product_attributes"("product_id", "attribute_id");
CREATE INDEX IF NOT EXISTS "idx_prod_attrs_product_id" ON "product_attributes"("product_id");
CREATE INDEX IF NOT EXISTS "idx_prod_attrs_attribute_id" ON "product_attributes"("attribute_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_attributes_product_id_fkey') THEN
    ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_attributes_attribute_id_fkey') THEN
    ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Create product prices if not exists
CREATE TABLE IF NOT EXISTS "product_prices" (
  "id" BIGSERIAL NOT NULL,
  "product_id" VARCHAR(50) NOT NULL,
  "product_manufacturer_id" BIGINT,
  "customer_segment_id" VARCHAR(50),
  "price_type" VARCHAR(50) NOT NULL DEFAULT 'BASE',
  "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
  "unit_price" DECIMAL(12,2) NOT NULL,
  "min_quantity" INTEGER NOT NULL DEFAULT 1,
  "max_quantity" INTEGER,
  "effective_from" DATE,
  "effective_to" DATE,
  "price_status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_prod_prices_product_id" ON "product_prices"("product_id");
CREATE INDEX IF NOT EXISTS "idx_prod_prices_mfg_id" ON "product_prices"("product_manufacturer_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_prices_product_id_fkey') THEN
    ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_prices_product_manufacturer_id_fkey') THEN
    ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_manufacturer_id_fkey" FOREIGN KEY ("product_manufacturer_id") REFERENCES "manufacturer_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
