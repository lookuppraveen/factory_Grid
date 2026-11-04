import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRfqLineDto {
  @ApiPropertyOptional({ description: 'Catalog Product ID (if selected from master catalog)' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ description: 'Product or molecule name' })
  @IsString()
  productName!: string;

  @ApiPropertyOptional({ description: 'Product code' })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional({ description: 'Category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Sub-category' })
  @IsOptional()
  @IsString()
  subCategory?: string;

  @ApiPropertyOptional({ description: 'Sub-sub-category' })
  @IsOptional()
  @IsString()
  subSubCategory?: string;

  @ApiPropertyOptional({ description: 'Product Type (BRANDED | GENERIC)', default: 'BRANDED' })
  @IsOptional()
  @IsString()
  productType?: 'BRANDED' | 'GENERIC';

  @ApiPropertyOptional({ description: 'Dosage Form' })
  @IsOptional()
  @IsString()
  dosageForm?: string;

  @ApiPropertyOptional({ description: 'Pack Size' })
  @IsOptional()
  @IsString()
  packSize?: string;

  @ApiPropertyOptional({ description: 'Unit of Measure', default: 'Units' })
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiProperty({ description: 'Quantity required', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ description: 'Target price per unit' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetPrice?: number;

  @ApiPropertyOptional({ description: 'Agreed unit price for Special Party buyer pre-agreed pricing workflow' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  buyerProvidedPrice?: number;

  @ApiPropertyOptional({ description: 'Required delivery date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  requiredDate?: string;

  @ApiPropertyOptional({ description: 'Line-level remarks/instructions' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Generic molecule/active ingredient' })
  @IsOptional()
  @IsString()
  molecule?: string;

  @ApiPropertyOptional({ description: 'Strength/specification' })
  @IsOptional()
  @IsString()
  strength?: string;
}

export class CreateRfqDto {
  @ApiPropertyOptional({ enum: ['STANDARD', 'HIGH', 'URGENT'], default: 'STANDARD' })
  @IsOptional()
  @IsString()
  priority?: 'STANDARD' | 'HIGH' | 'URGENT';

  @ApiProperty({ description: 'Delivery location / address' })
  @IsString()
  deliveryLocation!: string;

  @ApiPropertyOptional({ description: 'RFQ header required date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  requiredDate?: string;

  @ApiPropertyOptional({ description: 'RFQ quotation deadline date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  deadlineDate?: string;

  @ApiPropertyOptional({ description: 'Header remarks or special instructions' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Whether credit terms are requested', default: false })
  @IsOptional()
  @IsBoolean()
  creditRequired?: boolean;

  @ApiPropertyOptional({ description: 'Requested credit terms description' })
  @IsOptional()
  @IsString()
  creditTerms?: string;

  @ApiPropertyOptional({ description: 'Whether RFQ contains generic molecules', default: false })
  @IsOptional()
  @IsBoolean()
  isGeneric?: boolean;

  @ApiPropertyOptional({ description: 'Customer classification (REGULAR or SPECIAL_PARTY)', default: 'REGULAR' })
  @IsOptional()
  @IsString()
  customerClassification?: string;

  @ApiPropertyOptional({ enum: ['Draft', 'Submitted'], default: 'Draft' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Product lines for this RFQ', type: [CreateRfqLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRfqLineDto)
  lines!: CreateRfqLineDto[];
}

export class UpdateRfqDto {
  @ApiPropertyOptional({ enum: ['STANDARD', 'HIGH', 'URGENT'] })
  @IsOptional()
  @IsString()
  priority?: 'STANDARD' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional({ description: 'Delivery location / address' })
  @IsOptional()
  @IsString()
  deliveryLocation?: string;

  @ApiPropertyOptional({ description: 'RFQ header required date' })
  @IsOptional()
  @IsString()
  requiredDate?: string;

  @ApiPropertyOptional({ description: 'RFQ quotation deadline date' })
  @IsOptional()
  @IsString()
  deadlineDate?: string;

  @ApiPropertyOptional({ description: 'Header remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Whether credit terms are requested' })
  @IsOptional()
  @IsBoolean()
  creditRequired?: boolean;

  @ApiPropertyOptional({ description: 'Requested credit terms' })
  @IsOptional()
  @IsString()
  creditTerms?: string;

  @ApiPropertyOptional({ description: 'Whether RFQ contains generic molecules' })
  @IsOptional()
  @IsBoolean()
  isGeneric?: boolean;

  @ApiPropertyOptional({ description: 'Customer classification' })
  @IsOptional()
  @IsString()
  customerClassification?: string;

  @ApiPropertyOptional({ description: 'Product lines', type: [CreateRfqLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRfqLineDto)
  lines?: CreateRfqLineDto[];
}
