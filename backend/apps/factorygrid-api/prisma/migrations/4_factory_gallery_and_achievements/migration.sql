-- Add Factory Gallery Entries and Manufacturer Achievements & Awards tables

CREATE TABLE IF NOT EXISTS "factory_gallery_entries" (
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

CREATE INDEX IF NOT EXISTS "idx_mfg_gallery_reg_id" ON "factory_gallery_entries"("registration_id");
CREATE INDEX IF NOT EXISTS "idx_mfg_gallery_status" ON "factory_gallery_entries"("verification_status");
ALTER TABLE "factory_gallery_entries" ADD CONSTRAINT "factory_gallery_entries_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "manufacturer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "manufacturer_achievements" (
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

CREATE INDEX IF NOT EXISTS "idx_mfg_achieve_reg_id" ON "manufacturer_achievements"("registration_id");
CREATE INDEX IF NOT EXISTS "idx_mfg_achieve_status" ON "manufacturer_achievements"("verification_status");
CREATE INDEX IF NOT EXISTS "idx_mfg_achieve_type" ON "manufacturer_achievements"("award_type");
ALTER TABLE "manufacturer_achievements" ADD CONSTRAINT "manufacturer_achievements_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "manufacturer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
