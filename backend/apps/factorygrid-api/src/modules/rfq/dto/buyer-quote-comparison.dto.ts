import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class BuyerQuoteComparisonQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Search term for RFQ number, customer, or product' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class SelectQuoteLineItemDto {
  @ApiProperty({ description: 'RFQ Line ID' })
  @IsString()
  rfqLineId!: string;

  @ApiProperty({ description: 'Selected Quote Line ID' })
  @IsString()
  quoteLineId!: string;

  @ApiProperty({ description: 'Selected Quote ID' })
  @IsString()
  quoteId!: string;

  @ApiProperty({ description: 'Selected Manufacturer ID' })
  @IsString()
  manufacturerId!: string;

  @ApiPropertyOptional({ description: 'Selected Unit Price' })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Selected MOQ' })
  @IsOptional()
  @IsNumber()
  moq?: number;

  @ApiPropertyOptional({ description: 'Selected Lead Time Days' })
  @IsOptional()
  @IsNumber()
  leadTimeDays?: number;
}

export class SelectQuoteComparisonPayloadDto {
  @ApiProperty({ description: 'Array of line selections', type: [SelectQuoteLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectQuoteLineItemDto)
  selections!: SelectQuoteLineItemDto[];
}
