import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitArtworkLinkDto {
  @ApiProperty({
    description: 'Valid HTTPS or HTTP URL pointing to external artwork repository (Drive, Dropbox, OneDrive, etc.)',
    example: 'https://drive.google.com/file/d/12345/view',
  })
  @IsString()
  @IsNotEmpty()
  artworkUrl!: string;

  @ApiPropertyOptional({
    description: 'Sub-order identifier or code',
    example: 'SO-1001-01',
  })
  @IsOptional()
  @IsString()
  subOrderId?: string;

  @ApiPropertyOptional({
    description: 'Product name',
    example: 'Paracetamol 500mg Tablets',
  })
  @IsOptional()
  @IsString()
  productName?: string;
}

export class SubmitInHouseArtworkRequestDto {
  @ApiPropertyOptional({
    description: 'Notes or instructions for in-house packaging design team',
    example: 'Please prepare regulatory pharma packaging artwork with brand logo and batch details.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Sub-order identifier or code',
    example: 'SO-1001-01',
  })
  @IsOptional()
  @IsString()
  subOrderId?: string;

  @ApiPropertyOptional({
    description: 'Product name',
    example: 'Paracetamol 500mg Tablets',
  })
  @IsOptional()
  @IsString()
  productName?: string;
}

export class OrderArtworkResponseDto {
  @ApiProperty({ example: '1' })
  id!: string;

  @ApiProperty({ example: '10' })
  masterOrderId!: string;

  @ApiPropertyOptional({ example: '20' })
  subOrderId?: string | null;

  @ApiProperty({ example: 'p6' })
  productId!: string;

  @ApiPropertyOptional({ example: 'Paracetamol 500mg Tablets' })
  productName?: string | null;

  @ApiProperty({ example: 'UPLOAD', enum: ['UPLOAD', 'EXTERNAL_LINK', 'IN_HOUSE_REQUEST'] })
  submissionType!: string;

  @ApiPropertyOptional({ example: 'Packaging_Artwork_v1.pdf' })
  fileName?: string | null;

  @ApiPropertyOptional({ example: 'PDF Document (.pdf)' })
  fileType?: string | null;

  @ApiPropertyOptional({ example: '2.4 MB' })
  fileSize?: string | null;

  @ApiPropertyOptional({ example: '/api/v1/buyer/orders/artwork/files/1' })
  fileUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://drive.google.com/...' })
  externalUrl?: string | null;

  @ApiPropertyOptional({ example: 'Special instructions...' })
  instructions?: string | null;

  @ApiProperty({ example: 'SUBMITTED', enum: ['PENDING_UPLOAD', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IN_HOUSE_REQUESTED'] })
  status!: string;

  @ApiPropertyOptional({ example: null })
  reviewNotes?: string | null;

  @ApiPropertyOptional({ example: null })
  reviewedBy?: string | null;

  @ApiPropertyOptional({ example: null })
  reviewedAt?: string | null;

  @ApiPropertyOptional({ example: '30' })
  uploadedById?: string | null;

  @ApiPropertyOptional({ example: 'buyer12345' })
  uploadedByName?: string | null;

  @ApiProperty({ example: '2026-11-25T08:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-11-25T08:00:00.000Z' })
  updatedAt!: string;
}

export class MasterOrderArtworkSummaryDto {
  @ApiProperty({ example: '10' })
  masterOrderId!: string;

  @ApiProperty({ example: 4 })
  totalProducts!: number;

  @ApiProperty({ example: 3 })
  completedProducts!: number;

  @ApiProperty({ example: false })
  isFullyCompleted!: boolean;

  @ApiProperty({ type: [OrderArtworkResponseDto] })
  artworks!: OrderArtworkResponseDto[];
}
