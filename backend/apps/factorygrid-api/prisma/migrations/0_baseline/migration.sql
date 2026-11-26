-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "user_code" VARCHAR(50) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(30),
    "company_name" VARCHAR(150),
    "company_code" VARCHAR(50),
    "department" VARCHAR(100),
    "job_title" VARCHAR(100),
    "account_status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "account_locked_until" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" BIGSERIAL NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "user_id" BIGINT NOT NULL,
    "expiry_date" TIMESTAMPTZ(6) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

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
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "rejection_reason" VARCHAR(500),
    "reviewed_by" VARCHAR(150),
    "reviewed_at" TIMESTAMPTZ(6),
    "review_decision" VARCHAR(50),
    "version" INTEGER NOT NULL DEFAULT 1,
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

-- CreateTable
CREATE TABLE "catalog_products" (
    "id" VARCHAR(50) NOT NULL,
    "product_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "short_name" VARCHAR(150),
    "generic_name" VARCHAR(250) NOT NULL DEFAULT '',
    "dosage_form" VARCHAR(100) NOT NULL DEFAULT '',
    "product_type_id" VARCHAR(50) DEFAULT 'pt_med',
    "category_id" VARCHAR(50),
    "category" VARCHAR(150) NOT NULL,
    "sub_category" VARCHAR(150),
    "sub_sub_category" VARCHAR(150),
    "brand" VARCHAR(100),
    "brand_id" VARCHAR(50),
    "description" VARCHAR(1000),
    "base_uom" VARCHAR(50) DEFAULT 'Unit',
    "pack_size" VARCHAR(100) NOT NULL,
    "pack_uom" VARCHAR(50) DEFAULT 'Strip',
    "lifecycle_status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "available_from" DATE,
    "discontinued_on" DATE,
    "replacement_product_id" VARCHAR(50),
    "is_sellable" BOOLEAN NOT NULL DEFAULT true,
    "attributes" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalog_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" VARCHAR(50) NOT NULL,
    "category_id" VARCHAR(50) NOT NULL,
    "product_type_id" VARCHAR(50) NOT NULL DEFAULT 'pt_med',
    "category" VARCHAR(150) NOT NULL,
    "sub_category" VARCHAR(150),
    "sub_sub_category" VARCHAR(150),
    "category_code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "lifecycle_status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "display_order" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturer_registrations" (
    "id" BIGSERIAL NOT NULL,
    "registration_code" VARCHAR(50) NOT NULL,
    "user_id" BIGINT,
    "company_name" VARCHAR(150) NOT NULL,
    "facility_address" VARCHAR(500) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(20) NOT NULL,
    "mfg_capacity" VARCHAR(150) NOT NULL,
    "contact_person" VARCHAR(150) NOT NULL,
    "designation" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMPTZ(6),
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by" VARCHAR(150),
    "rejection_reason" VARCHAR(500),
    "manufacturer_code" VARCHAR(50),
    "who_gmp_applicable" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(500),
    "lifecycle_status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "effective_from" TIMESTAMPTZ(6),
    "discontinued_on" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturer_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturer_documents" (
    "id" BIGSERIAL NOT NULL,
    "registration_id" BIGINT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "category_display_name" VARCHAR(100) NOT NULL,
    "document_number" VARCHAR(100),
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "storage_bucket" VARCHAR(100) NOT NULL,
    "issue_date" DATE,
    "expiry_date" DATE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "rejection_reason" VARCHAR(500),
    "admin_remarks" VARCHAR(500),
    "reviewed_by" VARCHAR(150),
    "reviewed_at" TIMESTAMPTZ(6),
    "review_decision" VARCHAR(50),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturer_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturer_products" (
    "id" BIGSERIAL NOT NULL,
    "registration_id" BIGINT NOT NULL,
    "product_id" VARCHAR(50) NOT NULL,
    "manufacturer_product_code" VARCHAR(100),
    "manufacturer_part_number" VARCHAR(100),
    "manufacturer_sku" VARCHAR(100),
    "moq" INTEGER,
    "lead_time_days" INTEGER,
    "lifecycle_status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "effective_from" TIMESTAMPTZ(6),
    "effective_to" TIMESTAMPTZ(6),
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "packaging_details" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturer_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_gallery_entries" (
    "id" BIGSERIAL NOT NULL,
    "registration_id" BIGINT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "storage_bucket" VARCHAR(100) NOT NULL,
    "capture_date" DATE,
    "factory_location" VARCHAR(255) NOT NULL,
    "gps_coordinates" VARCHAR(100),
    "uploaded_by" VARCHAR(150) NOT NULL,
    "verification_status" VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "reviewed_by" VARCHAR(150),
    "reviewed_at" TIMESTAMPTZ(6),
    "rejection_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factory_gallery_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturer_achievements" (
    "id" BIGSERIAL NOT NULL,
    "registration_id" BIGINT NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "award_type" VARCHAR(100) NOT NULL,
    "issuing_organization" VARCHAR(200) NOT NULL,
    "issue_date" DATE NOT NULL,
    "expiry_date" DATE,
    "description" VARCHAR(1000),
    "certificate_file_name" VARCHAR(255),
    "certificate_file_size" BIGINT,
    "certificate_mime_type" VARCHAR(100),
    "certificate_storage_key" VARCHAR(500),
    "certificate_storage_bucket" VARCHAR(100),
    "verification_status" VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "reviewed_by" VARCHAR(150),
    "reviewed_at" TIMESTAMPTZ(6),
    "rejection_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturer_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_brand_documents" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "registration_id" BIGINT,
    "brand_name" VARCHAR(150) NOT NULL,
    "brand_reference" VARCHAR(100),
    "document_type" VARCHAR(100) NOT NULL,
    "document_number" VARCHAR(100),
    "dosage_form" VARCHAR(150),
    "tm_registration_no" VARCHAR(100),
    "issue_date" DATE,
    "expiry_date" DATE,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "storage_bucket" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'UNDER REVIEW',
    "checks" JSONB,
    "rejection_reason" VARCHAR(500),
    "auth_notes" VARCHAR(1000),
    "reviewed_by" VARCHAR(150),
    "reviewed_at" TIMESTAMPTZ(6),
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_brand_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_trademark_documents" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "registration_id" BIGINT,
    "trademark_name" VARCHAR(150) NOT NULL,
    "tm_number" VARCHAR(100) NOT NULL,
    "tm_class" VARCHAR(150) NOT NULL DEFAULT 'Class 5 (Pharmaceuticals & Medicinal Preparations)',
    "document_type" VARCHAR(100) NOT NULL,
    "verification_source" VARCHAR(100) NOT NULL DEFAULT 'Customer Uploaded TM Certificate',
    "issue_date" DATE,
    "expiry_date" DATE,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "storage_bucket" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'UNDER REVIEW',
    "checks" JSONB,
    "conflict_notes" VARCHAR(1000),
    "rejection_reason" VARCHAR(500),
    "reviewed_by" VARCHAR(150),
    "reviewed_at" TIMESTAMPTZ(6),
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_trademark_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfqs" (
    "id" BIGSERIAL NOT NULL,
    "rfq_number" VARCHAR(50) NOT NULL,
    "user_id" BIGINT NOT NULL,
    "buyer_registration_id" BIGINT,
    "buyer_name" VARCHAR(150) NOT NULL,
    "company_name" VARCHAR(150) NOT NULL,
    "customer_code" VARCHAR(50) NOT NULL,
    "customer_classification" VARCHAR(50) NOT NULL DEFAULT 'REGULAR',
    "status" VARCHAR(50) NOT NULL DEFAULT 'Draft',
    "priority" VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    "delivery_location" VARCHAR(500) NOT NULL,
    "rfq_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "required_date" DATE,
    "deadline_date" DATE,
    "remarks" VARCHAR(1000),
    "credit_required" BOOLEAN NOT NULL DEFAULT false,
    "credit_terms" VARCHAR(255),
    "is_generic" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_lines" (
    "id" BIGSERIAL NOT NULL,
    "rfq_id" BIGINT NOT NULL,
    "line_item_number" INTEGER NOT NULL DEFAULT 1,
    "product_id" VARCHAR(50),
    "product_name" VARCHAR(250) NOT NULL,
    "product_code" VARCHAR(50),
    "category" VARCHAR(150),
    "sub_category" VARCHAR(150),
    "sub_sub_category" VARCHAR(150),
    "product_type" VARCHAR(50) NOT NULL DEFAULT 'BRANDED',
    "dosage_form" VARCHAR(100),
    "pack_size" VARCHAR(100),
    "uom" VARCHAR(50) NOT NULL DEFAULT 'Units',
    "quantity" INTEGER NOT NULL,
    "target_price" DECIMAL(12,2),
    "required_date" DATE,
    "remarks" VARCHAR(500),
    "molecule" VARCHAR(250),
    "strength" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_masters" (
    "id" VARCHAR(50) NOT NULL,
    "attribute_code" VARCHAR(50) NOT NULL,
    "attribute_name" VARCHAR(150) NOT NULL,
    "data_type" VARCHAR(30) NOT NULL DEFAULT 'TEXT',
    "unit_of_measure" VARCHAR(50),
    "remark" VARCHAR(500),
    "allowed_values" JSONB,
    "is_filterable" BOOLEAN NOT NULL DEFAULT true,
    "is_searchable" BOOLEAN NOT NULL DEFAULT true,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attribute_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_attributes" (
    "id" BIGSERIAL NOT NULL,
    "category_id" VARCHAR(50) NOT NULL,
    "attribute_id" VARCHAR(50) NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 1,
    "remark" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_type_attributes" (
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

-- CreateTable
CREATE TABLE "product_attributes" (
    "id" BIGSERIAL NOT NULL,
    "product_id" VARCHAR(50) NOT NULL,
    "attribute_id" VARCHAR(50) NOT NULL,
    "attribute_value" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_prices" (
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

-- CreateTable
CREATE TABLE "product_types" (
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

-- CreateTable
CREATE TABLE "customer_segments" (
    "id" VARCHAR(50) NOT NULL,
    "segment_code" VARCHAR(50) NOT NULL,
    "segment_name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(500),
    "lifecycle_status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_taxes" (
    "id" BIGSERIAL NOT NULL,
    "product_id" VARCHAR(50) NOT NULL,
    "tax_code" VARCHAR(50) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "effective_from" DATE,
    "effective_to" DATE,
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_uoms" (
    "id" BIGSERIAL NOT NULL,
    "product_id" VARCHAR(50) NOT NULL,
    "uom" VARCHAR(50) NOT NULL,
    "conversion_factor" DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
    "is_base_uom" BOOLEAN NOT NULL DEFAULT false,
    "is_order_uom" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_uoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" VARCHAR(50) NOT NULL,
    "brand_id" VARCHAR(50) NOT NULL,
    "brand_code" VARCHAR(50) NOT NULL,
    "brand_name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(500),
    "lifecycle_status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_margin_configs" (
    "id" VARCHAR(50) NOT NULL,
    "category_id" VARCHAR(50) NOT NULL,
    "category_name" VARCHAR(150) NOT NULL,
    "margin_mode" VARCHAR(30) NOT NULL DEFAULT 'PERCENTAGE',
    "margin_value" DECIMAL(12,2) NOT NULL,
    "effective_from" TIMESTAMPTZ(6),
    "effective_to" TIMESTAMPTZ(6),
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100) DEFAULT 'Admin',
    "updated_by" VARCHAR(100) DEFAULT 'Admin',

    CONSTRAINT "category_margin_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturer_margin_configs" (
    "id" VARCHAR(50) NOT NULL,
    "manufacturer_id" VARCHAR(50) NOT NULL,
    "manufacturer_name" VARCHAR(150) NOT NULL,
    "margin_mode" VARCHAR(30) NOT NULL DEFAULT 'PERCENTAGE',
    "margin_value" DECIMAL(12,2) NOT NULL,
    "effective_from" TIMESTAMPTZ(6),
    "effective_to" TIMESTAMPTZ(6),
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100) DEFAULT 'Admin',
    "updated_by" VARCHAR(100) DEFAULT 'Admin',

    CONSTRAINT "manufacturer_margin_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_margin_configs" (
    "id" VARCHAR(50) NOT NULL,
    "product_id" VARCHAR(50) NOT NULL,
    "sku" VARCHAR(100),
    "product_name" VARCHAR(250),
    "manufacturer_id" VARCHAR(50),
    "manufacturer_name" VARCHAR(150),
    "margin_mode" VARCHAR(30) NOT NULL DEFAULT 'PERCENTAGE',
    "margin_value" DECIMAL(12,2) NOT NULL,
    "effective_from" TIMESTAMPTZ(6),
    "effective_to" TIMESTAMPTZ(6),
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100) DEFAULT 'Admin',
    "updated_by" VARCHAR(100) DEFAULT 'Admin',

    CONSTRAINT "product_margin_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_fee_configs" (
    "id" VARCHAR(50) NOT NULL,
    "fee_mode" VARCHAR(30) NOT NULL DEFAULT 'PERCENTAGE',
    "fee_value" DECIMAL(12,2) NOT NULL DEFAULT 2.0,
    "fee_name" VARCHAR(150) NOT NULL DEFAULT 'Platform Facilitation & Escrow Fee',
    "effective_from" TIMESTAMPTZ(6),
    "effective_to" TIMESTAMPTZ(6),
    "status" VARCHAR(30) NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100) DEFAULT 'Admin',
    "updated_by" VARCHAR(100) DEFAULT 'Admin',

    CONSTRAINT "platform_fee_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "idx_roles_name" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_code_key" ON "users"("user_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_username" ON "users"("username");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_user_code" ON "users"("user_code");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_token" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens"("user_id");

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

-- CreateIndex
CREATE UNIQUE INDEX "catalog_products_product_code_key" ON "catalog_products"("product_code");

-- CreateIndex
CREATE INDEX "idx_catalog_products_category" ON "catalog_products"("category");

-- CreateIndex
CREATE INDEX "idx_catalog_products_category_id" ON "catalog_products"("category_id");

-- CreateIndex
CREATE INDEX "idx_catalog_products_product_type_id" ON "catalog_products"("product_type_id");

-- CreateIndex
CREATE INDEX "idx_catalog_products_lifecycle_status" ON "catalog_products"("lifecycle_status");

-- CreateIndex
CREATE UNIQUE INDEX "categories_category_id_key" ON "categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_category_code_key" ON "categories"("category_code");

-- CreateIndex
CREATE INDEX "idx_categories_category" ON "categories"("category");

-- CreateIndex
CREATE INDEX "idx_categories_sub_category" ON "categories"("sub_category");

-- CreateIndex
CREATE INDEX "idx_categories_product_type_id" ON "categories"("product_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturer_registrations_registration_code_key" ON "manufacturer_registrations"("registration_code");

-- CreateIndex
CREATE INDEX "idx_mfg_reg_user_id" ON "manufacturer_registrations"("user_id");

-- CreateIndex
CREATE INDEX "idx_mfg_reg_email" ON "manufacturer_registrations"("email");

-- CreateIndex
CREATE INDEX "idx_mfg_reg_status" ON "manufacturer_registrations"("status");

-- CreateIndex
CREATE INDEX "idx_mfg_doc_registration_id" ON "manufacturer_documents"("registration_id");

-- CreateIndex
CREATE INDEX "idx_mfg_doc_category" ON "manufacturer_documents"("category");

-- CreateIndex
CREATE UNIQUE INDEX "uq_mfg_product_registration_product" ON "manufacturer_products"("registration_id", "product_id");

-- CreateIndex
CREATE INDEX "idx_mfg_gallery_reg_id" ON "factory_gallery_entries"("registration_id");

-- CreateIndex
CREATE INDEX "idx_mfg_gallery_status" ON "factory_gallery_entries"("verification_status");

-- CreateIndex
CREATE INDEX "idx_mfg_achieve_reg_id" ON "manufacturer_achievements"("registration_id");

-- CreateIndex
CREATE INDEX "idx_mfg_achieve_status" ON "manufacturer_achievements"("verification_status");

-- CreateIndex
CREATE INDEX "idx_mfg_achieve_type" ON "manufacturer_achievements"("award_type");

-- CreateIndex
CREATE INDEX "idx_buyer_brand_doc_user_id" ON "buyer_brand_documents"("user_id");

-- CreateIndex
CREATE INDEX "idx_buyer_brand_doc_reg_id" ON "buyer_brand_documents"("registration_id");

-- CreateIndex
CREATE INDEX "idx_buyer_brand_doc_status" ON "buyer_brand_documents"("status");

-- CreateIndex
CREATE INDEX "idx_buyer_brand_doc_name" ON "buyer_brand_documents"("brand_name");

-- CreateIndex
CREATE INDEX "idx_buyer_tm_doc_user_id" ON "buyer_trademark_documents"("user_id");

-- CreateIndex
CREATE INDEX "idx_buyer_tm_doc_reg_id" ON "buyer_trademark_documents"("registration_id");

-- CreateIndex
CREATE INDEX "idx_buyer_tm_doc_status" ON "buyer_trademark_documents"("status");

-- CreateIndex
CREATE INDEX "idx_buyer_tm_doc_name" ON "buyer_trademark_documents"("trademark_name");

-- CreateIndex
CREATE UNIQUE INDEX "rfqs_rfq_number_key" ON "rfqs"("rfq_number");

-- CreateIndex
CREATE INDEX "idx_rfqs_user_id" ON "rfqs"("user_id");

-- CreateIndex
CREATE INDEX "idx_rfqs_buyer_reg_id" ON "rfqs"("buyer_registration_id");

-- CreateIndex
CREATE INDEX "idx_rfqs_status" ON "rfqs"("status");

-- CreateIndex
CREATE INDEX "idx_rfqs_rfq_number" ON "rfqs"("rfq_number");

-- CreateIndex
CREATE INDEX "idx_rfq_lines_rfq_id" ON "rfq_lines"("rfq_id");

-- CreateIndex
CREATE INDEX "idx_rfq_lines_product_id" ON "rfq_lines"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_masters_attribute_code_key" ON "attribute_masters"("attribute_code");

-- CreateIndex
CREATE INDEX "idx_attr_masters_code" ON "attribute_masters"("attribute_code");

-- CreateIndex
CREATE INDEX "idx_attr_masters_active" ON "attribute_masters"("is_active");

-- CreateIndex
CREATE INDEX "idx_cat_attr_category_id" ON "category_attributes"("category_id");

-- CreateIndex
CREATE INDEX "idx_cat_attr_attribute_id" ON "category_attributes"("attribute_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_category_attribute" ON "category_attributes"("category_id", "attribute_id");

-- CreateIndex
CREATE INDEX "idx_pta_product_type_id" ON "product_type_attributes"("product_type_id");

-- CreateIndex
CREATE INDEX "idx_pta_attribute_id" ON "product_type_attributes"("attribute_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_product_type_attribute" ON "product_type_attributes"("product_type_id", "attribute_id");

-- CreateIndex
CREATE INDEX "idx_prod_attr_product_id" ON "product_attributes"("product_id");

-- CreateIndex
CREATE INDEX "idx_prod_attr_attribute_id" ON "product_attributes"("attribute_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_product_attribute" ON "product_attributes"("product_id", "attribute_id");

-- CreateIndex
CREATE INDEX "idx_prod_prices_product_id" ON "product_prices"("product_id");

-- CreateIndex
CREATE INDEX "idx_prod_prices_mfg_id" ON "product_prices"("product_manufacturer_id");

-- CreateIndex
CREATE INDEX "idx_prod_prices_cust_seg_id" ON "product_prices"("customer_segment_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_types_product_type_code_key" ON "product_types"("product_type_code");

-- CreateIndex
CREATE INDEX "idx_product_types_code" ON "product_types"("product_type_code");

-- CreateIndex
CREATE INDEX "idx_product_types_status" ON "product_types"("lifecycle_status");

-- CreateIndex
CREATE UNIQUE INDEX "customer_segments_segment_code_key" ON "customer_segments"("segment_code");

-- CreateIndex
CREATE INDEX "idx_cust_seg_code" ON "customer_segments"("segment_code");

-- CreateIndex
CREATE INDEX "idx_cust_seg_status" ON "customer_segments"("lifecycle_status");

-- CreateIndex
CREATE INDEX "idx_prod_taxes_product_id" ON "product_taxes"("product_id");

-- CreateIndex
CREATE INDEX "idx_prod_taxes_status" ON "product_taxes"("status");

-- CreateIndex
CREATE INDEX "idx_prod_uoms_product_id" ON "product_uoms"("product_id");

-- CreateIndex
CREATE INDEX "idx_prod_uoms_active" ON "product_uoms"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "uq_product_uom" ON "product_uoms"("product_id", "uom");

-- CreateIndex
CREATE UNIQUE INDEX "brands_brand_id_key" ON "brands"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "brands_brand_code_key" ON "brands"("brand_code");

-- CreateIndex
CREATE INDEX "idx_brands_brand_code" ON "brands"("brand_code");

-- CreateIndex
CREATE INDEX "idx_brands_brand_name" ON "brands"("brand_name");

-- CreateIndex
CREATE INDEX "idx_brands_lifecycle_status" ON "brands"("lifecycle_status");

-- CreateIndex
CREATE UNIQUE INDEX "category_margin_configs_category_id_key" ON "category_margin_configs"("category_id");

-- CreateIndex
CREATE INDEX "idx_cat_margin_cat_id" ON "category_margin_configs"("category_id");

-- CreateIndex
CREATE INDEX "idx_cat_margin_status" ON "category_margin_configs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturer_margin_configs_manufacturer_id_key" ON "manufacturer_margin_configs"("manufacturer_id");

-- CreateIndex
CREATE INDEX "idx_mfg_margin_mfg_id" ON "manufacturer_margin_configs"("manufacturer_id");

-- CreateIndex
CREATE INDEX "idx_mfg_margin_status" ON "manufacturer_margin_configs"("status");

-- CreateIndex
CREATE INDEX "idx_prod_margin_prod_id" ON "product_margin_configs"("product_id");

-- CreateIndex
CREATE INDEX "idx_prod_margin_mfg_id" ON "product_margin_configs"("manufacturer_id");

-- CreateIndex
CREATE INDEX "idx_prod_margin_status" ON "product_margin_configs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_product_manufacturer_margin" ON "product_margin_configs"("product_id", "manufacturer_id");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buyer_registrations" ADD CONSTRAINT "buyer_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_documents" ADD CONSTRAINT "buyer_documents_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "buyer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_verification_requests" ADD CONSTRAINT "customer_verification_requests_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "buyer_registrations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_verification_requests" ADD CONSTRAINT "customer_verification_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "manufacturer_registrations" ADD CONSTRAINT "manufacturer_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturer_documents" ADD CONSTRAINT "manufacturer_documents_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "manufacturer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturer_products" ADD CONSTRAINT "manufacturer_products_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "manufacturer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturer_products" ADD CONSTRAINT "manufacturer_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory_gallery_entries" ADD CONSTRAINT "factory_gallery_entries_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "manufacturer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturer_achievements" ADD CONSTRAINT "manufacturer_achievements_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "manufacturer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_brand_documents" ADD CONSTRAINT "buyer_brand_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_brand_documents" ADD CONSTRAINT "buyer_brand_documents_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "buyer_registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_trademark_documents" ADD CONSTRAINT "buyer_trademark_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_trademark_documents" ADD CONSTRAINT "buyer_trademark_documents_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "buyer_registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_buyer_registration_id_fkey" FOREIGN KEY ("buyer_registration_id") REFERENCES "buyer_registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_lines" ADD CONSTRAINT "rfq_lines_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_lines" ADD CONSTRAINT "rfq_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_type_attributes" ADD CONSTRAINT "product_type_attributes_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_type_attributes" ADD CONSTRAINT "product_type_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_manufacturer_id_fkey" FOREIGN KEY ("product_manufacturer_id") REFERENCES "manufacturer_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_customer_segment_id_fkey" FOREIGN KEY ("customer_segment_id") REFERENCES "customer_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_taxes" ADD CONSTRAINT "product_taxes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_uoms" ADD CONSTRAINT "product_uoms_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

