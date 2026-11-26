-- AlterTable
ALTER TABLE "catalog_products" ADD COLUMN     "attribute_1" VARCHAR(255),
ADD COLUMN     "attribute_10" VARCHAR(255),
ADD COLUMN     "attribute_11" VARCHAR(255),
ADD COLUMN     "attribute_12" VARCHAR(255),
ADD COLUMN     "attribute_13" VARCHAR(255),
ADD COLUMN     "attribute_14" VARCHAR(255),
ADD COLUMN     "attribute_15" VARCHAR(255),
ADD COLUMN     "attribute_16" VARCHAR(255),
ADD COLUMN     "attribute_17" VARCHAR(255),
ADD COLUMN     "attribute_18" VARCHAR(255),
ADD COLUMN     "attribute_19" VARCHAR(255),
ADD COLUMN     "attribute_2" VARCHAR(255),
ADD COLUMN     "attribute_20" VARCHAR(255),
ADD COLUMN     "attribute_3" VARCHAR(255),
ADD COLUMN     "attribute_4" VARCHAR(255),
ADD COLUMN     "attribute_5" VARCHAR(255),
ADD COLUMN     "attribute_6" VARCHAR(255),
ADD COLUMN     "attribute_7" VARCHAR(255),
ADD COLUMN     "attribute_8" VARCHAR(255),
ADD COLUMN     "attribute_9" VARCHAR(255),
ADD COLUMN     "pharma_reference" VARCHAR(255);

