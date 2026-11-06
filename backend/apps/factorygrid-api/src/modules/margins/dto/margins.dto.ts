import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export enum MarginModeEnum {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_RATE = 'FIXED_RATE',
}

// =====================================================================
// QUERY DTO
// =====================================================================

export class MarginQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Category ID or Name' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by Manufacturer ID' })
  @IsOptional()
  @IsString()
  manufacturerId?: string;

  @ApiPropertyOptional({ description: 'Filter by Product ID or SKU' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by Status: ACTIVE or INACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Search term for name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 50;
}

// =====================================================================
// CATEGORY MARGIN DTO
// =====================================================================

export class SetCategoryMarginDto {
  @ApiPropertyOptional({ description: 'Category ID (optional if provided in route path)' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Category Name (optional)' })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiProperty({
    description: 'Margin mode: PERCENTAGE or FIXED_RATE',
    enum: MarginModeEnum,
    example: MarginModeEnum.PERCENTAGE,
  })
  @IsNotEmpty()
  @IsIn(['PERCENTAGE', 'FIXED_RATE'])
  marginMode!: string;

  @ApiProperty({ description: 'Margin value (percentage or fixed amount in currency)', example: 12.5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  marginValue!: number;

  @ApiPropertyOptional({ description: 'Effective From ISO date/time' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective To ISO date/time' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;

  @ApiPropertyOptional({ description: 'Status: ACTIVE or INACTIVE', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string = 'ACTIVE';
}

// =====================================================================
// MANUFACTURER MARGIN DTO
// =====================================================================

export class SetManufacturerMarginDto {
  @ApiPropertyOptional({ description: 'Manufacturer Registration ID' })
  @IsOptional()
  @IsString()
  manufacturerId?: string;

  @ApiPropertyOptional({ description: 'Manufacturer Company or Brand Name' })
  @IsOptional()
  @IsString()
  manufacturerName?: string;

  @ApiProperty({
    description: 'Margin mode: PERCENTAGE or FIXED_RATE',
    enum: MarginModeEnum,
    example: MarginModeEnum.PERCENTAGE,
  })
  @IsNotEmpty()
  @IsIn(['PERCENTAGE', 'FIXED_RATE'])
  marginMode!: string;

  @ApiProperty({ description: 'Margin value (percentage or fixed amount in currency)', example: 10.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  marginValue!: number;

  @ApiPropertyOptional({ description: 'Effective From ISO date/time' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective To ISO date/time' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;

  @ApiPropertyOptional({ description: 'Status: ACTIVE or INACTIVE', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string = 'ACTIVE';
}

// =====================================================================
// PRODUCT MARGIN DTO
// =====================================================================

export class SetProductMarginDto {
  @ApiProperty({ description: 'Product ID or Code', example: 'cat_prod_paracetamol_500' })
  @IsNotEmpty()
  @IsString()
  productId!: string;

  @ApiPropertyOptional({ description: 'Product SKU', example: 'PCM-650' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Product Name', example: 'Paracetamol 650mg' })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiProperty({ description: 'Manufacturer ID', example: 'mfg_cipla_ltd' })
  @IsNotEmpty()
  @IsString()
  manufacturerId!: string;

  @ApiPropertyOptional({ description: 'Manufacturer Name', example: 'Cipla Limited' })
  @IsOptional()
  @IsString()
  manufacturerName?: string;

  @ApiProperty({
    description: 'Margin mode: PERCENTAGE or FIXED_RATE',
    enum: MarginModeEnum,
    example: MarginModeEnum.PERCENTAGE,
  })
  @IsNotEmpty()
  @IsIn(['PERCENTAGE', 'FIXED_RATE'])
  marginMode!: string;

  @ApiProperty({ description: 'Margin value (percentage or fixed amount in currency)', example: 14.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  marginValue!: number;

  @ApiPropertyOptional({ description: 'Effective From ISO date/time' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective To ISO date/time' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;

  @ApiPropertyOptional({ description: 'Status: ACTIVE or INACTIVE', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string = 'ACTIVE';
}

// =====================================================================
// BULK IMPORT PRODUCT MARGINS DTO
// =====================================================================

export class ProductMarginImportRowDto {
  @ApiProperty({ description: 'Product ID or Code' })
  @IsNotEmpty()
  @IsString()
  productId!: string;

  @ApiPropertyOptional({ description: 'Product SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Product Name' })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({ description: 'Manufacturer ID' })
  @IsOptional()
  @IsString()
  manufacturerId?: string;

  @ApiPropertyOptional({ description: 'Manufacturer Name' })
  @IsOptional()
  @IsString()
  manufacturerName?: string;

  @ApiPropertyOptional({ description: 'Margin mode: PERCENTAGE or FIXED_RATE', default: 'PERCENTAGE' })
  @IsOptional()
  @IsString()
  marginMode?: string;

  @ApiProperty({ description: 'Margin value', example: 12.0 })
  @IsNotEmpty()
  @IsNumber()
  marginValue!: number;
}

export class BulkImportProductMarginsDto {
  @ApiProperty({ description: 'List of product margin rows to import/upsert', type: [ProductMarginImportRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductMarginImportRowDto)
  rows!: ProductMarginImportRowDto[];
}

// =====================================================================
// PLATFORM FEE DTO
// =====================================================================

export class SetPlatformFeeDto {
  @ApiProperty({
    description: 'Fee mode: PERCENTAGE or FIXED_RATE',
    enum: MarginModeEnum,
    example: MarginModeEnum.PERCENTAGE,
  })
  @IsNotEmpty()
  @IsIn(['PERCENTAGE', 'FIXED_RATE'])
  feeMode!: string;

  @ApiProperty({ description: 'Platform fee value', example: 2.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  feeValue!: number;

  @ApiPropertyOptional({ description: 'Platform fee descriptive name', example: 'Platform Facilitation & Escrow Fee' })
  @IsOptional()
  @IsString()
  feeName?: string;

  @ApiPropertyOptional({ description: 'Status: Active or Inactive', default: 'Active' })
  @IsOptional()
  @IsString()
  status?: string = 'Active';

  @ApiPropertyOptional({ description: 'Effective From ISO date/time' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective To ISO date/time' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;
}

// =====================================================================
// MARGIN CALCULATION DTO (4-TIER RESOLUTION ENGINE)
// =====================================================================

export class CalculateMarginDto {
  @ApiPropertyOptional({ description: 'Product ID or Code' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Product SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Manufacturer ID or Code' })
  @IsOptional()
  @IsString()
  manufacturerId?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Category Name' })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiProperty({ description: 'Base unit price from manufacturer / supplier', example: 100.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  basePrice!: number;
}
