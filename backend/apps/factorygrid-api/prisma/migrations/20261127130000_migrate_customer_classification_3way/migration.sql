-- Migrate customer_classification to 3-way classification: RETAIL, B2B, B2B_SPECIAL
-- Non-destructive migration:
--   SPECIAL_PARTY -> B2B_SPECIAL
--   REGULAR / NULL / unknown -> B2B (safe default; editable via Customer Verification dropdown)

UPDATE "customer_verification_requests"
SET "customer_classification" = CASE
  WHEN UPPER(TRIM(COALESCE("customer_classification", ''))) IN ('SPECIAL_PARTY', 'B2B_SPECIAL') THEN 'B2B_SPECIAL'
  WHEN UPPER(TRIM(COALESCE("customer_classification", ''))) = 'RETAIL' THEN 'RETAIL'
  ELSE 'B2B'
END;

UPDATE "rfqs"
SET "customer_classification" = CASE
  WHEN UPPER(TRIM(COALESCE("customer_classification", ''))) IN ('SPECIAL_PARTY', 'B2B_SPECIAL') THEN 'B2B_SPECIAL'
  WHEN UPPER(TRIM(COALESCE("customer_classification", ''))) = 'RETAIL' THEN 'RETAIL'
  ELSE 'B2B'
END;

UPDATE "master_orders"
SET "customer_classification" = CASE
  WHEN UPPER(TRIM(COALESCE("customer_classification", ''))) IN ('SPECIAL_PARTY', 'B2B_SPECIAL') THEN 'B2B_SPECIAL'
  WHEN UPPER(TRIM(COALESCE("customer_classification", ''))) = 'RETAIL' THEN 'RETAIL'
  ELSE 'B2B'
END;

ALTER TABLE "customer_verification_requests"
  ALTER COLUMN "customer_classification" SET DEFAULT 'B2B';

ALTER TABLE "rfqs"
  ALTER COLUMN "customer_classification" SET DEFAULT 'B2B';

ALTER TABLE "master_orders"
  ALTER COLUMN "customer_classification" SET DEFAULT 'B2B';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_cvr_customer_classification') THEN
    ALTER TABLE "customer_verification_requests"
      ADD CONSTRAINT "chk_cvr_customer_classification"
      CHECK ("customer_classification" IN ('RETAIL', 'B2B', 'B2B_SPECIAL'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rfqs_customer_classification') THEN
    ALTER TABLE "rfqs"
      ADD CONSTRAINT "chk_rfqs_customer_classification"
      CHECK ("customer_classification" IN ('RETAIL', 'B2B', 'B2B_SPECIAL'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_master_orders_customer_classification') THEN
    ALTER TABLE "master_orders"
      ADD CONSTRAINT "chk_master_orders_customer_classification"
      CHECK ("customer_classification" IS NULL OR "customer_classification" IN ('RETAIL', 'B2B', 'B2B_SPECIAL'));
  END IF;
END $$;
