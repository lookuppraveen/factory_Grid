import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsIn,
  IsObject,
  IsArray,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PageableQueryDto } from '../../../common/pagination/pageable.dto';

export const VALID_LIFECYCLE_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED', 'EOL'] as const;

export class CreateCatalogProductDto {
  @ApiPropertyOptional({ example: 'prd_01', description: 'Product database ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  id?: string;

  @ApiPropertyOptional({ example: 'prd_01', description: 'Alias for product database ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  productId?: string;

  @ApiPropertyOptional({ example: 'PRD001099', description: 'Unique central catalog product code' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  productCode?: string;

  @ApiPropertyOptional({ example: 'PRD001099', description: 'Snake-case alias for product code' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  product_code?: string;

  @ApiProperty({ example: 'Amoxicillin 500mg Capsules', description: 'Official product brand/trade name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: 'Amoxicillin 500', description: 'Display short name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  shortName?: string;

  @ApiPropertyOptional({ example: 'Amoxicillin Trihydrate IP', description: 'Product composition / active ingredients' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  composition?: string;

  @ApiPropertyOptional({ example: '650 mg', description: 'Product strength (persisted in product_attributes via STRENGTH Attribute Master)' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  strength?: string;

  @ApiPropertyOptional({ example: 'seg_dist', description: 'Segment ID from Customer Segment Master' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  segmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  segment_id?: string;

  @ApiPropertyOptional({ example: 'Amoxicillin Trihydrate IP', description: 'Generic composition name' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  genericName?: string;

  @ApiPropertyOptional({ example: 'Capsule', description: 'Dosage formulation form' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dosageForm?: string;

  @ApiPropertyOptional({ example: 'IP', description: 'Pharmacopoeial reference standard (e.g. IP, BP, USP)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pharmaReference?: string;

  @ApiPropertyOptional({ example: 'pt_med', description: 'Product type ID from Category Master' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  productTypeId?: string;

  @ApiPropertyOptional({ example: 'CAT005', description: 'Category database record ID' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  categoryId?: string;

  @ApiProperty({ example: 'Drugs', description: 'Level 1 Category name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  category!: string;

  @ApiPropertyOptional({ example: 'Capsules', description: 'Level 2 Sub-Category name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  subCategory?: string;

  @ApiPropertyOptional({ example: 'Hard Gelatin Capsules', description: 'Level 3 Sub-Sub-Category name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  subSubCategory?: string;

  @ApiPropertyOptional({ example: 'Amoxipen', description: 'Brand name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ example: 'brand_01', description: 'Brand ID' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  brandId?: string;

  @ApiPropertyOptional({ example: 'Broad-spectrum antibiotic hard gelatin capsule formulation.', description: 'Product description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 'Unit', description: 'Base unit of measurement' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  baseUom!: string;

  @ApiProperty({ example: '10 x 10 Strip', description: 'Pack packaging size description' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  packSize!: string;

  @ApiPropertyOptional({ example: 'Strip', description: 'Pack packaging unit of measurement' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  packUom?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: VALID_LIFECYCLE_STATUSES, description: 'Product lifecycle status' })
  @IsOptional()
  @IsString()
  @IsIn(VALID_LIFECYCLE_STATUSES)
  lifecycleStatus?: string;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Available from date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  availableFrom?: string;

  @ApiPropertyOptional({ example: '2028-12-31', description: 'Discontinued on date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  discontinuedOn?: string;

  @ApiPropertyOptional({ example: 'PRD001004', description: 'Replacement product ID or code if discontinued' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  replacementProductId?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the product is sellable on platform' })
  @IsOptional()
  @IsBoolean()
  isSellable?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Whether the product is classified as a Generic Medicine' })
  @IsOptional()
  @IsBoolean()
  isGenericMedicine?: boolean;

  @ApiPropertyOptional({ example: 45.5, description: 'Generic Medicine price (required and > 0 when isGenericMedicine is true)' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.01, { message: 'Generic Medicine Price must be greater than 0.' })
  genericMedicinePrice?: number | null;

  @ApiPropertyOptional({ description: 'Category-specific dynamic attribute key-values' })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;

  // Snake-case aliases for API compatibility
  @IsOptional()
  @IsString()
  product_type_id?: string;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsString()
  sub_category?: string;

  @IsOptional()
  @IsString()
  sub_sub_category?: string;

  @IsOptional()
  @IsString()
  generic_name?: string;

  @IsOptional()
  @IsString()
  short_name?: string;

  @IsOptional()
  @IsString()
  dosage_form?: string;

  @IsOptional()
  @IsString()
  pharma_reference?: string;

  @IsOptional()
  @IsString()
  brand_id?: string;

  @IsOptional()
  @IsString()
  base_uom?: string;

  @IsOptional()
  @IsString()
  pack_size?: string;

  @IsOptional()
  @IsString()
  pack_uom?: string;

  @IsOptional()
  @IsString()
  lifecycle_status?: string;

  @IsOptional()
  @IsString()
  available_from?: string;

  @IsOptional()
  @IsString()
  discontinued_on?: string;

  @IsOptional()
  @IsString()
  replacement_product_id?: string;

  @IsOptional()
  @IsBoolean()
  is_sellable?: boolean;

  @IsOptional()
  @IsBoolean()
  is_generic_medicine?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.01, { message: 'Generic Medicine Price must be greater than 0.' })
  generic_medicine_price?: number | null;
}

export class UpdateCatalogProductDto {
  @ApiPropertyOptional({ example: 'PRD001099' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  productCode?: string;

  @ApiPropertyOptional({ example: 'Amoxicillin 500mg Capsules' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'Amoxicillin 500' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  shortName?: string;

  @ApiPropertyOptional({ example: 'Paracetamol', description: 'Product composition / active ingredients' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  composition?: string;

  @ApiPropertyOptional({ example: '650 mg', description: 'Product strength' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  strength?: string;

  @ApiPropertyOptional({ example: 'seg_dist', description: 'Segment ID' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  segmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  segment_id?: string;

  @ApiPropertyOptional({ example: 'Amoxicillin Trihydrate IP' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  genericName?: string;

  @ApiPropertyOptional({ example: 'Capsule' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dosageForm?: string;

  @ApiPropertyOptional({ example: 'IP', description: 'Pharmacopoeial reference standard (e.g. IP, BP, USP)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pharmaReference?: string;

  @IsOptional()
  @IsString()
  pharma_reference?: string;

  @ApiPropertyOptional({ example: 'pt_med' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  productTypeId?: string;

  @ApiPropertyOptional({ example: 'CAT005' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Drugs' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  category?: string;

  @ApiPropertyOptional({ example: 'Capsules' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  subCategory?: string;

  @ApiPropertyOptional({ example: 'Hard Gelatin Capsules' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  subSubCategory?: string;

  @ApiPropertyOptional({ example: 'Amoxipen' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ example: 'brand_01' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  brandId?: string;

  @ApiPropertyOptional({ example: 'Updated product description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'Unit' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  baseUom?: string;

  @ApiPropertyOptional({ example: '10 x 10 Strip' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  packSize?: string;

  @ApiPropertyOptional({ example: 'Strip' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  packUom?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: VALID_LIFECYCLE_STATUSES })
  @IsOptional()
  @IsString()
  @IsIn(VALID_LIFECYCLE_STATUSES)
  lifecycleStatus?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsString()
  availableFrom?: string;

  @ApiPropertyOptional({ example: '2028-12-31' })
  @IsOptional()
  @IsString()
  discontinuedOn?: string;

  @ApiPropertyOptional({ example: 'PRD001004' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  replacementProductId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isSellable?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Whether the product is classified as a Generic Medicine' })
  @IsOptional()
  @IsBoolean()
  isGenericMedicine?: boolean;

  @IsOptional()
  @IsBoolean()
  is_generic_medicine?: boolean;

  @ApiPropertyOptional({ example: 45.5, description: 'Generic Medicine price (required and > 0 when isGenericMedicine is true)' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.01, { message: 'Generic Medicine Price must be greater than 0.' })
  genericMedicinePrice?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.01, { message: 'Generic Medicine Price must be greater than 0.' })
  generic_medicine_price?: number | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;
}

export class ProductQueryDto extends PageableQueryDto {
  @ApiPropertyOptional({ description: 'Filter by category name or ID' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by sub-category' })
  @IsOptional()
  @IsString()
  subCategory?: string;

  @ApiPropertyOptional({ description: 'Filter by sub-sub-category' })
  @IsOptional()
  @IsString()
  subSubCategory?: string;

  @ApiPropertyOptional({ description: 'Filter by product type ID' })
  @IsOptional()
  @IsString()
  productTypeId?: string;

  @ApiPropertyOptional({ description: 'Filter by lifecycle status (ACTIVE, DISCONTINUED, END_OF_LIFE, ALL)' })
  @IsOptional()
  @IsString()
  lifecycleStatus?: string;

  @ApiPropertyOptional({ description: 'Buyer search mode: defaults to ACTIVE products only and excludes DISCONTINUED and END_OF_LIFE' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  buyerView?: boolean;

  @ApiPropertyOptional({ description: 'Only return active products' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Filter by dosage formulation form' })
  @IsOptional()
  @IsString()
  dosageForm?: string;

  @ApiPropertyOptional({ description: 'Filter by Generic Medicine flag (true or false)' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  genericMedicine?: boolean;

  @ApiPropertyOptional({ description: 'Alias for genericMedicine filter' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  isGenericMedicine?: boolean;
}

export class ProductBulkUploadItemDto {
  @ApiPropertyOptional({ description: 'Row index for error reporting' })
  @IsOptional()
  row?: number;

  @ApiPropertyOptional({ description: 'Product Code / SKU', example: 'PRD-AMX-500' })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional({ description: 'Product Name', example: 'Amoxicillin 500mg' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Category Name or ID', example: 'Drugs' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Sub-Category', example: 'Tablets' })
  @IsOptional()
  @IsString()
  subCategory?: string;

  @ApiPropertyOptional({ description: 'Sub-Sub-Category', example: 'Film Coated Tablets' })
  @IsOptional()
  @IsString()
  subSubCategory?: string;

  @ApiPropertyOptional({ description: 'Product Type ID or Code', example: 'pt_med' })
  @IsOptional()
  @IsString()
  productTypeId?: string;

  @ApiPropertyOptional({ description: 'Generic Name / Molecule', example: 'Amoxicillin Trihydrate' })
  @IsOptional()
  @IsString()
  genericName?: string;

  @ApiPropertyOptional({ description: 'Strength', example: '500mg' })
  @IsOptional()
  @IsString()
  strength?: string;

  @ApiPropertyOptional({ description: 'Dosage Form', example: 'Capsule' })
  @IsOptional()
  @IsString()
  dosageForm?: string;

  @ApiPropertyOptional({ description: 'Pharmacopoeia Reference standard (e.g. IP, BP, USP)', example: 'IP' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pharmaReference?: string;

  @IsOptional()
  @IsString()
  pharma_reference?: string;

  @ApiPropertyOptional({ description: 'Pack Size', example: '10 x 10 Strip' })
  @IsOptional()
  @IsString()
  packSize?: string;

  @ApiPropertyOptional({ description: 'Base UOM', example: 'Unit' })
  @IsOptional()
  @IsString()
  baseUom?: string;

  @ApiPropertyOptional({ description: 'Brand Name or ID' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Product Description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ProductBulkUploadDto {
  @ApiProperty({ description: 'List of product rows to upload and validate', type: [ProductBulkUploadItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductBulkUploadItemDto)
  rows!: ProductBulkUploadItemDto[];
}

