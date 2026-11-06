import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

// =====================================================================
// PRODUCT PRICE DTOs
// =====================================================================

export class ProductPriceQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Product ID or Code' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by Manufacturer Registration ID or Mapping ID' })
  @IsOptional()
  @IsString()
  manufacturerId?: string;

  @ApiPropertyOptional({ description: 'Filter by Customer Segment ID' })
  @IsOptional()
  @IsString()
  customerSegmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by status: ACTIVE, INACTIVE, EXPIRED, DRAFT' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 20;

  @ApiPropertyOptional({ description: 'Sort e.g. createdAt,desc' })
  @IsOptional()
  @IsString()
  sort?: string;
}

export class CreatePriceDto {
  @ApiProperty({ example: 'p1', description: 'Catalog Product ID or Product Code' })
  @IsNotEmpty()
  @IsString()
  productId!: string;

  @ApiPropertyOptional({ example: 1, description: 'Optional Manufacturer Product Mapping ID' })
  @IsOptional()
  @Type(() => Number)
  productManufacturerId?: number | null;

  @ApiPropertyOptional({ example: 'seg_dist', description: 'Customer Segment ID' })
  @IsOptional()
  @IsString()
  customerSegmentId?: string | null;

  @ApiPropertyOptional({ example: 'TIERED', default: 'BASE' })
  @IsOptional()
  @IsString()
  priceType?: string;

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 45.50, description: 'Unit price' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  unitPrice!: number;

  @ApiPropertyOptional({ example: 100, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minQuantity?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxQuantity?: number | null;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string | null;

  @ApiPropertyOptional({ example: '2027-12-31' })
  @IsOptional()
  @IsString()
  effectiveTo?: string | null;

  @ApiPropertyOptional({ example: 'ACTIVE', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  priceStatus?: string;
}

export class UpdatePriceDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  productManufacturerId?: number | null;

  @ApiPropertyOptional({ example: 'seg_dist' })
  @IsOptional()
  @IsString()
  customerSegmentId?: string | null;

  @ApiPropertyOptional({ example: 'TIERED' })
  @IsOptional()
  @IsString()
  priceType?: string;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 45.50 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  unitPrice?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minQuantity?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxQuantity?: number | null;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string | null;

  @ApiPropertyOptional({ example: '2027-12-31' })
  @IsOptional()
  @IsString()
  effectiveTo?: string | null;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  priceStatus?: string;
}

// =====================================================================
// PRODUCT TAX DTOs
// =====================================================================

export class ProductTaxQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Product ID or Code' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by status: ALL, ACTIVE, INACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 20;

  @ApiPropertyOptional({ description: 'Sort e.g. createdAt,desc' })
  @IsOptional()
  @IsString()
  sort?: string;
}

export class CreateProductTaxDto {
  @ApiProperty({ example: 'p1', description: 'Product ID or Code' })
  @IsNotEmpty()
  @IsString()
  productId!: string;

  @ApiProperty({ example: 'HSN-3004-10', description: 'Tax or HSN code' })
  @IsNotEmpty()
  @IsString()
  taxCode!: string;

  @ApiProperty({ example: 12.00, description: 'Tax percentage rate (e.g. 12, 18)' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  taxRate!: number;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string | null;

  @ApiPropertyOptional({ example: '2027-12-31' })
  @IsOptional()
  @IsString()
  effectiveTo?: string | null;

  @ApiPropertyOptional({ example: 'ACTIVE', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateProductTaxDto {
  @ApiPropertyOptional({ example: 'HSN-3004-10' })
  @IsOptional()
  @IsString()
  taxCode?: string;

  @ApiPropertyOptional({ example: 12.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  taxRate?: number;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string | null;

  @ApiPropertyOptional({ example: '2027-12-31' })
  @IsOptional()
  @IsString()
  effectiveTo?: string | null;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}

// =====================================================================
// PRODUCT UOM DTOs
// =====================================================================

export class ProductUomQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Product ID or Code' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter active status' })
  @IsOptional()
  @IsString()
  active?: string;

  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 20;

  @ApiPropertyOptional({ description: 'Sort e.g. createdAt,desc' })
  @IsOptional()
  @IsString()
  sort?: string;
}

export class CreateProductUomDto {
  @ApiProperty({ example: 'p1', description: 'Product ID or Code' })
  @IsNotEmpty()
  @IsString()
  productId!: string;

  @ApiProperty({ example: 'Box', description: 'Unit of measure name' })
  @IsNotEmpty()
  @IsString()
  uom!: string;

  @ApiProperty({ example: 10.0000, description: 'Positive conversion factor relative to base unit' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  conversionFactor!: number;

  @ApiPropertyOptional({ example: false, default: false, description: 'Whether this is the single base UOM' })
  @IsOptional()
  @IsBoolean()
  isBaseUom?: boolean;

  @ApiPropertyOptional({ example: true, default: true, description: 'Whether this UOM is orderable by buyers' })
  @IsOptional()
  @IsBoolean()
  isOrderUom?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductUomDto {
  @ApiPropertyOptional({ example: 'Box' })
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiPropertyOptional({ example: 10.0000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  conversionFactor?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isBaseUom?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isOrderUom?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// =====================================================================
// CUSTOMER SEGMENT DTOs
// =====================================================================

export class CreateCustomerSegmentDto {
  @ApiPropertyOptional({ example: 'seg_corp' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'CORP', description: 'Unique segment code' })
  @IsNotEmpty()
  @IsString()
  segmentCode!: string;

  @ApiProperty({ example: 'Corporate Procurement', description: 'Segment display name' })
  @IsNotEmpty()
  @IsString()
  segmentName!: string;

  @ApiPropertyOptional({ example: 'Direct institutional and corporate agreements' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  lifecycleStatus?: string;
}

export class UpdateCustomerSegmentDto {
  @ApiPropertyOptional({ example: 'CORP' })
  @IsOptional()
  @IsString()
  segmentCode?: string;

  @ApiPropertyOptional({ example: 'Corporate Procurement' })
  @IsOptional()
  @IsString()
  segmentName?: string;

  @ApiPropertyOptional({ example: 'Direct institutional agreements' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  lifecycleStatus?: string;
}

