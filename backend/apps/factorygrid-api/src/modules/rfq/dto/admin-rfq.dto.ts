import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class AdminRfqQueryDto {
  @ApiPropertyOptional({ description: 'Search term across RFQ number, customer, buyer, or molecule/product' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by RFQ type (ALL, GENERIC, BRANDED)', default: 'ALL' })
  @IsOptional()
  @IsString()
  type?: 'ALL' | 'GENERIC' | 'BRANDED';

  @ApiPropertyOptional({ description: 'Filter by status (Draft, Submitted, Quoted, Vendor Selected, Closed, etc.)' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class SubmitGenericAdminPricingDto {
  @ApiProperty({
    description: 'Map of RFQ Line ID to Admin internal applicable unit price (INR)',
    example: { '1': 4.20, '2': 8.50 },
  })
  @IsObject()
  linePrices!: Record<string, number>;

  @ApiPropertyOptional({ description: 'Admin pricing remarks or notes' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class AdminRfqStatsResponseDto {
  @ApiProperty({ description: 'Total count of RFQs in PostgreSQL', example: 7 })
  totalRfqs!: number;

  @ApiProperty({ description: 'Count of generic medicine RFQs', example: 2 })
  genericRfqs!: number;

  @ApiProperty({ description: 'Count of generic RFQs pending admin pricing', example: 1 })
  pendingGenericCount!: number;

  @ApiProperty({ description: 'Count of branded RFQs', example: 5 })
  brandedRfqs!: number;

  @ApiProperty({ description: 'Count of active / quoted RFQs', example: 4 })
  activeQuotedCount!: number;

  @ApiProperty({ description: 'Count of closed / awarded / vendor selected RFQs', example: 3 })
  closedAwardedCount!: number;
}
