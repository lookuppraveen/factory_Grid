import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const MANDATORY_DOCUMENT_CATEGORIES = [
  'GST Certificate',
  'Drug License',
  'PAN Card',
  'Incorporation Certificate',
  'Cancelled Cheque',
  'Signed Agreement',
] as const;

export type MandatoryDocumentCategory = (typeof MANDATORY_DOCUMENT_CATEGORIES)[number];

export const CATEGORY_KEY_MAP: Record<string, MandatoryDocumentCategory> = {
  gstCert: 'GST Certificate',
  drugLicense: 'Drug License',
  panCard: 'PAN Card',
  incCert: 'Incorporation Certificate',
  cancelledCheque: 'Cancelled Cheque',
  signedAgreement: 'Signed Agreement',
  'GST Certificate': 'GST Certificate',
  'Drug License': 'Drug License',
  'PAN Card': 'PAN Card',
  'Incorporation Certificate': 'Incorporation Certificate',
  'Cancelled Cheque': 'Cancelled Cheque',
  'Signed Agreement': 'Signed Agreement',
};

export class UploadDocumentResponseDto {
  @ApiProperty({ example: '1' })
  id!: string;

  @ApiProperty({ example: 'DOC-GST-172889201923' })
  documentCode!: string;

  @ApiProperty({ example: '1' })
  registrationId!: string;

  @ApiProperty({ example: 'GST Certificate', enum: MANDATORY_DOCUMENT_CATEGORIES })
  category!: string;

  @ApiProperty({ example: 'GST Certificate' })
  categoryDisplayName!: string;

  @ApiProperty({ example: 'GST_Registration_Cert.pdf' })
  fileName!: string;

  @ApiProperty({ example: 1258291 })
  fileSize!: number;

  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @ApiProperty({ example: 'VALID' })
  status!: string;

  @ApiPropertyOptional({ example: 'Document illegible or missing seal' })
  rejectionReason?: string;

  @ApiPropertyOptional({ example: 'Rajesh Kumar (Compliance Desk A)' })
  reviewedBy?: string;

  @ApiPropertyOptional({ example: '2026-10-14T10:00:00.000Z' })
  reviewedAt?: string;

  @ApiPropertyOptional({ example: 'REJECTED' })
  reviewDecision?: string;

  @ApiPropertyOptional({ example: 1 })
  version?: number;

  @ApiProperty({ example: '2026-10-13T10:00:00.000Z' })
  uploadedAt!: string;
}

export class DocumentUploadQueryDto {
  @ApiProperty({
    description: 'Category of regulatory document',
    enum: MANDATORY_DOCUMENT_CATEGORIES,
    example: 'GST Certificate',
  })
  category!: string;

  @ApiPropertyOptional({
    description: 'Existing registration code or ID to associate with',
    example: 'REG-BUYER-172889201923',
  })
  registrationCode?: string;
}