-- CreateTable
CREATE TABLE "manufacturer_sub_category_supplies" (
    "id" BIGSERIAL NOT NULL,
    "registration_id" BIGINT NOT NULL,
    "category" VARCHAR(150) NOT NULL,
    "sub_category" VARCHAR(150) NOT NULL,
    "batch_size" INTEGER NOT NULL,
    "delivery_schedule_days" INTEGER NOT NULL,
    "plant_capacity" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturer_sub_category_supplies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_manufacturer_assignments" (
    "id" BIGSERIAL NOT NULL,
    "rfq_id" BIGINT NOT NULL,
    "manufacturer_id" BIGINT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED',
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewed_at" TIMESTAMPTZ(6),
    "declined_at" TIMESTAMPTZ(6),
    "decline_reason" VARCHAR(255),
    "decline_remarks" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_manufacturer_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" BIGSERIAL NOT NULL,
    "quote_number" VARCHAR(50) NOT NULL,
    "rfq_id" BIGINT NOT NULL,
    "manufacturer_id" BIGINT NOT NULL,
    "assignment_id" BIGINT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valid_until" DATE,
    "delivery_terms" VARCHAR(255),
    "payment_terms" VARCHAR(255),
    "remarks" VARCHAR(1000),
    "submitted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_lines" (
    "id" BIGSERIAL NOT NULL,
    "quote_id" BIGINT NOT NULL,
    "rfq_line_id" BIGINT,
    "product_id" VARCHAR(50),
    "product_name" VARCHAR(250) NOT NULL,
    "response_type" VARCHAR(50) NOT NULL DEFAULT 'QUOTE',
    "quoted_quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "moq" INTEGER NOT NULL DEFAULT 1,
    "lead_time_days" INTEGER NOT NULL DEFAULT 14,
    "tax_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "calculated_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "delivery_terms" VARCHAR(255),
    "cannot_supply_reason" VARCHAR(255),
    "cannot_supply_remarks" VARCHAR(1000),
    "remarks" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flyway_schema_history" (
    "installed_rank" INTEGER NOT NULL,
    "version" VARCHAR(50),
    "description" VARCHAR(200) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "script" VARCHAR(1000) NOT NULL,
    "checksum" INTEGER,
    "installed_by" VARCHAR(100) NOT NULL,
    "installed_on" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "execution_time" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,

    CONSTRAINT "flyway_schema_history_pkey" PRIMARY KEY ("installed_rank")
);

-- CreateTable
CREATE TABLE "master_orders" (
    "id" BIGSERIAL NOT NULL,
    "order_number" VARCHAR(50) NOT NULL,
    "rfq_id" BIGINT,
    "quote_id" BIGINT,
    "buyer_id" BIGINT,
    "buyer_registration_id" BIGINT,
    "customer_name" VARCHAR(250) NOT NULL,
    "customer_code" VARCHAR(50),
    "customer_classification" VARCHAR(50) DEFAULT 'REGULAR',
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_quantity" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING_ADMIN_APPROVAL',
    "admin_approval_status" VARCHAR(50) DEFAULT 'PENDING',
    "advance_required" BOOLEAN NOT NULL DEFAULT false,
    "advance_status" VARCHAR(50) DEFAULT 'NOT_REQUIRED',
    "advance_method" VARCHAR(50) DEFAULT 'PERCENTAGE',
    "advance_percentage" DECIMAL(5,2),
    "advance_amount" DECIMAL(14,2) DEFAULT 0,
    "advance_received" DECIMAL(14,2) DEFAULT 0,
    "advance_outstanding" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "advance_due_date" DATE,
    "advance_notes" TEXT,
    "is_on_hold" BOOLEAN NOT NULL DEFAULT false,
    "hold_reason" TEXT,
    "hold_count" INTEGER NOT NULL DEFAULT 0,
    "hold_placed_at" TIMESTAMPTZ(6),
    "hold_placed_by" VARCHAR(100),
    "admin_approved_at" TIMESTAMPTZ(6),
    "admin_approved_by" VARCHAR(100),
    "admin_rejection_reason" TEXT,
    "payment_terms" VARCHAR(255),
    "order_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_delivery_date" DATE,
    "shipping_address" TEXT,
    "billing_address" TEXT,
    "buyer_gst" VARCHAR(50),
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_orders" (
    "id" BIGSERIAL NOT NULL,
    "sub_order_number" VARCHAR(50) NOT NULL,
    "master_order_id" BIGINT NOT NULL,
    "manufacturer_id" BIGINT NOT NULL,
    "quote_id" BIGINT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'AWAITING_ACCEPTANCE',
    "production_status" VARCHAR(50) DEFAULT 'AWAITING_ACCEPTANCE',
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_quantity" INTEGER NOT NULL DEFAULT 0,
    "lead_time_days" INTEGER NOT NULL DEFAULT 14,
    "delivery_date" DATE,
    "shipping_address" TEXT,
    "billing_address" TEXT,
    "rejection_reason" VARCHAR(255),
    "rejection_remarks" TEXT,
    "accepted_at" TIMESTAMPTZ(6),
    "source_quote_ref" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sub_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_order_lines" (
    "id" BIGSERIAL NOT NULL,
    "sub_order_id" BIGINT NOT NULL,
    "product_id" VARCHAR(50),
    "product_name" VARCHAR(250) NOT NULL,
    "dosage_form" VARCHAR(100),
    "pack_size" VARCHAR(100),
    "quantity" INTEGER NOT NULL,
    "uom" VARCHAR(50) DEFAULT 'Units',
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "lead_time_days" INTEGER DEFAULT 14,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sub_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" BIGSERIAL NOT NULL,
    "po_number" VARCHAR(50) NOT NULL,
    "sub_order_id" BIGINT NOT NULL,
    "master_order_id" BIGINT NOT NULL,
    "manufacturer_id" BIGINT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ISSUED',
    "order_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivery_date" DATE,
    "shipping_address" TEXT,
    "billing_address" TEXT,
    "buyer_name" VARCHAR(250),
    "buyer_gst" VARCHAR(50),
    "mfg_name" VARCHAR(250),
    "mfg_gst" VARCHAR(50),
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_quantity" INTEGER NOT NULL DEFAULT 0,
    "admin_approval_status" VARCHAR(50) DEFAULT 'PENDING',
    "is_on_hold" BOOLEAN NOT NULL DEFAULT false,
    "hold_reason" TEXT,
    "payment_terms" VARCHAR(255),
    "delivery_terms" VARCHAR(255),
    "source_quote_ref" VARCHAR(50),
    "pdf_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_lines" (
    "id" BIGSERIAL NOT NULL,
    "purchase_order_id" BIGINT NOT NULL,
    "product_id" VARCHAR(50),
    "product_name" VARCHAR(250) NOT NULL,
    "dosage_form" VARCHAR(100),
    "quantity" INTEGER NOT NULL,
    "uom" VARCHAR(50) DEFAULT 'Units',
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" BIGSERIAL NOT NULL,
    "sub_order_id" BIGINT,
    "master_order_id" BIGINT,
    "previous_status" VARCHAR(50) NOT NULL,
    "new_status" VARCHAR(50) NOT NULL,
    "changed_by" VARCHAR(100) NOT NULL,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_artwork" (
    "id" BIGSERIAL NOT NULL,
    "master_order_id" BIGINT NOT NULL,
    "sub_order_id" BIGINT,
    "product_id" VARCHAR(100) NOT NULL,
    "product_name" VARCHAR(250),
    "submission_type" VARCHAR(50) NOT NULL DEFAULT 'UPLOAD',
    "file_name" VARCHAR(255),
    "file_type" VARCHAR(100),
    "file_size" VARCHAR(50),
    "file_url" VARCHAR(1000),
    "storage_key" VARCHAR(500),
    "external_url" VARCHAR(1000),
    "instructions" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    "review_notes" TEXT,
    "reviewed_by" VARCHAR(100),
    "reviewed_at" TIMESTAMPTZ(6),
    "uploaded_by_id" BIGINT,
    "uploaded_by_name" VARCHAR(150),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_artwork_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_mfg_sub_cat_reg_id" ON "manufacturer_sub_category_supplies"("registration_id");

-- CreateIndex
CREATE INDEX "idx_mfg_sub_cat_name" ON "manufacturer_sub_category_supplies"("sub_category");

-- CreateIndex
CREATE UNIQUE INDEX "uq_mfg_sub_cat_supply" ON "manufacturer_sub_category_supplies"("registration_id", "sub_category");

-- CreateIndex
CREATE INDEX "idx_rfq_mfr_rfq_id" ON "rfq_manufacturer_assignments"("rfq_id");

-- CreateIndex
CREATE INDEX "idx_rfq_mfr_mfr_id" ON "rfq_manufacturer_assignments"("manufacturer_id");

-- CreateIndex
CREATE INDEX "idx_rfq_mfr_status" ON "rfq_manufacturer_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_rfq_mfr_assignment" ON "rfq_manufacturer_assignments"("rfq_id", "manufacturer_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_quote_number_key" ON "quotes"("quote_number");

-- CreateIndex
CREATE INDEX "idx_quotes_rfq_id" ON "quotes"("rfq_id");

-- CreateIndex
CREATE INDEX "idx_quotes_mfr_id" ON "quotes"("manufacturer_id");

-- CreateIndex
CREATE INDEX "idx_quotes_status" ON "quotes"("status");

-- CreateIndex
CREATE INDEX "idx_quote_lines_quote_id" ON "quote_lines"("quote_id");

-- CreateIndex
CREATE INDEX "idx_quote_lines_rfq_line_id" ON "quote_lines"("rfq_line_id");

-- CreateIndex
CREATE UNIQUE INDEX "master_orders_order_number_key" ON "master_orders"("order_number");

-- CreateIndex
CREATE INDEX "idx_master_orders_rfq_id" ON "master_orders"("rfq_id");

-- CreateIndex
CREATE INDEX "idx_master_orders_buyer_id" ON "master_orders"("buyer_id");

-- CreateIndex
CREATE INDEX "idx_master_orders_status" ON "master_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sub_orders_sub_order_number_key" ON "sub_orders"("sub_order_number");

-- CreateIndex
CREATE INDEX "idx_sub_orders_master_order_id" ON "sub_orders"("master_order_id");

-- CreateIndex
CREATE INDEX "idx_sub_orders_manufacturer_id" ON "sub_orders"("manufacturer_id");

-- CreateIndex
CREATE INDEX "idx_sub_orders_status" ON "sub_orders"("status");

-- CreateIndex
CREATE INDEX "idx_sub_orders_production_status" ON "sub_orders"("production_status");

-- CreateIndex
CREATE INDEX "idx_sub_order_lines_sub_order_id" ON "sub_order_lines"("sub_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_sub_order_id_key" ON "purchase_orders"("sub_order_id");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_sub_order_id" ON "purchase_orders"("sub_order_id");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_mfr_id" ON "purchase_orders"("manufacturer_id");

-- CreateIndex
CREATE INDEX "idx_po_lines_po_id" ON "purchase_order_lines"("purchase_order_id");

-- CreateIndex
CREATE INDEX "idx_order_status_history_sub_order_id" ON "order_status_history"("sub_order_id");

-- CreateIndex
CREATE INDEX "idx_order_artwork_master_order_id" ON "order_artwork"("master_order_id");

-- CreateIndex
CREATE INDEX "idx_order_artwork_sub_order_id" ON "order_artwork"("sub_order_id");

-- CreateIndex
CREATE INDEX "idx_order_artwork_product_id" ON "order_artwork"("product_id");

-- CreateIndex
CREATE INDEX "idx_order_artwork_status" ON "order_artwork"("status");

-- AddForeignKey
ALTER TABLE "manufacturer_sub_category_supplies" ADD CONSTRAINT "manufacturer_sub_category_supplies_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "manufacturer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_manufacturer_assignments" ADD CONSTRAINT "rfq_manufacturer_assignments_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_manufacturer_assignments" ADD CONSTRAINT "rfq_manufacturer_assignments_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "rfq_manufacturer_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_rfq_line_id_fkey" FOREIGN KEY ("rfq_line_id") REFERENCES "rfq_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_orders" ADD CONSTRAINT "master_orders_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_orders" ADD CONSTRAINT "master_orders_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_orders" ADD CONSTRAINT "master_orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_orders" ADD CONSTRAINT "master_orders_buyer_registration_id_fkey" FOREIGN KEY ("buyer_registration_id") REFERENCES "buyer_registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_orders" ADD CONSTRAINT "sub_orders_master_order_id_fkey" FOREIGN KEY ("master_order_id") REFERENCES "master_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_orders" ADD CONSTRAINT "sub_orders_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_orders" ADD CONSTRAINT "sub_orders_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_order_lines" ADD CONSTRAINT "sub_order_lines_sub_order_id_fkey" FOREIGN KEY ("sub_order_id") REFERENCES "sub_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_sub_order_id_fkey" FOREIGN KEY ("sub_order_id") REFERENCES "sub_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_master_order_id_fkey" FOREIGN KEY ("master_order_id") REFERENCES "master_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_sub_order_id_fkey" FOREIGN KEY ("sub_order_id") REFERENCES "sub_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_master_order_id_fkey" FOREIGN KEY ("master_order_id") REFERENCES "master_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_artwork" ADD CONSTRAINT "order_artwork_master_order_id_fkey" FOREIGN KEY ("master_order_id") REFERENCES "master_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_artwork" ADD CONSTRAINT "order_artwork_sub_order_id_fkey" FOREIGN KEY ("sub_order_id") REFERENCES "sub_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_artwork" ADD CONSTRAINT "order_artwork_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
