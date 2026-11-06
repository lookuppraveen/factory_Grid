import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateManufacturerProductDto {
  @ApiPropertyOptional({ description: 'ID of existing product in master catalogue (if mapping existing product)' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Product Name (if creating a new formulation)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Product Code / SKU' })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional({ description: 'Category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Sub-Category' })
  @IsOptional()
  @IsString()
  subCategory?: string;

  @ApiPropertyOptional({ description: 'Sub-Sub-Category' })
  @IsOptional()
  @IsString()
  subSubCategory?: string;

  @ApiPropertyOptional({ description: 'Generic Name' })
  @IsOptional()
  @IsString()
  genericName?: string;

  @ApiPropertyOptional({ description: 'Salt Combination / Composition' })
  @IsOptional()
  @IsString()
  saltCombination?: string;

  @ApiPropertyOptional({ description: 'Strength' })
  @IsOptional()
  @IsString()
  strength?: string;

  @ApiPropertyOptional({ description: 'Dosage Form' })
  @IsOptional()
  @IsString()
  dosageForm?: string;

  @ApiPropertyOptional({ description: 'Packaging / Pack Size' })
  @IsOptional()
  @IsString()
  packSize?: string;

  @ApiPropertyOptional({ description: 'Base UOM' })
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiPropertyOptional({ description: 'Base UOM' })
  @IsOptional()
  @IsString()
  baseUom?: string;

  @ApiPropertyOptional({ description: 'Product Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Product Type ID (defaults to pt_med)' })
  @IsOptional()
  @IsString()
  productTypeId?: string;

  @ApiPropertyOptional({ description: 'Manufacturer proprietary product code / catalog reference' })
  @IsOptional()
  @IsString()
  manufacturerProductCode?: string;

  @ApiPropertyOptional({ description: 'Manufacturer part number (MPN)' })
  @IsOptional()
  @IsString()
  manufacturerPartNumber?: string;

  @ApiPropertyOptional({ description: 'Manufacturer inventory SKU' })
  @IsOptional()
  @IsString()
  manufacturerSku?: string;

  @ApiPropertyOptional({ description: 'Minimum Order Quantity', default: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moq?: number;

  @ApiPropertyOptional({ description: 'Production & dispatch lead time in days', default: 14 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Packaging and transport configuration details' })
  @IsOptional()
  @IsString()
  packagingDetails?: string;

  @ApiPropertyOptional({ description: 'Effective start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective expiry date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;

  @ApiPropertyOptional({ description: 'Whether this facility is the preferred manufacturer for this product', default: false })
  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;

  @ApiPropertyOptional({ description: 'Lifecycle status', enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  lifecycleStatus?: 'ACTIVE' | 'INACTIVE';
}

export class UpdateManufacturerProductDto {
  @ApiPropertyOptional({ description: 'Manufacturer proprietary product code / catalog reference' })
  @IsOptional()
  @IsString()
  manufacturerProductCode?: string;

  @ApiPropertyOptional({ description: 'Manufacturer part number (MPN)' })
  @IsOptional()
  @IsString()
  manufacturerPartNumber?: string;

  @ApiPropertyOptional({ description: 'Manufacturer inventory SKU' })
  @IsOptional()
  @IsString()
  manufacturerSku?: string;

  @ApiPropertyOptional({ description: 'Minimum Order Quantity' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moq?: number;

  @ApiPropertyOptional({ description: 'Production & dispatch lead time in days' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Packaging and transport configuration details' })
  @IsOptional()
  @IsString()
  packagingDetails?: string;

  @ApiPropertyOptional({ description: 'Effective start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective expiry date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;

  @ApiPropertyOptional({ description: 'Whether this facility is the preferred manufacturer for this product' })
  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;

  @ApiPropertyOptional({ description: 'Lifecycle status', enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  lifecycleStatus?: 'ACTIVE' | 'INACTIVE';
}

export class UpdateManufacturerProductStatusDto {
  @ApiProperty({ description: 'Target lifecycle status', enum: ['ACTIVE', 'INACTIVE'] })
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status!: 'ACTIVE' | 'INACTIVE';
}

export class ManufacturerProductQueryDto {
  @ApiPropertyOptional({ description: 'Search term across name, code, composition, SKU' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
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

  @ApiPropertyOptional({ description: 'Filter by lifecycle status (ACTIVE, INACTIVE, ALL)', default: 'ALL' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Page size limit', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class ManufacturerProductBulkUploadItemDto {
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

  @ApiPropertyOptional({ description: 'Category Name', example: 'Drugs' })
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

  @ApiPropertyOptional({ description: 'Product Type ID', default: 'pt_med' })
  @IsOptional()
  @IsString()
  productTypeId?: string;

  @ApiPropertyOptional({ description: 'Generic Molecule / Active Ingredient' })
  @IsOptional()
  @IsString()
  genericName?: string;

  @ApiPropertyOptional({ description: 'Dosage Form' })
  @IsOptional()
  @IsString()
  dosageForm?: string;

  @ApiPropertyOptional({ description: 'Strength' })
  @IsOptional()
  @IsString()
  strength?: string;

  @ApiPropertyOptional({ description: 'Pack Size' })
  @IsOptional()
  @IsString()
  packSize?: string;

  @ApiPropertyOptional({ description: 'Base UOM' })
  @IsOptional()
  @IsString()
  baseUom?: string;

  @ApiPropertyOptional({ description: 'Manufacturer proprietary product code / catalog reference' })
  @IsOptional()
  @IsString()
  manufacturerProductCode?: string;

  @ApiPropertyOptional({ description: 'Minimum Order Quantity', default: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moq?: number;

  @ApiPropertyOptional({ description: 'Production & dispatch lead time in days', default: 14 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Packaging and transport configuration details' })
  @IsOptional()
  @IsString()
  packagingDetails?: string;

  @ApiPropertyOptional({ description: 'Product Description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ManufacturerProductBulkUploadDto {
  @ApiProperty({ description: 'Rows to bulk map and create', type: [ManufacturerProductBulkUploadItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManufacturerProductBulkUploadItemDto)
  rows!: ManufacturerProductBulkUploadItemDto[];
}

