import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Public profile of a user. Never includes the password hash. */
export class UserProfileDto {
  @ApiProperty({ example: 2, description: 'Internal numeric user ID' })
  id!: number;

  @ApiProperty({ example: 'USR-ADM-001', description: 'Business user code' })
  userCode!: string;

  @ApiProperty({ example: 'admin', description: 'Unique username' })
  username!: string;

  @ApiProperty({ example: 'admin@factorygrid.com', description: 'User corporate email' })
  email!: string;

  @ApiProperty({ example: 'System Administrator', description: 'Full user legal name' })
  fullName!: string;

  @ApiPropertyOptional({ example: '+919876543210', nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ example: 'FactoryGrid Platform', nullable: true })
  companyName!: string | null;

  @ApiPropertyOptional({ example: 'FG-HQ-001', nullable: true })
  companyCode!: string | null;

  @ApiPropertyOptional({ example: 'Executive IT & Security', nullable: true })
  department!: string | null;

  @ApiPropertyOptional({ example: 'Super Administrator', nullable: true })
  jobTitle!: string | null;

  @ApiProperty({ example: 'ACTIVE', description: 'Account lifecycle status' })
  accountStatus!: string;

  @ApiProperty({ example: ['ROLE_ADMIN'], type: [String], description: 'Assigned platform RBAC roles' })
  roles!: string[];

  @ApiPropertyOptional({ example: '2026-11-05T11:03:38.110Z', nullable: true })
  lastLoginAt!: string | null;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Signed JWT Bearer access token', example: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ description: 'Secure refresh token UUID', example: '0dcf40ed-cbc8-4432-aec0-f054e2747a30' })
  refreshToken!: string;

  @ApiProperty({ example: 'Bearer', description: 'Token scheme type' })
  tokenType!: string;

  @ApiProperty({ example: 86400000, description: 'Access token lifetime in milliseconds (24 hours)' })
  expiresIn!: number;

  @ApiProperty({ type: () => UserProfileDto, description: 'Authenticated user profile' })
  user!: UserProfileDto;
}

export class TokenRefreshResponseDto {
  @ApiProperty({ description: 'Newly generated signed JWT Bearer access token', example: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ description: 'Newly rotated refresh token UUID', example: 'e3f01b17-7a89-498c-bc5d-6e9a03970fd1' })
  refreshToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ example: 86400000, description: 'Access token lifetime in milliseconds' })
  expiresIn!: number;
}

export class RegistrationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'User account created successfully' })
  message!: string;

  @ApiProperty({ type: () => UserProfileDto })
  user!: UserProfileDto;

  @ApiProperty({ example: '2026-11-05T11:03:38.110Z' })
  timestamp!: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message!: string;

  @ApiProperty({ type: Object, nullable: true, example: null })
  data!: null;

  @ApiProperty({ example: '2026-11-05T11:03:38.110Z' })
  timestamp!: string;
}

export class UserListResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Users retrieved successfully' })
  message!: string;

  @ApiProperty({ type: () => [UserProfileDto] })
  data!: UserProfileDto[];

  @ApiProperty({ example: '2026-11-05T11:03:38.110Z' })
  timestamp!: string;
}

export class PortalAccessDataDto {
  @ApiProperty({ example: 'BUYER' })
  portal!: string;

  @ApiProperty({ example: 'buyer_pharma_01' })
  accessibleBy!: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'object', properties: { authority: { type: 'string' } } },
    example: [{ authority: 'ROLE_BUYER' }],
  })
  authorities!: Array<{ authority: string }>;

  @ApiProperty({ example: 'Welcome to Buyer Procurement Portal.' })
  message!: string;
}

export class PortalAccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Portal access granted' })
  message!: string;

  @ApiProperty({ type: () => PortalAccessDataDto })
  data!: PortalAccessDataDto;

  @ApiProperty({ example: '2026-11-05T11:03:38.110Z' })
  timestamp!: string;
}

export class PortalProfileResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Profile accessed' })
  message!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { username: 'buyer_pharma_01', role: 'BUYER' },
  })
  data!: Record<string, string>;

  @ApiProperty({ example: '2026-11-05T11:03:38.110Z' })
  timestamp!: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 401, description: 'HTTP status code' })
  status!: number;

  @ApiProperty({ example: 'Unauthorized', description: 'HTTP error title' })
  error!: string;

  @ApiProperty({ example: 'Invalid credentials or expired JWT token', description: 'Human-readable error message' })
  message!: string;

  @ApiProperty({ example: '2026-11-05T11:03:38.110Z', description: 'ISO 8601 error timestamp' })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/auth/login', description: 'Request URI path' })
  path!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Field-level validation error messages (present on 400 Bad Request)',
    example: { email: 'Please provide a valid email address' },
  })
  errors?: Record<string, string>;
}
