import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { IsNotBlank } from './not-blank';

export class BuyerRegistrationDto {
  @ApiProperty({
    description: 'Desired username (3 to 50 characters)',
    example: 'pharma_buyer_01',
    minLength: 3,
    maxLength: 50,
  })
  @Length(3, 50, { message: 'Username must be between 3 and 50 characters' })
  @IsNotBlank({ message: 'Username is required' })
  username!: string;

  @ApiProperty({
    description: 'Official corporate email address',
    example: 'buyer01@testpharma.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotBlank({ message: 'Email is required' })
  email!: string;

  @ApiProperty({
    description: 'Account password (minimum 8 characters)',
    example: 'Buyer12345678',
    minLength: 8,
    type: String,
    format: 'password',
  })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotBlank({ message: 'Password is required' })
  password!: string;

  @ApiProperty({
    description: 'Full legal name of the user',
    example: 'Vikramaditya Sharma',
  })
  @IsNotBlank({ message: 'Full name is required' })
  fullName!: string;

  @ApiPropertyOptional({
    description: 'Contact telephone number',
    example: '+919876543210',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Company or business legal name',
    example: 'Apex Healthcare Pvt Ltd',
  })
  @IsNotBlank({ message: 'Company name is required' })
  companyName!: string;

  @ApiPropertyOptional({
    description: 'Company registration or tracking code (auto-generated if omitted)',
    example: 'APEX-HC-001',
  })
  @IsOptional()
  @IsString()
  companyCode?: string;

  @ApiPropertyOptional({
    description: 'Department within company',
    example: 'Central Procurement',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: 'Official job title',
    example: 'Head of Sourcing',
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;
}

export class ManufacturerRegistrationDto extends BuyerRegistrationDto {
  @ApiPropertyOptional({
    description: 'Manufacturing facility details and plant location notes',
    example: 'Plant 1: Formulation unit at Baddi, Himachal Pradesh. WHO-GMP accredited.',
  })
  @IsOptional()
  @IsString()
  factoryDetails?: string;
}
