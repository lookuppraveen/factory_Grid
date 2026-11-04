import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PageableQueryDto } from '../../../common/pagination/pageable.dto';

export type AttributeDataType = 'TEXT' | 'NUMBER' | 'DECIMAL' | 'BOOLEAN' | 'DATE' | 'LIST';

export class CreateAttributeMasterDto {
  @ApiPropertyOptional({ example: 'attr_generic_name', description: 'Unique identifier or code-based ID' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  id?: string;

  @ApiPropertyOptional({ example: 'attr_generic_name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  attribute_id?: string;

  @ApiPropertyOptional({ example: 'attr_generic_name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  attributeId?: string;

  @ApiPropertyOptional({ example: 'GENERIC_NAME', description: 'Unique attribute code across the catalog' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  attributeCode?: string;

  @ApiPropertyOptional({ example: 'GENERIC_NAME' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  attribute_code?: string;

  @ApiPropertyOptional({ example: 'GENERIC_NAME' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ example: 'Generic Name', description: 'Human-readable attribute name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attributeName?: string;

  @ApiPropertyOptional({ example: 'Generic Name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute_name?: string;

  @ApiPropertyOptional({ example: 'Generic Name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'TEXT', enum: ['TEXT', 'NUMBER', 'DECIMAL', 'BOOLEAN', 'DATE', 'LIST'] })
  @IsOptional()
  @IsString()
  @IsIn(['TEXT', 'NUMBER', 'DECIMAL', 'BOOLEAN', 'DATE', 'LIST'])
  dataType?: AttributeDataType;

  @ApiPropertyOptional({ example: 'TEXT' })
  @IsOptional()
  @IsString()
  @IsIn(['TEXT', 'NUMBER', 'DECIMAL', 'BOOLEAN', 'DATE', 'LIST'])
  data_type?: AttributeDataType;

  @ApiPropertyOptional({ example: 'mg', description: 'Unit of measure (e.g. mg, ml, Months, etc.)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unitOfMeasure?: string;

  @ApiPropertyOptional({ example: 'mg' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit_of_measure?: string;

  @ApiPropertyOptional({ example: 'Standard pharmaceutical active entity' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @ApiPropertyOptional({ example: 'Standard pharmaceutical active entity' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: ['Tablet', 'Capsule', 'Syrup'],
    description: 'Allowed values for LIST data type',
  })
  @IsOptional()
  @IsArray()
  allowedValues?: any[];

  @ApiPropertyOptional({ example: ['Tablet', 'Capsule'] })
  @IsOptional()
  @IsArray()
  allowed_values?: any[];

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_filterable?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isSearchable?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_searchable?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateAttributeMasterDto {
  @ApiPropertyOptional({ example: 'GENERIC_NAME' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  attributeCode?: string;

  @ApiPropertyOptional({ example: 'GENERIC_NAME' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  attribute_code?: string;

  @ApiPropertyOptional({ example: 'GENERIC_NAME' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ example: 'Generic Name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attributeName?: string;

  @ApiPropertyOptional({ example: 'Generic Name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  attribute_name?: string;

  @ApiPropertyOptional({ example: 'Generic Name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'TEXT', enum: ['TEXT', 'NUMBER', 'DECIMAL', 'BOOLEAN', 'DATE', 'LIST'] })
  @IsOptional()
  @IsString()
  @IsIn(['TEXT', 'NUMBER', 'DECIMAL', 'BOOLEAN', 'DATE', 'LIST'])
  dataType?: AttributeDataType;

  @ApiPropertyOptional({ example: 'TEXT' })
  @IsOptional()
  @IsString()
  @IsIn(['TEXT', 'NUMBER', 'DECIMAL', 'BOOLEAN', 'DATE', 'LIST'])
  data_type?: AttributeDataType;

  @ApiPropertyOptional({ example: 'mg' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unitOfMeasure?: string;

  @ApiPropertyOptional({ example: 'mg' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit_of_measure?: string;

  @ApiPropertyOptional({ example: 'Updated remark' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @ApiPropertyOptional({ example: 'Updated remark' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: ['Tablet', 'Capsule'] })
  @IsOptional()
  @IsArray()
  allowedValues?: any[];

  @ApiPropertyOptional({ example: ['Tablet', 'Capsule'] })
  @IsOptional()
  @IsArray()
  allowed_values?: any[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_filterable?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isSearchable?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_searchable?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class AttributeMasterQueryDto extends PageableQueryDto {
  @ApiPropertyOptional({ description: 'Filter by data type', enum: ['ALL', 'TEXT', 'NUMBER', 'DECIMAL', 'BOOLEAN', 'DATE', 'LIST'] })
  @IsOptional()
  @IsString()
  dataType?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ['ALL', 'ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Only return active attributes' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activeOnly?: boolean;
}

export class CategoryAttributeItemDto {
  @ApiProperty({ example: 'attr_generic_name', description: 'Attribute Master ID or Code' })
  @IsString()
  @IsNotEmpty()
  attributeId!: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  displayOrder?: number;

  @ApiPropertyOptional({ example: 'Required for this specific category' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;
}

export class BulkCategoryAttributesDto {
  @ApiProperty({ type: [CategoryAttributeItemDto] })
  @IsArray()
  attributes!: CategoryAttributeItemDto[];
}

export class ProductAttributeValueDto {
  @ApiProperty({ example: 'attr_generic_name' })
  @IsString()
  @IsNotEmpty()
  attributeId!: string;

  @ApiProperty({ example: 'Paracetamol 500mg' })
  @IsNotEmpty()
  attributeValue!: string;
}

export class BulkProductAttributesDto {
  @ApiProperty({ type: [ProductAttributeValueDto] })
  @IsArray()
  attributes!: ProductAttributeValueDto[];
}

export class CreateProductPriceDto {
  @ApiPropertyOptional({ example: 'prd_1730000000_abc' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ example: 1, description: 'Optional manufacturer link' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  productManufacturerId?: number;

  @ApiPropertyOptional({ example: 'cs_enterprise', description: 'Customer Segment ID' })
  @IsOptional()
  @IsString()
  customerSegmentId?: string;

  @ApiPropertyOptional({ example: 'BASE', default: 'BASE' })
  @IsOptional()
  @IsString()
  priceType?: string;

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 45.50, description: 'Unit price' })
  @IsNumber()
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
  maxQuantity?: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  priceStatus?: string;
}

export class MapProductManufacturerDto {
  @ApiProperty({ example: 1, description: 'Manufacturer Registration ID' })
  @IsNumber()
  @Type(() => Number)
  registrationId!: number;

  @ApiPropertyOptional({ example: 'MFG-PRD-001' })
  @IsOptional()
  @IsString()
  manufacturerProductCode?: string;

  @ApiPropertyOptional({ example: 'MPN-9988' })
  @IsOptional()
  @IsString()
  manufacturerPartNumber?: string;

  @ApiPropertyOptional({ example: 'SKU-DRUG-01' })
  @IsOptional()
  @IsString()
  manufacturerSku?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  moq?: number;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  leadTimeDays?: number;

  @ApiPropertyOptional({ example: 'ACTIVE', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  lifecycleStatus?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;

  @ApiPropertyOptional({ example: '10 strips per box, 50 boxes per master carton' })
  @IsOptional()
  @IsString()
  packagingDetails?: string;
}
