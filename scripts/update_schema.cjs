const fs = require('fs');
const path = 'backend/apps/factorygrid-api/prisma/schema.prisma';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Brand model if not present
if (!content.includes('model Brand {')) {
  const brandModel = `
model Brand {
  id              String           @id @db.VarChar(50)
  brandId         String           @unique @map("brand_id") @db.VarChar(50)
  brandCode       String           @unique @map("brand_code") @db.VarChar(50)
  brandName       String           @map("brand_name") @db.VarChar(150)
  description     String?          @db.VarChar(500)
  lifecycleStatus String           @default("ACTIVE") @map("lifecycle_status") @db.VarChar(50)
  createdAt       DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime         @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([brandCode], map: "idx_brands_brand_code")
  @@index([brandName], map: "idx_brands_brand_name")
  @@index([lifecycleStatus], map: "idx_brands_lifecycle_status")
  @@map("brands")
}
`;
  content += brandModel;
}

// 2. Add fields to ManufacturerRegistration if not present
if (!content.includes('lifecycleStatus  String                 @default("ACTIVE") @map("lifecycle_status")')) {
  content = content.replace(
    'whoGmpApplicable Boolean                @default(true) @map("who_gmp_applicable")',
    `whoGmpApplicable Boolean                @default(true) @map("who_gmp_applicable")
  description      String?                @db.VarChar(500)
  lifecycleStatus  String                 @default("ACTIVE") @map("lifecycle_status") @db.VarChar(50)
  effectiveFrom    DateTime?              @map("effective_from") @db.Timestamptz(6)
  discontinuedOn   DateTime?              @map("discontinued_on") @db.Timestamptz(6)`
  );
}

fs.writeFileSync(path, content, 'utf8');
console.log('schema.prisma updated successfully.');
