-- AlterTable: make issue_date and expiry_date optional for manufacturer_documents
ALTER TABLE "manufacturer_documents" ALTER COLUMN "issue_date" DROP NOT NULL;
ALTER TABLE "manufacturer_documents" ALTER COLUMN "expiry_date" DROP NOT NULL;
