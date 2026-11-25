-- AlterTable: add manufacturer_sub_category_supplies table for Sub-Category level Batch Size, Delivery Schedule, and Plant Capacity
CREATE TABLE IF NOT EXISTS "manufacturer_sub_category_supplies" (
    "id" BIGSERIAL PRIMARY KEY,
    "registration_id" BIGINT NOT NULL,
    "category" VARCHAR(150) NOT NULL,
    "sub_category" VARCHAR(150) NOT NULL,
    "batch_size" INTEGER NOT NULL,
    "delivery_schedule_days" INTEGER NOT NULL,
    "plant_capacity" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "uq_mfg_sub_cat_supply" UNIQUE ("registration_id", "sub_category"),
    CONSTRAINT "fk_mfg_sub_cat_supply_reg" FOREIGN KEY ("registration_id") REFERENCES "manufacturer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_mfg_sub_cat_reg_id" ON "manufacturer_sub_category_supplies"("registration_id");
CREATE INDEX IF NOT EXISTS "idx_mfg_sub_cat_name" ON "manufacturer_sub_category_supplies"("sub_category");
