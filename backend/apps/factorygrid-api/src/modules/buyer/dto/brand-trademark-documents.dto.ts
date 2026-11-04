import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BuyerBrandDocumentDto {
  @ApiProperty({ example: '1' })
  id!: string;

  @ApiProperty({ example: '14' })
  userId!: string;

  @ApiPropertyOptional({ example: '17' })
  registrationId?: string | null;

  @ApiProperty({ example: 'CROCIN PLUS' })
  brandName!: string;

  @ApiPropertyOptional({ example: 'SKU-CP-01' })
  brandReference?: string | null;

  @ApiProperty({ example: 'Letter of Authorization (LOA)' })
  documentType!: string;

  @ApiPropertyOptional({ example: 'LOA-2026-001' })
  documentNumber?: string | null;

  @ApiPropertyOptional({ example: 'Paracetamol & Caffeine Tablets (500mg/65mg)' })
  dosageForm?: string | null;

  @ApiPropertyOptional({ example: 'TM-908124' })
  tmRegistrationNo?: string | null;

  @ApiPropertyOptional({ example: '2026-01-01' })
  issueDate?: string | null;

  @ApiPropertyOptional({ example: '2028-01-01' })
  expiryDate?: string | null;

  @ApiProperty({ example: 'LOA_Signed.pdf' })
  fileName!: string;

  @ApiProperty({ example: 1048576 })
  fileSize!: number;

  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @ApiProperty({ example: 'UNDER REVIEW' })
  status!: string;

  @ApiPropertyOptional()
  checks?: Record<string, string> | null;

  @ApiPropertyOptional()
  rejectionReason?: string | null;

  @ApiPropertyOptional()
  authNotes?: string | null;

  @ApiPropertyOptional()
  reviewedBy?: string | null;

  @ApiPropertyOptional()
  reviewedAt?: string | null;

  @ApiPropertyOptional()
  approvedAt?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class BuyerTrademarkDocumentDto {
  @ApiProperty({ example: '1' })
  id!: string;

  @ApiProperty({ example: '14' })
  userId!: string;

  @ApiPropertyOptional({ example: '17' })
  registrationId?: string | null;

  @ApiProperty({ example: 'CROCIN PLUS' })
  trademarkName!: string;

  @ApiProperty({ example: 'TM-908124' })
  tmNumber!: string;

  @ApiProperty({ example: 'Class 5 (Pharmaceuticals & Medicinal Preparations)' })
  tmClass!: string;

  @ApiProperty({ example: 'Trademark Registration Certificate' })
  documentType!: string;

  @ApiProperty({ example: 'Customer Uploaded TM Certificate' })
  verificationSource!: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  issueDate?: string | null;

  @ApiPropertyOptional({ example: '2030-10-15' })
  expiryDate?: string | null;

  @ApiProperty({ example: 'TM_Certificate.pdf' })
  fileName!: string;

  @ApiProperty({ example: 2097152 })
  fileSize!: number;

  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @ApiProperty({ example: 'UNDER REVIEW' })
  status!: string;

  @ApiPropertyOptional()
  checks?: Record<string, string> | null;

  @ApiPropertyOptional()
  conflictNotes?: string | null;

  @ApiPropertyOptional()
  rejectionReason?: string | null;

  @ApiPropertyOptional()
  reviewedBy?: string | null;

  @ApiPropertyOptional()
  reviewedAt?: string | null;

  @ApiPropertyOptional()
  approvedAt?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
