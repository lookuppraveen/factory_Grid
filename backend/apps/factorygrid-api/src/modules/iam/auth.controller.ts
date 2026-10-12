import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser, Public } from '@factorygrid/auth';
import { ok } from '@factorygrid/errors';
import { AuthService } from './auth.service';
import { LoginDto, LogoutDto, RefreshTokenDto } from './dto/login.dto';
import { BuyerRegistrationDto, ManufacturerRegistrationDto } from './dto/register.dto';
import {
  AuthResponseDto,
  ErrorResponseDto,
  MessageResponseDto,
  RegistrationResponseDto,
  TokenRefreshResponseDto,
  UserProfileDto,
} from './dto/responses.dto';

/** Brute-force protection on the public credential endpoints: 10 requests a minute per IP. */
const CREDENTIAL_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('Authentication & Registration')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle(CREDENTIAL_LIMIT)
  @Post('register/buyer')
  @ApiOperation({ summary: 'Register a buyer account', description: 'Creates a user with ROLE_BUYER only.' })
  @ApiCreatedResponse({ type: RegistrationResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Validation failed' })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'Username or email already exists' })
  registerBuyer(@Body() dto: BuyerRegistrationDto): Promise<RegistrationResponseDto> {
    return this.auth.registerBuyer(dto);
  }

  @Public()
  @Throttle(CREDENTIAL_LIMIT)
  @Post('register/manufacturer')
  @ApiOperation({
    summary: 'Register a manufacturer account',
    description: 'Creates a user with ROLE_MANUFACTURER and ROLE_SUPPLIER.',
  })
  @ApiCreatedResponse({ type: RegistrationResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Validation failed' })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'Username or email already exists' })
  registerManufacturer(@Body() dto: ManufacturerRegistrationDto): Promise<RegistrationResponseDto> {
    return this.auth.registerManufacturer(dto);
  }

  @Public()
  @Throttle(CREDENTIAL_LIMIT)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in',
    description: 'Checks the password and returns an access token, a refresh token and the user profile.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Invalid credentials or portal not allowed' })
  @ApiForbiddenResponse({ type: ErrorResponseDto, description: 'Account inactive' })
  @ApiResponse({ status: 423, type: ErrorResponseDto, description: 'Account locked after 5 failed attempts' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.auth.login(dto);
  }

  @Public()
  @Throttle(CREDENTIAL_LIMIT)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh the access token', description: 'Rotates the refresh token: the old one is revoked.' })
  @ApiOkResponse({ type: TokenRefreshResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Refresh token unknown, revoked or expired' })
  refresh(@Body() dto: RefreshTokenDto): Promise<TokenRefreshResponseDto> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign out', description: 'Revokes the given refresh token.' })
  @ApiOkResponse({ type: MessageResponseDto })
  async logout(@Body() dto: LogoutDto): Promise<MessageResponseDto> {
    await this.auth.logout(dto?.refreshToken);
    return ok('User logged out successfully and refresh token revoked') as MessageResponseDto;
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Current user profile' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  me(@CurrentUser() user: AuthUser): Promise<UserProfileDto> {
    return this.auth.getProfile(user.username);
  }
}
