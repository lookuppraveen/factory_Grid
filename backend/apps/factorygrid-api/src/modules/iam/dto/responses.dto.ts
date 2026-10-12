import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Public profile of a user. Never includes the password hash. */
export class UserProfileDto {
  id!: number;
  userCode!: string;
  username!: string;
  email!: string;
  fullName!: string;
  phone!: string | null;
  companyName!: string | null;
  companyCode!: string | null;
  department!: string | null;
  jobTitle!: string | null;
  /** @example ACTIVE */
  accountStatus!: string;
  /** @example ["ROLE_BUYER"] */
  roles!: string[];
  lastLoginAt!: string | null;
}

export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  /** @example Bearer */
  tokenType!: string;
  /** Access token lifetime in milliseconds. */
  expiresIn!: number;
  user!: UserProfileDto;
}

export class TokenRefreshResponseDto {
  accessToken!: string;
  refreshToken!: string;
  /** @example Bearer */
  tokenType!: string;
  /** Access token lifetime in milliseconds. */
  expiresIn!: number;
}

export class RegistrationResponseDto {
  success!: boolean;
  message!: string;
  user!: UserProfileDto;
  timestamp!: string;
}

export class MessageResponseDto {
  success!: boolean;
  message!: string;
  @ApiProperty({ type: Object, nullable: true, example: null })
  data!: null;
  timestamp!: string;
}

export class UserListResponseDto {
  success!: boolean;
  message!: string;
  data!: UserProfileDto[];
  timestamp!: string;
}

export class PortalAccessDataDto {
  /** @example BUYER */
  portal!: string;
  accessibleBy!: string;
  @ApiProperty({
    type: 'array',
    items: { type: 'object', properties: { authority: { type: 'string' } } },
    example: [{ authority: 'ROLE_BUYER' }],
  })
  authorities!: { authority: string }[];
  message!: string;
}

export class PortalAccessResponseDto {
  success!: boolean;
  message!: string;
  data!: PortalAccessDataDto;
  timestamp!: string;
}

export class PortalProfileResponseDto {
  success!: boolean;
  message!: string;
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { username: 'buyer_pharma_01', role: 'BUYER' },
  })
  data!: Record<string, string>;
  timestamp!: string;
}

export class ErrorResponseDto {
  /** @example 401 */
  status!: number;
  /** @example Unauthorized */
  error!: string;
  message!: string;
  timestamp!: string;
  path!: string;
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Field-level messages, only on validation failures.',
    example: { email: 'Please provide a valid email address' },
  })
  errors?: Record<string, string>;
}
