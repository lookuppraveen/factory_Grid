import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateGalleryEntryDto {
  @ApiProperty({ description: 'Photo title or section of plant', example: 'Sterile Injectable Filling Line - Cleanroom ISO 5' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ description: 'Detailed description of the facility area or equipment shown' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Photo capture date (YYYY-MM-DD)', example: '2026-03-15' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'captureDate must be YYYY-MM-DD' })
  captureDate?: string;

  @ApiProperty({ description: 'Factory plant address or specific wing/block', example: 'Block B, Pashamylaram Plant, Unit II' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  factoryLocation!: string;

  @ApiPropertyOptional({ description: 'Optional GPS coordinates, only with consent', example: '17.5324° N, 78.1822° E' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  gpsCoordinates?: string;

  @ApiPropertyOptional({ description: 'Registration code if not inferred from session' })
  @IsOptional()
  @IsString()
  registrationCode?: string;
}

export class UpdateGalleryEntryDto {
  @ApiPropertyOptional({ description: 'Updated title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Photo capture date (YYYY-MM-DD)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'captureDate must be YYYY-MM-DD' })
  captureDate?: string;

  @ApiPropertyOptional({ description: 'Updated factory location' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  factoryLocation?: string;

  @ApiPropertyOptional({ description: 'Updated GPS coordinates' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  gpsCoordinates?: string;
}

export class FactoryGalleryEntryDto {
  @ApiProperty() id!: string;
  @ApiProperty() registrationCode!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() description!: string | null;
  @ApiProperty() fileName!: string;
  @ApiProperty() fileSize!: number;
  @ApiProperty() mimeType!: string;
  @ApiProperty() storageKey!: string;
  @ApiProperty() imageUrl!: string;
  @ApiPropertyOptional() captureDate!: string | null;
  @ApiProperty() factoryLocation!: string;
  @ApiPropertyOptional() gpsCoordinates!: string | null;
  @ApiProperty() uploadedBy!: string;
  @ApiProperty() verificationStatus!: string;
  @ApiPropertyOptional() reviewedBy!: string | null;
  @ApiPropertyOptional() reviewedAt!: string | null;
  @ApiPropertyOptional() rejectionReason!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class CreateAchievementDto {
  @ApiProperty({ description: 'Achievement or award title', example: 'National Quality Excellence Award' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  title!: string;

  @ApiProperty({ description: 'Award type or recognition category', example: 'QUALITY_EXCELLENCE' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  awardType!: string;

  @ApiProperty({ description: 'Issuing or recognizing organization', example: 'Indian Pharma Quality Forum (IPQF)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  issuingOrganization!: string;

  @ApiProperty({ description: 'Date of issuance (YYYY-MM-DD)', example: '2025-11-20' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'issueDate must be YYYY-MM-DD' })
  issueDate!: string;

  @ApiPropertyOptional({ description: 'Expiry date if applicable (YYYY-MM-DD)', example: '2028-11-19' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'expiryDate must be YYYY-MM-DD' })
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Detailed summary of the achievement or audit benchmark' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Registration code if not inferred from session' })
  @IsOptional()
  @IsString()
  registrationCode?: string;
}

export class UpdateAchievementDto {
  @ApiPropertyOptional({ description: 'Updated title' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  title?: string;

  @ApiPropertyOptional({ description: 'Updated award type' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  awardType?: string;

  @ApiPropertyOptional({ description: 'Updated issuing organization' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  issuingOrganization?: string;

  @ApiPropertyOptional({ description: 'Date of issuance (YYYY-MM-DD)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'issueDate must be YYYY-MM-DD' })
  issueDate?: string;

  @ApiPropertyOptional({ description: 'Expiry date if applicable (YYYY-MM-DD)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'expiryDate must be YYYY-MM-DD' })
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class ManufacturerAchievementDto {
  @ApiProperty() id!: string;
  @ApiProperty() registrationCode!: string;
  @ApiProperty() title!: string;
  @ApiProperty() awardType!: string;
  @ApiProperty() issuingOrganization!: string;
  @ApiProperty() issueDate!: string;
  @ApiPropertyOptional() expiryDate!: string | null;
  @ApiPropertyOptional() description!: string | null;
  @ApiProperty() hasCertificate!: boolean;
  @ApiPropertyOptional() certificateFileName!: string | null;
  @ApiPropertyOptional() certificateFileSize!: number | null;
  @ApiPropertyOptional() certificateMimeType!: string | null;
  @ApiPropertyOptional() certificateUrl!: string | null;
  @ApiProperty() verificationStatus!: string;
  @ApiPropertyOptional() reviewedBy!: string | null;
  @ApiPropertyOptional() reviewedAt!: string | null;
  @ApiPropertyOptional() rejectionReason!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class ReviewSubmissionDto {
  @ApiProperty({ enum: ['VERIFIED', 'REJECTED'] })
  @IsEnum(['VERIFIED', 'REJECTED'])
  decision!: 'VERIFIED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Mandatory reason if rejected' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
