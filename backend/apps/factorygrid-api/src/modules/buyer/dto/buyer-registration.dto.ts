import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export const BUSINESS_TYPES = [
  'PCD Franchise',
  'PCD Franchise Customer',
  'PCD',
  'Third Party Manufacturing (TPM)',
  'Third Party Manufacturing',
  'TPM',
  'Distributor',
  'DISTRIBUTOR',
  'Wholesaler',
  'WHOLESALER',
  'Hospital',
  'HOSPITAL',
  'Export',
  'Export Customer',
  'EXPORT',
  'Export House',
  'Private Limited',
  'Public Limited',
  'Partnership Firm',
  'Proprietorship',
  'Healthcare Institution',
  'Registered Enterprise',
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export class PcdDetailsDto {
  @ApiPropertyOptional({ example: 'North Zone' })
  @IsOptional()
  @IsString()
  territory?: string;

  @ApiPropertyOptional({ example: 'Delhi NCR' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'South Delhi' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  monopolyRights?: boolean;

  @ApiPropertyOptional({ example: 'Cardiology, Diabetology, General Formulations' })
  @IsOptional()
  @IsString()
  brandPortfolio?: string;
}

export class TpmDetailsDto {
  @ApiPropertyOptional({ example: 'BioCure Formulations' })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiPropertyOptional({ example: 'Alu-Alu Packaging' })
  @IsOptional()
  @IsString()
  packagingRequirements?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  artworkApproval?: boolean;

  @ApiPropertyOptional({ example: 'Form 25/28 License Required' })
  @IsOptional()
  @IsString()
  regulatoryRequirements?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  moqAgreement?: boolean;
}

export class DistributorDetailsDto {
  @ApiPropertyOptional({ example: 'Regional Territory' })
  @IsOptional()
  @IsString()
  distributionTerritory?: string;

  @ApiPropertyOptional({ example: 'Retail Pharmacy & Hospitals' })
  @IsOptional()
  @IsString()
  salesChannel?: string;

  @ApiPropertyOptional({ example: 'Central Warehouse (10,000 sq ft)' })
  @IsOptional()
  @IsString()
  warehouseLocations?: string;
}

export class HospitalDetailsDto {
  @ApiPropertyOptional({ example: 'Central Clinical Procurement' })
  @IsOptional()
  @IsString()
  procurementDepartment?: string;

  @ApiPropertyOptional({ example: 'TENDER-2026-88' })
  @IsOptional()
  @IsString()
  tenderReference?: string;

  @ApiPropertyOptional({ example: 'Valid till Dec 2027' })
  @IsOptional()
  @IsString()
  contractValidity?: string;
}

export class WholesalerDetailsDto {
  @ApiPropertyOptional({ example: '5,000 sq ft' })
  @IsOptional()
  @IsString()
  storageCapacitySqFt?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  coldChainStorage?: boolean;

  @ApiPropertyOptional({ example: '25 Retail Outlets' })
  @IsOptional()
  @IsString()
  networkSize?: string;
}

export class ExportDetailsDto {
  @ApiPropertyOptional({ example: 'LATAM, Southeast Asia' })
  @IsOptional()
  @IsString()
  targetRegions?: string;

  @ApiPropertyOptional({ example: '0304991204' })
  @IsOptional()
  @IsString()
  iecCode?: string;
}

export class Step1CompanyDto {
  @ApiProperty({ description: 'Registered company name', example: 'Apex Care Pharma Ltd' })
  @IsNotEmpty({ message: 'Company name is required' })
  @IsString()
  companyName!: string;

  @ApiProperty({
    description: 'Business model type',
    enum: BUSINESS_TYPES,
    example: 'PCD Franchise',
  })
  @IsNotEmpty({ message: 'Business type is required' })
  @IsIn(BUSINESS_TYPES, { message: 'Invalid business type option' })
  businessType!: BusinessType;

  @ApiProperty({
    description: '15-character Goods and Services Tax Identification Number (GSTIN)',
    example: '07AAAAA0000A1Z5',
  })
  @IsNotEmpty({ message: 'GST Number is required' })
  @IsString()
  gstNumber!: string;

  @ApiProperty({
    description: '10-character Permanent Account Number (PAN)',
    example: 'AAAAA0000A',
  })
  @IsNotEmpty({ message: 'PAN Number is required' })
  @IsString()
  panNumber!: string;

  @ApiProperty({
    description: 'State / Central Drug License number (Form 20B/21B)',
    example: 'DL-20B/21B/2024/991',
  })
  @IsNotEmpty({ message: 'Drug License Number is required' })
  @IsString()
  drugLicenseNumber!: string;

  @ApiPropertyOptional({
    description: 'Corporate Identification Number (CIN)',
    example: 'U24232DL2020PTC361234',
  })
  @IsOptional()
  @IsString()
  cinNumber?: string;

  @ApiPropertyOptional({
    description: 'Official corporate website URL',
    example: 'https://apexpharma.in',
  })
  @IsOptional()
  @IsString()
  website?: string;
}

export class Step2ContactDto {
  @ApiProperty({ description: 'Primary contact person or representative', example: 'Vikram Mehta' })
  @IsNotEmpty({ message: 'Contact person is required' })
  @IsString()
  contactPerson!: string;

  @ApiProperty({ description: 'Designation / job title of contact person', example: 'Director' })
  @IsNotEmpty({ message: 'Designation is required' })
  @IsString()
  designation!: string;

  @ApiProperty({ description: 'Mobile / Phone number', example: '+91 98765 43210' })
  @IsNotEmpty({ message: 'Mobile number is required' })
  @IsString()
  mobileNumber!: string;

  @ApiProperty({ description: 'Corporate email address', example: 'vikram@apexpharma.in' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email!: string;

  @ApiPropertyOptional({ description: 'Buyer account password', example: 'Password@123' })
  @IsOptional()
  @IsString()
  password?: string;
}

export class Step3AddressDto {
  @ApiProperty({ description: 'Registered Billing Address', example: 'Plot 45, Okhla Industrial Area Phase III' })
  @IsNotEmpty({ message: 'Billing address is required' })
  @IsString()
  billingAddress!: string;

  @ApiProperty({ description: 'Shipping / Delivery Warehouse Address', example: 'Warehouse 2, Kundli Industrial Corridor' })
  @IsNotEmpty({ message: 'Shipping address is required' })
  @IsString()
  shippingAddress!: string;

  @ApiProperty({ description: 'State', example: 'Delhi' })
  @IsNotEmpty({ message: 'State is required' })
  @IsString()
  state!: string;

  @ApiProperty({ description: 'Country', default: 'India', example: 'India' })
  @IsOptional()
  @IsString()
  country: string = 'India';

  @ApiProperty({ description: '6-digit Postal Pincode', example: '110020' })
  @IsNotEmpty({ message: 'Pincode is required' })
  @IsString()
  pincode!: string;

  @ApiPropertyOptional({ description: 'PCD Franchise specific details' })
  @IsOptional()
  pcdDetails?: PcdDetailsDto;

  @ApiPropertyOptional({ description: 'Third Party Manufacturing specific details' })
  @IsOptional()
  tpmDetails?: TpmDetailsDto;

  @ApiPropertyOptional({ description: 'Distributor specific details' })
  @IsOptional()
  distributorDetails?: DistributorDetailsDto;

  @ApiPropertyOptional({ description: 'Hospital specific details' })
  @IsOptional()
  hospitalDetails?: HospitalDetailsDto;

  @ApiPropertyOptional({ description: 'Wholesaler specific details' })
  @IsOptional()
  wholesalerDetails?: WholesalerDetailsDto;

  @ApiPropertyOptional({ description: 'Export specific details' })
  @IsOptional()
  exportDetails?: ExportDetailsDto;
}

export class DocumentItemDto {
  @ApiProperty({ example: 'GST Certificate' })
  @IsString()
  documentType!: string;

  @ApiProperty({ example: 'GST_Certificate_Apex.pdf' })
  @IsString()
  fileName!: string;

  @ApiPropertyOptional({ example: '1.2 MB' })
  @IsOptional()
  @IsString()
  fileSize?: string;

  @ApiPropertyOptional({ example: 'Valid' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageKey?: string;
}

export class BuyerFullRegistrationDto {
  @ApiProperty({
    description: 'Registration code returned by step-1; links the submission to the saved draft and uploaded documents',
    example: 'REG-BUYER-3F9A1C7D2B4E6A80',
  })
  @IsNotEmpty({ message: 'registrationCode is required' })
  @IsString()
  registrationCode!: string;

  // Step 1: Company & Regulatory Information
  @ApiProperty({ description: 'Registered company name', example: 'Apex Care Pharma Ltd' })
  @IsNotEmpty({ message: 'Company name is required' })
  @IsString()
  companyName!: string;

  @ApiProperty({
    description: 'Business model type',
    enum: BUSINESS_TYPES,
    example: 'PCD Franchise',
  })
  @IsNotEmpty({ message: 'Business type is required' })
  @IsIn(BUSINESS_TYPES, { message: 'Invalid business type option' })
  businessType!: BusinessType;

  @ApiProperty({
    description: 'Goods and Services Tax Identification Number (GSTIN)',
    example: '07AAAAA0000A1Z5',
  })
  @IsNotEmpty({ message: 'GST Number is required' })
  @IsString()
  gstNumber!: string;

  @ApiProperty({
    description: 'Permanent Account Number (PAN)',
    example: 'AAAAA0000A',
  })
  @IsNotEmpty({ message: 'PAN Number is required' })
  @IsString()
  panNumber!: string;

  @ApiProperty({
    description: 'State / Central Drug License number (Form 20B/21B)',
    example: 'DL-20B/21B/2024/991',
  })
  @IsNotEmpty({ message: 'Drug License Number is required' })
  @IsString()
  drugLicenseNumber!: string;

  @ApiPropertyOptional({
    description: 'Corporate Identification Number (CIN)',
    example: 'U24232DL2020PTC361234',
  })
  @IsOptional()
  @IsString()
  cinNumber?: string;

  @ApiPropertyOptional({
    description: 'Official corporate website URL',
    example: 'https://apexpharma.in',
  })
  @IsOptional()
  @IsString()
  website?: string;

  // Step 2: Contact Information
  @ApiProperty({ description: 'Primary contact person or representative', example: 'Vikram Mehta' })
  @IsNotEmpty({ message: 'Contact person is required' })
  @IsString()
  contactPerson!: string;

  @ApiProperty({ description: 'Designation / job title of contact person', example: 'Director' })
  @IsNotEmpty({ message: 'Designation is required' })
  @IsString()
  designation!: string;

  @ApiProperty({ description: 'Mobile / Phone number', example: '+91 98765 43210' })
  @IsNotEmpty({ message: 'Mobile number is required' })
  @IsString()
  mobileNumber!: string;

  @ApiProperty({ description: 'Corporate email address', example: 'vikram@apexpharma.in' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email!: string;

  // Optional Account Credentials for IAM login creation
  @ApiPropertyOptional({ description: 'Account username (generated from email if omitted)', example: 'vikram_apex' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Account password (default generated if omitted)', example: 'Password@123' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'Company code (auto-generated if omitted)', example: 'APEX01' })
  @IsOptional()
  @IsString()
  companyCode?: string;

  @ApiPropertyOptional({ description: 'Department', example: 'Procurement' })
  @IsOptional()
  @IsString()
  department?: string;

  // Step 3: Address & Parameters
  @ApiProperty({ description: 'Registered Billing Address', example: 'Plot 45, Okhla Industrial Area Phase III' })
  @IsNotEmpty({ message: 'Billing address is required' })
  @IsString()
  billingAddress!: string;

  @ApiProperty({ description: 'Shipping / Warehouse Address', example: 'Warehouse 2, Kundli Industrial Corridor' })
  @IsNotEmpty({ message: 'Shipping address is required' })
  @IsString()
  shippingAddress!: string;

  @ApiProperty({ description: 'State', example: 'Delhi' })
  @IsNotEmpty({ message: 'State is required' })
  @IsString()
  state!: string;

  @ApiProperty({ description: 'Country', default: 'India', example: 'India' })
  @IsOptional()
  @IsString()
  country: string = 'India';

  @ApiProperty({ description: '6-digit Postal Pincode', example: '110020' })
  @IsNotEmpty({ message: 'Pincode is required' })
  @IsString()
  pincode!: string;

  @ApiPropertyOptional({ description: 'PCD Franchise specific details' })
  @IsOptional()
  pcdDetails?: PcdDetailsDto;

  @ApiPropertyOptional({ description: 'Third Party Manufacturing specific details' })
  @IsOptional()
  tpmDetails?: TpmDetailsDto;

  @ApiPropertyOptional({ description: 'Distributor specific details' })
  @IsOptional()
  distributorDetails?: DistributorDetailsDto;

  @ApiPropertyOptional({ description: 'Hospital specific details' })
  @IsOptional()
  hospitalDetails?: HospitalDetailsDto;

  @ApiPropertyOptional({ description: 'Wholesaler specific details' })
  @IsOptional()
  wholesalerDetails?: WholesalerDetailsDto;

  @ApiPropertyOptional({ description: 'Export specific details' })
  @IsOptional()
  exportDetails?: ExportDetailsDto;

  // Step 4 documents are NOT part of this payload: they are uploaded through
  // POST /buyer/documents/upload and verified server-side at submission.

  // Step 5: Submission Confirmation
  @ApiPropertyOptional({ description: 'Confirmation of data accuracy checkbox', default: true })
  @IsOptional()
  confirmAccurate?: boolean;
}

export class StepResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Step saved successfully' })
  message!: string;

  @ApiProperty({ example: 'REG-BUYER-172889201923' })
  registrationCode!: string;

  @ApiProperty({ example: 1 })
  currentStep!: number;
}
