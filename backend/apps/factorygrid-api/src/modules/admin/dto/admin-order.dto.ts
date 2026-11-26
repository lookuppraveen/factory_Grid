import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AdminOrderQueryDto {
  @ApiPropertyOptional({ description: 'Search by PO #, Master Order #, RFQ #, customer name, manufacturer, or product' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by PO approval state',
    enum: ['ALL', 'PENDING', 'APPROVED', 'REJECTED'],
    default: 'ALL',
  })
  @IsOptional()
  @IsString()
  approvalStatus?: string;

  @ApiPropertyOptional({
    description: 'Filter by Advance Payment state',
    enum: ['ALL', 'NOT_REQUIRED', 'PENDING', 'PARTIALLY_PAID', 'PAID'],
    default: 'ALL',
  })
  @IsOptional()
  @IsString()
  advanceStatus?: string;

  @ApiPropertyOptional({
    description: 'Filter by PO lifecycle state',
    enum: ['ALL', 'AWAITING_ADVANCE', 'CONFIRMED_RELEASED', 'REJECTED', 'ON_HOLD'],
    default: 'ALL',
  })
  @IsOptional()
  @IsString()
  poStatus?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  size?: number = 50;
}

export class ApproveMasterOrderDto {
  @ApiPropertyOptional({ description: 'Whether advance payment is required from buyer', default: false })
  @IsOptional()
  @IsBoolean()
  advanceRequired?: boolean;

  @ApiPropertyOptional({ description: 'Advance calculation method', enum: ['PERCENTAGE', 'FIXED_AMOUNT'] })
  @IsOptional()
  @IsString()
  advanceMethod?: 'PERCENTAGE' | 'FIXED_AMOUNT';

  @ApiPropertyOptional({ description: 'Advance percentage (1 - 100)', example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  advancePercentage?: number;

  @ApiPropertyOptional({ description: 'Fixed advance amount in INR', example: 50000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fixedAmount?: number;

  @ApiPropertyOptional({ description: 'Payment due date in YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  advanceDueDate?: string;

  @ApiPropertyOptional({ description: 'Payment terms or notes to buyer' })
  @IsOptional()
  @IsString()
  advanceNotes?: string;
}

export class RejectMasterOrderDto {
  @ApiProperty({ description: 'Mandatory reason for rejecting purchase order' })
  @IsString()
  reason!: string;
}

export class HoldMasterOrderDto {
  @ApiProperty({ description: 'Mandatory reason for placing purchase order on hold' })
  @IsString()
  reason!: string;
}

export class AdminOrdersSummaryDto {
  @ApiProperty({ description: 'Number of purchase orders awaiting Admin approval' })
  pendingApprovalCount!: number;

  @ApiProperty({ description: 'Number of orders where advance payment is pending' })
  pendingAdvanceCount!: number;

  @ApiProperty({ description: 'Total advance payment received in INR' })
  totalAdvanceReceived!: number;

  @ApiProperty({ description: 'Total advance payment outstanding in INR' })
  totalAdvanceOutstanding!: number;

  @ApiProperty({ description: 'Total master orders count' })
  totalOrdersCount!: number;

  @ApiProperty({ description: 'Total GMV across all master orders in INR' })
  totalGmv!: number;
}
