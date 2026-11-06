import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { IsNotBlank } from './not-blank';

export class LoginDto {
  @ApiProperty({
    description: 'Username or registered email address',
    example: 'admin@factorygrid.com',
  })
  @IsNotBlank({ message: 'Username or email is required' })
  usernameOrEmail!: string;

  @ApiProperty({
    description: 'Account password (minimum 8 characters)',
    example: 'Admin12345678',
    type: String,
    format: 'password',
  })
  @IsNotBlank({ message: 'Password is required' })
  password!: string;

  @ApiPropertyOptional({
    description: 'Optional portal check: BUYER, MANUFACTURER, SUPPLIER, or ADMIN',
    example: 'ADMIN',
  })
  @IsOptional()
  @IsString()
  portalType?: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Cryptographically secure refresh token UUID received from login or refresh',
    example: '0dcf40ed-cbc8-4432-aec0-f054e2747a30',
  })
  @IsNotBlank({ message: 'Refresh token is required' })
  refreshToken!: string;
}

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'Optional refresh token to revoke upon logout',
    example: '0dcf40ed-cbc8-4432-aec0-f054e2747a30',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
