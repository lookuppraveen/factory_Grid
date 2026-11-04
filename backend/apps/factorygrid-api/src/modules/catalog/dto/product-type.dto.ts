import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PageableQueryDto } from '../../../common/pagination/pageable.dto';

export class CreateProductTypeDto {
  @ApiPropertyOptional({ example: 'pt_med', description: 'Unique product type identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  id?: string;

  @ApiPropertyOptional({ example: 'pt_med' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  product_type_id?: string;

  @ApiPropertyOptional({ example: 'pt_med' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  productTypeId?: string;

  @ApiPropertyOptional({ example: 'PHARMA', description: 'Unique product type code' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  productTypeCode?: string;

  @ApiPropertyOptional({ example: 'PHARMA' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  product_type_code?: string;

  @ApiPropertyOptional({ example: 'PHARMA' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ example: 'Pharmaceutical', description: 'Product type name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  productTypeName?: string;

  @ApiPropertyOptional({ example: 'Pharmaceutical' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  product_type_name?: string;

  @ApiPropertyOptional({ example: 'Pharmaceutical' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'Allopathic pharmaceuticals and therapies', description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'Lifecycle status' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lifecycleStatus?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lifecycle_status?: string;

  @ApiPropertyOptional({ example: 'Active' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @ApiPropertyOptional({ example: 1, description: 'Display order priority' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  displayOrder?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  display_order?: number;

  @ApiPropertyOptional({ type: [String], example: ['attr_generic_name', 'attr_dosage_form'] })
  @IsOptional()
  @IsArray()
  attributeIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  attribute_ids?: string[];

  @ApiPropertyOptional({ type: () => [ProductTypeAttributeInputDto] })
  @IsOptional()
  @IsArray()
  attributes?: ProductTypeAttributeInputDto[];
}

export class ProductTypeAttributeInputDto {
  @ApiPropertyOptional({ example: 'attr_generic_name' })
  @IsOptional()
  @IsString()
  attributeId?: string;

  @ApiPropertyOptional({ example: 'attr_generic_name' })
  @IsOptional()
  @IsString()
  attribute_id?: string;

  @ApiPropertyOptional({ example: 'attr_generic_name' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: 'GENERIC_NAME' })
  @IsOptional()
  @IsString()
  attributeCode?: string;

  @ApiPropertyOptional({ example: 'GENERIC_NAME' })
  @IsOptional()
  @IsString()
  attribute_code?: string;

  @ApiPropertyOptional({ example: 'GENERIC_NAME' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'Generic Composition' })
  @IsOptional()
  @IsString()
  attributeName?: string;

  @ApiPropertyOptional({ example: 'Generic Composition' })
  @IsOptional()
  @IsString()
  attribute_name?: string;

  @ApiPropertyOptional({ example: 'Generic Composition' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'TEXT', enum: ['TEXT', 'NUMBER', 'DECIMAL', 'BOOLEAN', 'DATE', 'LIST'] })
  @IsOptional()
  @IsString()
  dataType?: string;

  @ApiPropertyOptional({ example: 'TEXT' })
  @IsOptional()
  @IsString()
  data_type?: string;

  @ApiPropertyOptional({ example: 'mg' })
  @IsOptional()
  @IsString()
  unitOfMeasure?: string;

  @ApiPropertyOptional({ example: 'mg' })
  @IsOptional()
  @IsString()
  unit_of_measure?: string;

  @ApiPropertyOptional({ example: ['Option 1', 'Option 2'] })
  @IsOptional()
  @IsArray()
  allowedValues?: string[];

  @ApiPropertyOptional({ example: ['Option 1', 'Option 2'] })
  @IsOptional()
  @IsArray()
  allowed_values?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

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

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  displayOrder?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  display_order?: number;

  @ApiPropertyOptional({ example: 'Note' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateProductTypeDto {
  @ApiPropertyOptional({ example: 'PHARMA' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  productTypeCode?: string;

  @ApiPropertyOptional({ example: 'PHARMA' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  product_type_code?: string;

  @ApiPropertyOptional({ example: 'PHARMA' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ example: 'Pharmaceutical' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  productTypeName?: string;

  @ApiPropertyOptional({ example: 'Pharmaceutical' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  product_type_name?: string;

  @ApiPropertyOptional({ example: 'Pharmaceutical' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lifecycleStatus?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lifecycle_status?: string;

  @ApiPropertyOptional({ example: 'Active' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  displayOrder?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  display_order?: number;

  @ApiPropertyOptional({ type: [String], example: ['attr_generic_name', 'attr_dosage_form'] })
  @IsOptional()
  @IsArray()
  attributeIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  attribute_ids?: string[];

  @ApiPropertyOptional({ type: () => [ProductTypeAttributeInputDto] })
  @IsOptional()
  @IsArray()
  attributes?: ProductTypeAttributeInputDto[];
}

export class ProductTypeAttributeItemDto {
  @ApiPropertyOptional({ example: 'attr_generic_name', description: 'Attribute Master ID or Code' })
  @IsOptional()
  @IsString()
  attributeId?: string;

  @ApiPropertyOptional({ example: 'attr_generic_name' })
  @IsOptional()
  @IsString()
  attribute_id?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  displayOrder?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  display_order?: number;

  @ApiPropertyOptional({ example: 'ACTIVE', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  lifecycleStatus?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  lifecycle_status?: string;

  @ApiPropertyOptional({ example: 'Applies to this product type formulation' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;
}

export class BulkProductTypeAttributesDto {
  @ApiProperty({ type: [ProductTypeAttributeItemDto] })
  @IsArray()
  attributes!: ProductTypeAttributeItemDto[];
}

export class UpdateProductTypeAttributeDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  displayOrder?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  display_order?: number;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  lifecycleStatus?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  lifecycle_status?: string;
}

export class ProductTypeQueryDto extends PageableQueryDto {
  @ApiPropertyOptional({ description: 'Filter by lifecycle status (ACTIVE, INACTIVE, ALL)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Only return active product types' })
  @IsOptional()
  @Type(() => Boolean)
  activeOnly?: boolean;
}
