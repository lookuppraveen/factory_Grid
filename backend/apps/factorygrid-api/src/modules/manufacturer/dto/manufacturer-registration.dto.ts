import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
  IsIn,
} from 'class-validator';

/** Document categories in manufacturer onboarding.
 * Mandatory: mfgLicense, gmpCert (GLP), whoGmpCert (WHO-GLP), isoCert, pollutionCert.
 * Optional: factoryReg (retained for historical data), otherCert (allows uploading additional certificates).
 */
export const MANUFACTURER_DOCUMENT_CATEGORIES = [
  { key: 'mfgLicense', name: 'Manufacturing License', isMandatory: true },
  { key: 'gmpCert', name: 'GLP Certificate', isMandatory: true },
  { key: 'whoGmpCert', name: 'WHO-GLP Certificate', isMandatory: true },
  { key: 'isoCert', name: 'ISO Certification', isMandatory: true },
  { key: 'pollutionCert', name: 'Pollution Certificate', isMandatory: true },
  { key: 'factoryReg', name: 'Factory Registration', isMandatory: false },
  { key: 'otherCert', name: 'Other Certificates', isMandatory: false },
] as const;

export const MANDATORY_MANUFACTURER_DOCUMENT_KEYS = [
  'mfgLicense',
  'gmpCert',
  'whoGmpCert',
  'isoCert',
  'pollutionCert',
] as const;

export const MANUFACTURER_CATEGORY_KEYS = MANUFACTURER_DOCUMENT_CATEGORIES.map((c) => c.key);

/** Accepts either the wizard key (glpCert, gmpCert, pollutionCert, otherCert, etc.) or the display name. */
export function resolveManufacturerCategory(raw: string): { key: string; name: string } | undefined {
  const needle = (raw || '').trim().toLowerCase();
  if (['glpcert', 'gmpcert', 'glp certificate', 'gmp certificate', 'glp', 'gmp'].includes(needle)) {
    return { key: 'gmpCert', name: 'GLP Certificate' };
  }
  if (['whoglpcert', 'whogmpcert', 'who-glp certificate', 'who-gmp certificate', 'who glp certificate', 'who gmp certificate', 'who-glp', 'who-gmp', 'whogmp', 'whoglp'].includes(needle)) {
    return { key: 'whoGmpCert', name: 'WHO-GLP Certificate' };
  }
  if (['pollutioncert', 'pollution certificate', 'pollution control clearance'].includes(needle)) {
    return { key: 'pollutionCert', name: 'Pollution Certificate' };
  }
  if (['factoryreg', 'factory registration', 'factory cert'].includes(needle)) {
    return { key: 'factoryReg', name: 'Factory Registration' };
  }
  if (['othercert', 'other certificates', 'other certificate', 'other'].includes(needle) || needle.startsWith('othercert')) {
    return { key: 'otherCert', name: 'Other Certificates' };
  }
  return MANUFACTURER_DOCUMENT_CATEGORIES.find(
    (c) => c.key.toLowerCase() === needle || c.name.toLowerCase() === needle,
  );
}

const PHONE_REGEX = /^[+0-9][0-9 ()-]{6,24}$/;

