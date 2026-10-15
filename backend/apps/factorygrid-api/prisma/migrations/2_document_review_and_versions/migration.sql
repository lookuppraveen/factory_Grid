-- AlterTable
ALTER TABLE "buyer_documents" ADD COLUMN IF NOT EXISTS "rejection_reason" VARCHAR(500);
ALTER TABLE "buyer_documents" ADD COLUMN IF NOT EXISTS "reviewed_by" VARCHAR(150);
ALTER TABLE "buyer_documents" ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMPTZ(6);
ALTER TABLE "buyer_documents" ADD COLUMN IF NOT EXISTS "review_decision" VARCHAR(50);
ALTER TABLE "buyer_documents" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
