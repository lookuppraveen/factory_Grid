import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { IsNotBlank } from './not-blank';

export class BuyerRegistrationDto {
  /** @example buyer_pharma_01 */
  @Length(3, 50, { message: 'Username must be between 3 and 50 characters' })
  @IsNotBlank({ message: 'Username is required' })
  username!: string;

  /** @example buyer@pharmaco.in */
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotBlank({ message: 'Email is required' })
  email!: string;

  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotBlank({ message: 'Password is required' })
  password!: string;

  @IsNotBlank({ message: 'Full name is required' })
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotBlank({ message: 'Company name is required' })
  companyName!: string;

  /** Generated when omitted. */
  @IsOptional()
  @IsString()
  companyCode?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;
}

export class ManufacturerRegistrationDto extends BuyerRegistrationDto {
  /** Accepted for compatibility; stored by the partner module in Phase 2. */
  @IsOptional()
  @IsString()
  factoryDetails?: string;
}
