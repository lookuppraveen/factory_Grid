import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'CAT033', description: 'Unique category identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  id?: string;

  @ApiPropertyOptional({ example: 'pt_med', description: 'Product type ID (e.g. pt_med, pt_nut, etc.)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  productTypeId?: string;

  @ApiProperty({ example: 'Drugs', description: 'Level 1 parent category name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  category!: string;

  @ApiPropertyOptional({ example: 'Tablets', description: 'Level 2 sub-category name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  subCategory?: string;

  @ApiPropertyOptional({ example: 'Dispersible Tablets', description: 'Level 3 sub-sub-category name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  subSubCategory?: string;

  @ApiProperty({ example: 'DRUG-TAB-DSP', description: 'Unique category code' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  categoryCode!: string;

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

  @ApiPropertyOptional({ example: 1, description: 'Display ordering weight' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  displayOrder?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'pt_med' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  productTypeId?: string;

  @ApiPropertyOptional({ example: 'Drugs' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  category?: string;

  @ApiPropertyOptional({ example: 'Tablets' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  subCategory?: string;

  @ApiPropertyOptional({ example: 'Dispersible Tablets' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  subSubCategory?: string;

  @ApiPropertyOptional({ example: 'DRUG-TAB-DSP' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  categoryCode?: string;

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

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  displayOrder?: number;
}
