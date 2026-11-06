const fs = require('fs');
const path = 'backend/apps/factorygrid-api/prisma/schema.prisma';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('model CategoryMarginConfig {')) {
  const models = `
model CategoryMarginConfig {
  id            String    @id @db.VarChar(50)
  categoryId    String    @unique @map("category_id") @db.VarChar(50)
  categoryName  String    @map("category_name") @db.VarChar(150)
  marginMode    String    @default("PERCENTAGE") @map("margin_mode") @db.VarChar(30)
  marginValue   Decimal   @map("margin_value") @db.Decimal(12, 2)
  effectiveFrom DateTime? @map("effective_from") @db.Timestamptz(6)
  effectiveTo   DateTime? @map("effective_to") @db.Timestamptz(6)
  status        String    @default("ACTIVE") @db.VarChar(30)
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  createdBy     String?   @default("Admin") @map("created_by") @db.VarChar(100)
  updatedBy     String?   @default("Admin") @map("updated_by") @db.VarChar(100)

  @@index([categoryId], map: "idx_cat_margin_cat_id")
  @@index([status], map: "idx_cat_margin_status")
  @@map("category_margin_configs")
}

model ManufacturerMarginConfig {
  id               String    @id @db.VarChar(50)
  manufacturerId   String    @unique @map("manufacturer_id") @db.VarChar(50)
  manufacturerName String    @map("manufacturer_name") @db.VarChar(150)
  marginMode       String    @default("PERCENTAGE") @map("margin_mode") @db.VarChar(30)
  marginValue      Decimal   @map("margin_value") @db.Decimal(12, 2)
  effectiveFrom    DateTime? @map("effective_from") @db.Timestamptz(6)
  effectiveTo      DateTime? @map("effective_to") @db.Timestamptz(6)
  status           String    @default("ACTIVE") @db.VarChar(30)
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  createdBy        String?   @default("Admin") @map("created_by") @db.VarChar(100)
  updatedBy        String?   @default("Admin") @map("updated_by") @db.VarChar(100)

  @@index([manufacturerId], map: "idx_mfg_margin_mfg_id")
  @@index([status], map: "idx_mfg_margin_status")
  @@map("manufacturer_margin_configs")
}

model ProductMarginConfig {
  id               String    @id @db.VarChar(50)
  productId        String    @map("product_id") @db.VarChar(50)
  sku              String?   @db.VarChar(100)
  productName      String?   @map("product_name") @db.VarChar(250)
  manufacturerId   String?   @map("manufacturer_id") @db.VarChar(50)
  manufacturerName String?   @map("manufacturer_name") @db.VarChar(150)
  marginMode       String    @default("PERCENTAGE") @map("margin_mode") @db.VarChar(30)
  marginValue      Decimal   @map("margin_value") @db.Decimal(12, 2)
  effectiveFrom    DateTime? @map("effective_from") @db.Timestamptz(6)
  effectiveTo      DateTime? @map("effective_to") @db.Timestamptz(6)
  status           String    @default("ACTIVE") @db.VarChar(30)
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  createdBy        String?   @default("Admin") @map("created_by") @db.VarChar(100)
  updatedBy        String?   @default("Admin") @map("updated_by") @db.VarChar(100)

  @@unique([productId, manufacturerId], map: "uq_product_manufacturer_margin")
  @@index([productId], map: "idx_prod_margin_prod_id")
  @@index([manufacturerId], map: "idx_prod_margin_mfg_id")
  @@index([status], map: "idx_prod_margin_status")
  @@map("product_margin_configs")
}

model PlatformFeeConfig {
  id            String    @id @db.VarChar(50)
  feeMode       String    @default("PERCENTAGE") @map("fee_mode") @db.VarChar(30)
  feeValue      Decimal   @default(2.0) @map("fee_value") @db.Decimal(12, 2)
  feeName       String    @default("Platform Facilitation & Escrow Fee") @map("fee_name") @db.VarChar(150)
  effectiveFrom DateTime? @map("effective_from") @db.Timestamptz(6)
  effectiveTo   DateTime? @map("effective_to") @db.Timestamptz(6)
  status        String    @default("Active") @db.VarChar(30)
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  createdBy     String?   @default("Admin") @map("created_by") @db.VarChar(100)
  updatedBy     String?   @default("Admin") @map("updated_by") @db.VarChar(100)

  @@map("platform_fee_configs")
}
`;
  code += models;
  fs.writeFileSync(path, code, 'utf8');
  console.log('Added Margin Engine models to schema.prisma');
} else {
  console.log('Margin Engine models already exist in schema.prisma');
}

