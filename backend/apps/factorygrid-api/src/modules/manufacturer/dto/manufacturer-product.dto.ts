import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateManufacturerProductDto {
  @ApiProperty({ description: 'ID of existing product in master catalogue' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

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
