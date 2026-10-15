-- CreateTable
CREATE TABLE "buyer_registrations" (
    "id" BIGSERIAL NOT NULL,
    "registration_code" VARCHAR(50) NOT NULL,
    "user_id" BIGINT,
    "company_name" VARCHAR(150) NOT NULL,
    "business_type" VARCHAR(100) NOT NULL,
    "gst_number" VARCHAR(30) NOT NULL,
    "pan_number" VARCHAR(30) NOT NULL,
    "drug_license_number" VARCHAR(100) NOT NULL,
    "cin_number" VARCHAR(50),
    "website" VARCHAR(255),
    "contact_person" VARCHAR(150) NOT NULL,
    "designation" VARCHAR(100) NOT NULL,
    "mobile_number" VARCHAR(30) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "billing_address" VARCHAR(500) NOT NULL,
    "shipping_address" VARCHAR(500) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL DEFAULT 'India',
    "pincode" VARCHAR(20) NOT NULL,
    "customer_type_details" JSONB,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMPTZ(6),
    "reviewed_at" TIMESTAMPTZ(6),
    "assigned_officer" VARCHAR(150),
    "auto_validation" JSONB,
    "rejection_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_documents" (
    "id" BIGSERIAL NOT NULL,
    "registration_id" BIGINT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "category_display_name" VARCHAR(100) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "storage_bucket" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'VALID',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_verification_requests" (
    "id" BIGSERIAL NOT NULL,
    "request_code" VARCHAR(50) NOT NULL,
    "registration_id" BIGINT,
    "user_id" BIGINT,
    "customer_name" VARCHAR(150) NOT NULL,
    "company_name" VARCHAR(150) NOT NULL,
    "customer_type" VARCHAR(50) NOT NULL,
    "customer_classification" VARCHAR(50) NOT NULL DEFAULT 'REGULAR',
    "verification_status" VARCHAR(50) NOT NULL DEFAULT 'Under Review',
    "assigned_compliance_officer" VARCHAR(150),
    "gst_number" VARCHAR(30) NOT NULL,
    "pan_number" VARCHAR(20) NOT NULL,
    "drug_license_number" VARCHAR(50) NOT NULL,
    "cin_number" VARCHAR(50),
    "website" VARCHAR(255),
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "contact_person" VARCHAR(150) NOT NULL,
    "designation" VARCHAR(100) NOT NULL,
    "billing_address" TEXT NOT NULL,
    "shipping_address" TEXT NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL DEFAULT 'India',
    "pincode" VARCHAR(20) NOT NULL,
    "customer_type_details" JSONB,
    "auto_validation" JSONB NOT NULL,
    "business_verification" JSONB,
    "regulatory_verification" JSONB,
    "financial_verification" JSONB,
    "requested_documents_notes" JSONB,
    "rejection_reason" TEXT,
    "review_notes" JSONB,
    "customer_code" VARCHAR(50),
    "portal_login_created" BOOLEAN NOT NULL DEFAULT false,
    "portal_username" VARCHAR(100),
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "buyer_registrations_registration_code_key" ON "buyer_registrations"("registration_code");

-- CreateIndex
CREATE INDEX "idx_buyer_reg_email" ON "buyer_registrations"("email");

-- CreateIndex
CREATE INDEX "idx_buyer_reg_gst" ON "buyer_registrations"("gst_number");

-- CreateIndex
CREATE INDEX "idx_buyer_reg_pan" ON "buyer_registrations"("pan_number");

-- CreateIndex
CREATE INDEX "idx_buyer_reg_user_id" ON "buyer_registrations"("user_id");

-- CreateIndex
CREATE INDEX "idx_buyer_reg_code" ON "buyer_registrations"("registration_code");

-- CreateIndex
CREATE INDEX "idx_buyer_reg_status" ON "buyer_registrations"("status");

-- CreateIndex
CREATE INDEX "idx_buyer_doc_category" ON "buyer_documents"("category");

-- CreateIndex
CREATE INDEX "idx_buyer_doc_registration_id" ON "buyer_documents"("registration_id");

-- CreateIndex
CREATE INDEX "idx_buyer_doc_storage_key" ON "buyer_documents"("storage_key");

-- CreateIndex
CREATE UNIQUE INDEX "customer_verification_requests_request_code_key" ON "customer_verification_requests"("request_code");

-- AddForeignKey
ALTER TABLE "buyer_registrations" ADD CONSTRAINT "buyer_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_documents" ADD CONSTRAINT "buyer_documents_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "buyer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_verification_requests" ADD CONSTRAINT "customer_verification_requests_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "buyer_registrations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_verification_requests" ADD CONSTRAINT "customer_verification_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

