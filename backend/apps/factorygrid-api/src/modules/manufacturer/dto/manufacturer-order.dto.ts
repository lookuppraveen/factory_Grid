import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class ManufacturerOrderQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by order status (e.g. ALL, Awaiting Acceptance, Accepted, Artwork Pending, Scheduled, In Production, Quality & Packaging, Ready to Dispatch, Completed, Rejected)',
    example: 'Awaiting Acceptance',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Search by sub-order #, master order #, PO #, customer name, or product name',
    example: 'SO-2026',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size limit', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number = 20;

  @ApiPropertyOptional({ description: 'Sort direction (asc/desc)', default: 'desc' })
  @IsOptional()
  @IsString()
  sort?: string = 'desc';
}

export class RejectOrderDto {
  @ApiProperty({ description: 'Standard rejection reason', example: 'Capacity Constraints' })
  @IsNotEmpty()
  @IsString()
  rejectionReason!: string;

  @ApiPropertyOptional({ description: 'Detailed remarks regarding the rejection' })
  @IsOptional()
  @IsString()
  rejectionRemarks?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Target workflow status (e.g. ACCEPTED, ARTWORK_PENDING, SCHEDULED, IN_PRODUCTION, QUALITY_PACKAGING, READY_TO_DISPATCH, COMPLETED)',
    example: 'IN_PRODUCTION',
  })
  @IsNotEmpty()
  @IsString()
  status!: string;

  @ApiPropertyOptional({ description: 'Optional transition remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