export class ManufacturerStep1Dto {
  @ApiProperty({ example: 'SunBio LifeSciences Pvt. Ltd.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  companyName!: string;

  @ApiProperty({ example: 'Plot 42, IDA Pashamylaram, Phase III' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  facilityAddress!: string;

  @ApiProperty({ example: 'Hyderabad' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'Telangana' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state!: string;

  @ApiProperty({ example: '502307', description: '6-digit Indian pincode' })
  @Matches(/^[1-9][0-9]{5}$/, { message: 'pincode must be a valid 6-digit pincode' })
  pincode!: string;

  @ApiPropertyOptional({ example: '10,000,000 Units / Month', description: 'Plant manufacturing capacity (optional)' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  mfgCapacity?: string;

  @ApiProperty({ example: 'Dr. Vikram Sethi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  contactPerson!: string;

  @ApiProperty({ example: 'Plant Head / Director' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  designation!: string;

  @ApiProperty({ example: 'plant@sunbiolabs.com', description: 'Email address (also the login identifier)' })
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @ApiProperty({ example: '+91 98765 43210' })
  @Matches(PHONE_REGEX, { message: 'phone must be a valid mobile number' })
  phone!: string;
}

export class ManufacturerDocumentDatesDto {
  @ApiProperty({ example: 'mfgLicense', enum: MANUFACTURER_CATEGORY_KEYS })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ example: '2023-04-15', description: 'ISO date (YYYY-MM-DD); must not be in the future' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'issueDate must be YYYY-MM-DD' })
  issueDate!: string;

  @ApiProperty({ example: '2028-04-14', description: 'ISO date (YYYY-MM-DD); must be after issueDate and not already expired' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'expiryDate must be YYYY-MM-DD' })
  expiryDate!: string;
}

export class ManufacturerStep2Dto {
  @ApiProperty({ type: [ManufacturerDocumentDatesDto], description: 'Issue/expiry dates for the uploaded certifications' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManufacturerDocumentDatesDto)
  documents!: ManufacturerDocumentDatesDto[];
}

export class ManufacturerStep3Dto {
  @ApiPropertyOptional({ type: [String], example: ['cat-tablets', 'cat-capsules'], description: 'Manufacturing category IDs' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String], example: ['p1', 'p2'], description: 'Catalogue product IDs; replaces the saved selection' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  productIds?: string[];
}

export class ManufacturerSupplyItemDto {
  @ApiPropertyOptional({ example: 'p1' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ example: 'cat-tablets' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 1000, description: 'Batch Size / Minimum order quantity (positive integer)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2_000_000_000)
  batchSize?: number;

  @ApiPropertyOptional({ example: 1000, description: 'Minimum order quantity (positive integer)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2_000_000_000)
  moq?: number;

  @ApiPropertyOptional({ example: 14, description: 'Delivery schedule in days (positive integer)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  deliveryScheduleDays?: number;

  @ApiPropertyOptional({ example: 14, description: 'Typical production delivery schedule in days (positive integer)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  leadTimeDays?: number;
}

export class ManufacturerStep4Dto {
  @ApiProperty({ type: [ManufacturerSupplyItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManufacturerSupplyItemDto)
  items!: ManufacturerSupplyItemDto[];
}

export class ManufacturerSubmitDto {
  @ApiProperty({ example: 'REG-MFG-1A2B3C4D5E6F7A8B' })
  @IsString()
  @IsNotEmpty()
  registrationCode!: string;

  @ApiProperty({ example: 'Str0ngPass!', minLength: 8, description: 'Password for the manufacturer portal login (stored as a bcrypt hash)' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: true, description: 'Declaration that all information and documents are accurate' })
  @IsBoolean()
  confirmAccurate!: boolean;
}

export class ManufacturerReviewDocumentDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED', 'NEEDS_REPLACEMENT'], example: 'REJECTED' })
  @IsIn(['APPROVED', 'REJECTED', 'NEEDS_REPLACEMENT'])
  decision!: 'APPROVED' | 'REJECTED' | 'NEEDS_REPLACEMENT';

  @ApiPropertyOptional({ example: 'Certificate is blurred', description: 'Mandatory when rejected or replacement is requested' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ManufacturerStepResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Company details saved successfully' })
  message!: string;

  @ApiProperty({ example: 'REG-MFG-1A2B3C4D5E6F7A8B' })
  registrationCode!: string;

  @ApiProperty({ example: 1 })
  currentStep!: number;
}

export class ManufacturerDocumentResponseDto {
  @ApiProperty({ example: '12' })
  id!: string;

  @ApiProperty({ example: 'DOC-12' })
  documentCode!: string;

  @ApiProperty({ example: 'mfgLicense', enum: MANUFACTURER_CATEGORY_KEYS })
  category!: string;

  @ApiProperty({ example: 'Manufacturing License' })
  categoryDisplayName!: string;

  @ApiProperty({ example: 'MFG_License.pdf' })
  fileName!: string;

  @ApiProperty({ example: 120331 })
  fileSize!: number;

  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @ApiProperty({ example: '2023-04-15' })
  issueDate!: string;

  @ApiProperty({ example: '2028-04-14' })
  expiryDate!: string;

  @ApiProperty({ enum: ['PENDING', 'VALID', 'REJECTED', 'NEEDS_REPLACEMENT', 'SUPERSEDED'], example: 'PENDING' })
  status!: string;

  @ApiPropertyOptional({ example: 'Certificate is blurred' })
  rejectionReason?: string | null;

  @ApiPropertyOptional({ example: 'admin' })
  reviewedBy?: string | null;

  @ApiPropertyOptional({ example: '2026-10-14T10:00:00.000Z' })
  reviewedAt?: string | null;

  @ApiPropertyOptional({ example: 'REJECTED' })
  reviewDecision?: string | null;

  @ApiProperty({ example: 1 })
  version!: number;

  @ApiProperty({ example: '2026-10-14T10:00:00.000Z' })
  uploadedAt!: string;
}
