import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// ==========================================
// BRAND DTOs
// ==========================================

export class CreateBrandDto {
  @ApiProperty({ description: 'Unique Brand Code (e.g. SUNBIO, CIPLA)', example: 'SUNBIO' })
  @IsString()
  @MaxLength(50)
  brandCode!: string;

  @ApiProperty({ description: 'Brand Name', example: 'SunBio LifeSciences' })
  @IsString()
  @MaxLength(150)
  brandName!: string;

  @ApiPropertyOptional({ description: 'Brand Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Lifecycle status', example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  lifecycleStatus?: string;
}

export class UpdateBrandDto {
  @ApiPropertyOptional({ description: 'Brand Code' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  brandCode?: string;

  @ApiPropertyOptional({ description: 'Brand Name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  brandName?: string;

  @ApiPropertyOptional({ description: 'Brand Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Lifecycle status', example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  lifecycleStatus?: string;
}

export class BrandQueryDto {
  @ApiPropertyOptional({ description: 'Search query for brand name, code or description' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by lifecycle status (ALL, ACTIVE, INACTIVE)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Page number (0-indexed)', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  @ApiPropertyOptional({ description: 'Page size limit', default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 100;

  @ApiPropertyOptional({ description: 'Sort criteria (e.g. createdAt,desc)' })
  @IsOptional()
  @IsString()
  sort?: string;
}

// ==========================================
// MANUFACTURER ADMIN DTOs
// ==========================================

export class CreateAdminManufacturerDto {
  @ApiPropertyOptional({ description: 'Manufacturer Code (auto-generated if omitted)', example: 'MFG000401' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  manufacturerCode?: string;

  @ApiProperty({ description: 'Company / Facility Name', example: 'SunBio LifeSciences Ltd' })
  @IsString()
  @MaxLength(150)
  companyName!: string;

  @ApiPropertyOptional({ description: 'Facility Street Address' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  facilityAddress?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'State' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ description: 'Pincode' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  pincode?: string;

  @ApiPropertyOptional({ description: 'Primary Contact Person' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Contact Designation' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string;

  @ApiPropertyOptional({ description: 'Official Email' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ description: 'Contact Phone' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ description: 'Manufacturing Capacity Description' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  mfgCapacity?: string;

  @ApiPropertyOptional({ description: 'Manufacturer Description / Capabilities' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Lifecycle Status', example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  lifecycleStatus?: string;

  @ApiPropertyOptional({ description: 'Effective from date' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Discontinued on date' })
  @IsOptional()
  @IsString()
  discontinuedOn?: string;
}

export class UpdateAdminManufacturerDto {
  @ApiPropertyOptional({ description: 'Manufacturer Code' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  manufacturerCode?: string;

  @ApiPropertyOptional({ description: 'Company / Facility Name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  companyName?: string;

  @ApiPropertyOptional({ description: 'Facility Street Address' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  facilityAddress?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'State' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ description: 'Pincode' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  pincode?: string;

  @ApiPropertyOptional({ description: 'Primary Contact Person' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Contact Designation' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string;

  @ApiPropertyOptional({ description: 'Official Email' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ description: 'Contact Phone' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ description: 'Manufacturing Capacity Description' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  mfgCapacity?: string;

  @ApiPropertyOptional({ description: 'Manufacturer Description / Capabilities' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Lifecycle Status', example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  lifecycleStatus?: string;

  @ApiPropertyOptional({ description: 'Effective from date' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Discontinued on date' })
  @IsOptional()
  @IsString()
  discontinuedOn?: string;
}

export class ManufacturerQueryDto {
  @ApiPropertyOptional({ description: 'Search term for company name, code, city, email' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by lifecycle status (ALL, ACTIVE, INACTIVE)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Page number (0-indexed)', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  @ApiPropertyOptional({ description: 'Page size limit', default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 100;
}

// ==========================================
// PRODUCT MANUFACTURER MAPPING DTOs
// ==========================================

export class CreateProductManufacturerMappingDto {
  @ApiProperty({ description: 'Product ID from catalog_products (e.g. p1, p2)', example: 'p1' })
  @IsString()
  productId!: string;

  @ApiProperty({ description: 'Manufacturer ID from manufacturer_registrations (e.g. 1, 3, 10)', example: '1' })
  @IsString()
  manufacturerId!: string;

  @ApiPropertyOptional({ description: 'Manufacturer SKU or Part Code', example: 'MFG-PRD-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturerProductCode?: string;

  @ApiPropertyOptional({ description: 'Manufacturer Part Number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturerPartNumber?: string;

  @ApiPropertyOptional({ description: 'Manufacturer SKU' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturerSku?: string;

  @ApiPropertyOptional({ description: 'Minimum Order Quantity', default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moq?: number;

  @ApiPropertyOptional({ description: 'Lead Time in Days', default: 14 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Lifecycle status', example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'DISCONTINUED', 'EOL', 'SUSPENDED'] })
  @IsOptional()
  @IsString()
  lifecycleStatus?: string;

  @ApiPropertyOptional({ description: 'Designated as primary/preferred supplier for this product', default: false })
  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;

  @ApiPropertyOptional({ description: 'Packaging Details' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  packagingDetails?: string;

  @ApiPropertyOptional({ description: 'Effective From date' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective To date' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;
}

export class UpdateProductManufacturerMappingDto {
  @ApiPropertyOptional({ description: 'Manufacturer SKU or Part Code' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturerProductCode?: string;

  @ApiPropertyOptional({ description: 'Manufacturer Part Number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturerPartNumber?: string;

  @ApiPropertyOptional({ description: 'Manufacturer SKU' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturerSku?: string;

  @ApiPropertyOptional({ description: 'Minimum Order Quantity' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moq?: number;

  @ApiPropertyOptional({ description: 'Lead Time in Days' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Lifecycle status', example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'DISCONTINUED', 'EOL', 'SUSPENDED'] })
  @IsOptional()
  @IsString()
  lifecycleStatus?: string;

  @ApiPropertyOptional({ description: 'Designated as primary/preferred supplier for this product' })
  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;

  @ApiPropertyOptional({ description: 'Packaging Details' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  packagingDetails?: string;

  @ApiPropertyOptional({ description: 'Effective From date' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective To date' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;
}

export class ProductManufacturerMappingQueryDto {
  @ApiPropertyOptional({ description: 'Filter by product ID' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by manufacturer ID' })
  @IsOptional()
  @IsString()
  manufacturerId?: string;

  @ApiPropertyOptional({ description: 'Filter by lifecycle status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter only preferred mappings' })
  @IsOptional()
  @IsBoolean()
  preferredOnly?: boolean;

  @ApiPropertyOptional({ description: 'Search term for product name, code, manufacturer name' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Page number (0-indexed)', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  @ApiPropertyOptional({ description: 'Page size limit', default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 100;
}
