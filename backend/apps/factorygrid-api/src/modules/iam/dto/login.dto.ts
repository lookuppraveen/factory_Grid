import { IsOptional, IsString } from 'class-validator';
import { IsNotBlank } from './not-blank';

export class LoginDto {
  /** @example admin */
  @IsNotBlank({ message: 'Username or email is required' })
  usernameOrEmail!: string;

  @IsNotBlank({ message: 'Password is required' })
  password!: string;

  /** Optional portal check: BUYER, MANUFACTURER, SUPPLIER, FG_STAFF, STAFF or ADMIN. */
  @IsOptional()
  @IsString()
  portalType?: string;
}

export class RefreshTokenDto {
  @IsNotBlank({ message: 'Refresh token is required' })
  refreshToken!: string;
}

export class LogoutDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
