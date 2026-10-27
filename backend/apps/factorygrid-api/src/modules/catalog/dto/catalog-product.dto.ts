import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsIn,
  IsObject,
} from 'class-validator';

export const VALID_LIFECYCLE_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED', 'EOL'] as const;

export class CreateCatalogProductDto {
  @ApiProperty({ example: 'PRD001099', description: 'Unique central catalog product code' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  productCode!: string;

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

  @ApiProperty({ example: 'Strip', description: 'Pack packaging unit of measurement' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  packUom!: string;

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

  @ApiPropertyOptional({ description: 'Category-specific dynamic attribute key-values' })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;
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

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;
}

export class ProductQueryDto {
  @ApiPropertyOptional({ description: 'Full-text query across code, name, generic name, category' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category name or ID' })
  @IsOptional()
  @IsString()
  category?: string;

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

  @ApiPropertyOptional({ description: 'Filter by lifecycle status' })
  @IsOptional()
  @IsString()
  lifecycleStatus?: string;

  @ApiPropertyOptional({ description: 'Only return active products' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activeOnly?: boolean;
}
