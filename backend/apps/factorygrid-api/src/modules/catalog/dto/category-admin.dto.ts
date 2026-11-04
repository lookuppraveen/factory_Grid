import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PageableQueryDto } from '../../../common/pagination/pageable.dto';

export class CreateCategoryDto {
  @ApiPropertyOptional({ example: 'CAT033', description: 'Unique category identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  id?: string;

  @ApiPropertyOptional({ example: 'CAT033' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category_id?: string;

  @ApiPropertyOptional({ example: 'CAT033' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  categoryId?: string;

  @ApiPropertyOptional({ example: 'pt_med', description: 'Product type ID (e.g. pt_med, pt_nut, etc.)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  productTypeId?: string;

  @ApiPropertyOptional({ example: 'pt_med' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  product_type_id?: string;

  @ApiPropertyOptional({ example: 'Drugs', description: 'Level 1 parent category name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  category?: string;

  @ApiPropertyOptional({ example: 'Drugs' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'Tablets', description: 'Level 2 sub-category name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  subCategory?: string;

  @ApiPropertyOptional({ example: 'Tablets' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  sub_category?: string;

  @ApiPropertyOptional({ example: 'Dispersible Tablets', description: 'Level 3 sub-sub-category name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  subSubCategory?: string;

  @ApiPropertyOptional({ example: 'Dispersible Tablets' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  sub_sub_category?: string;

  @ApiPropertyOptional({ example: 'DRUG-TAB-DSP', description: 'Unique category code' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  categoryCode?: string;

  @ApiPropertyOptional({ example: 'DRUG-TAB-DSP' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category_code?: string;

  @ApiPropertyOptional({ example: 'DRUG-TAB-DSP' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ example: 'Dispersible tablets for rapid reconstitution in liquid', description: 'Category description' })
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

  @ApiPropertyOptional({ example: 1, description: 'Display ordering weight' })
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
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'pt_med' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  productTypeId?: string;

  @ApiPropertyOptional({ example: 'pt_med' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  product_type_id?: string;

  @ApiPropertyOptional({ example: 'Drugs' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  category?: string;

  @ApiPropertyOptional({ example: 'Drugs' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'Tablets' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  subCategory?: string;

  @ApiPropertyOptional({ example: 'Tablets' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  sub_category?: string;

  @ApiPropertyOptional({ example: 'Dispersible Tablets' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  subSubCategory?: string;

  @ApiPropertyOptional({ example: 'Dispersible Tablets' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  sub_sub_category?: string;

  @ApiPropertyOptional({ example: 'DRUG-TAB-DSP' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  categoryCode?: string;

  @ApiPropertyOptional({ example: 'DRUG-TAB-DSP' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category_code?: string;

  @ApiPropertyOptional({ example: 'DRUG-TAB-DSP' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ example: 'Updated category description' })
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
}

export class CategoryQueryDto extends PageableQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Product Type ID or code' })
  @IsOptional()
  @IsString()
  productTypeId?: string;

  @ApiPropertyOptional({ description: 'Filter by lifecycle status (ACTIVE, INACTIVE, ALL)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Only return active category records' })
  @IsOptional()
  @Type(() => Boolean)
  activeOnly?: boolean;
}
