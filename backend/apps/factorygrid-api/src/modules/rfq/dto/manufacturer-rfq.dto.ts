import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SubmitQuoteLineDto {
  @ApiProperty({ description: 'RFQ Line ID reference' })
  @IsString()
  rfqLineId!: string;

  @ApiPropertyOptional({ description: 'Product ID' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ description: 'Product Name' })
  @IsString()
  productName!: string;

  @ApiProperty({
    description: 'Line response type',
    enum: ['QUOTE', 'CANNOT_SUPPLY'],
    default: 'QUOTE',
  })
  @IsEnum(['QUOTE', 'CANNOT_SUPPLY'])
  responseType!: 'QUOTE' | 'CANNOT_SUPPLY';

  @ApiProperty({ description: 'Quoted Quantity', minimum: 1 })
  @IsNumber()
  @Min(1)
  quotedQuantity!: number;

  @ApiPropertyOptional({ description: 'Unit Price in INR', minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum Order Quantity', minimum: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  moq?: number;

  @ApiPropertyOptional({ description: 'Production Lead Time in Days', minimum: 1, default: 14 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Tax/GST percentage', minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxPercent?: number;

  @ApiPropertyOptional({ description: 'Discount percentage', minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Delivery terms per line' })
  @IsOptional()
  @IsString()
  deliveryTerms?: string;

  @ApiPropertyOptional({ description: 'Reason for cannot supply' })
  @IsOptional()
  @IsString()
  cannotSupplyReason?: string;

  @ApiPropertyOptional({ description: 'Additional remarks for cannot supply' })
  @IsOptional()
  @IsString()
  cannotSupplyRemarks?: string;

  @ApiPropertyOptional({ description: 'Item remarks or packaging details' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class SubmitManufacturerQuoteDto {
  @ApiPropertyOptional({
    description: 'Quotation Status (DRAFT or SUBMITTED)',
    enum: ['DRAFT', 'SUBMITTED'],
    default: 'SUBMITTED',
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'SUBMITTED'])
  status?: 'DRAFT' | 'SUBMITTED';

  @ApiPropertyOptional({ description: 'Quote Validity Date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Delivery Terms (e.g. Ex-Factory, FOB, CIF)' })
  @IsOptional()
  @IsString()
  deliveryTerms?: string;

  @ApiPropertyOptional({ description: 'Payment Terms (e.g. 30 Days Net, Advance 20%)' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'General remarks or manufacturer notes' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({
    description: 'Line item quotations',
    type: [SubmitQuoteLineDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitQuoteLineDto)
  lines!: SubmitQuoteLineDto[];
}

export class DeclineManufacturerRfqDto {
  @ApiProperty({ description: 'Decline Reason' })
  @IsString()
  declineReason!: string;

  @ApiPropertyOptional({ description: 'Additional remarks on decline' })
  @IsOptional()
  @IsString()
  declineRemarks?: string;
}

export class ManufacturerRfqQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by status (ACTION_NEEDED, DRAFT, SUBMITTED, DECLINED, EXPIRED, ALL)',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Search term for RFQ number or product' })
  @IsOptional()
  @IsString()
  search?: string;
}
