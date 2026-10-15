import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class AutoValidationResultDto {
  @ApiProperty({ example: 'Valid' })
  gstCheck!: string;

  @ApiProperty({ example: 'Valid' })
  panCheck!: string;

  @ApiProperty({ example: 'Valid' })
  requiredDocsCheck!: string;

  @ApiProperty({ example: 'Valid' })
  requiredFieldsCheck!: string;

  @ApiProperty({ example: 'Valid' })
  overallStatus!: string;

  @ApiProperty({
    example: [
      'GSTIN structure format verified.',
      'PAN structure format verified.',
      'All 6 required onboarding documents present.',
      'Required corporate details populated.',
    ],
  })
  validationDetails!: string[];
  @ApiPropertyOptional({ example: false, description: 'True if verified against official government portal' })
  governmentVerified?: boolean;

  @ApiPropertyOptional({ example: true, description: 'True if accepted for testing purpose' })
  testingAccepted?: boolean;
}

export class CustomerVerificationResponseDto {
  @ApiProperty({ example: 'CUS-VER-101' })
  requestCode!: string;

  @ApiProperty({ example: 'Vikram Mehta' })
  customerName!: string;

  @ApiProperty({ example: 'Apex Care Pharma Ltd' })
  companyName!: string;

  @ApiProperty({ example: 'PCD' })
  customerType!: string;

  @ApiProperty({ example: 'Under Review' })
  verificationStatus!: string;

  @ApiPropertyOptional({ example: 'Rajesh Kumar (Compliance Desk A)' })
  assignedComplianceOfficer?: string;

  @ApiProperty({ type: AutoValidationResultDto })
  autoValidation!: AutoValidationResultDto;

  @ApiPropertyOptional({ example: 'CUS000101' })
  customerCode?: string;

  @ApiProperty({ example: '2026-10-13T10:00:00.000Z' })
  createdAt!: string;
}

export class ApproveVerificationDto {
  @ApiPropertyOptional({ example: 'CUS000101', description: 'Generated customer code if custom' })
  customerCode?: string;
}

export class RejectVerificationDto {
  @ApiProperty({ example: 'Drug License expired or invalid', description: 'Reason for rejection' })
  rejectionReason!: string;
}

export class RequestMoreDocsDto {
  @ApiProperty({ example: ['Please provide updated Form 20B/21B renewal certificate'], type: [String] })
  notes!: string[];
}

export class ReviewDocumentDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED', 'NEEDS_REPLACEMENT'], example: 'REJECTED', description: 'Review decision for document' })
  @IsIn(['APPROVED', 'REJECTED', 'NEEDS_REPLACEMENT'])
  decision!: 'APPROVED' | 'REJECTED' | 'NEEDS_REPLACEMENT';

  @ApiPropertyOptional({ example: 'Seal missing or document blurred', description: 'Mandatory if rejected or replacement requested' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ example: 'Rajesh Kumar (Compliance Desk A)', description: 'Auditor or officer who reviewed the document (defaults to the authenticated reviewer)' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  reviewer?: string;
}
