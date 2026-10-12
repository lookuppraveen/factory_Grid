import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '@factorygrid/auth';
import { ok } from '@factorygrid/errors';
import { AuthService } from './auth.service';
import {
  ErrorResponseDto,
  PortalAccessResponseDto,
  PortalProfileResponseDto,
  UserListResponseDto,
} from './dto/responses.dto';

const authorities = (user: AuthUser) => user.roles.map((authority) => ({ authority }));

@ApiTags('Admin Governance')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly auth: AuthService) {}

  @Roles('ADMIN')
  @Get('users')
  @ApiOperation({ summary: 'List all users', description: 'Admin only.' })
  @ApiOkResponse({ type: UserListResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async users(@CurrentUser() user: AuthUser): Promise<UserListResponseDto> {
    return ok(`Users retrieved successfully by Admin: ${user.username}`, await this.auth.listUsers()) as UserListResponseDto;
  }
}

/** Role-isolation checks for the buyer portal, kept from the Java service. */
@ApiTags('Buyer Access Isolation')
@ApiBearerAuth()
@Roles('BUYER')
@Controller('buyer')
export class BuyerAccessController {
  @Get('dashboard')
  @ApiOperation({ summary: 'Buyer portal access check' })
  @ApiOkResponse({ type: PortalAccessResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  dashboard(@CurrentUser() user: AuthUser): PortalAccessResponseDto {
    return ok('Buyer portal access granted', {
      portal: 'BUYER',
      accessibleBy: user.username,
      authorities: authorities(user),
      message: 'Welcome to Buyer Procurement Portal. Manufacturer access is strictly denied.',
    }) as PortalAccessResponseDto;
  }

  @Get('profile')
  @ApiOperation({ summary: 'Buyer profile access check' })
  @ApiOkResponse({ type: PortalProfileResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  profile(@CurrentUser() user: AuthUser): PortalProfileResponseDto {
    return ok('Buyer profile accessed', { username: user.username, role: 'BUYER' }) as PortalProfileResponseDto;
  }
}

/** Role-isolation checks for the manufacturer portal, kept from the Java service. */
@ApiTags('Manufacturer Access Isolation')
@ApiBearerAuth()
@Roles('SUPPLIER', 'MANUFACTURER')
@Controller('manufacturer')
export class ManufacturerAccessController {
  @Get('dashboard')
  @ApiOperation({ summary: 'Manufacturer portal access check' })
  @ApiOkResponse({ type: PortalAccessResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  dashboard(@CurrentUser() user: AuthUser): PortalAccessResponseDto {
    return ok('Manufacturer portal access granted', {
      portal: 'MANUFACTURER',
      accessibleBy: user.username,
      authorities: authorities(user),
      message: 'Welcome to Manufacturer Workspace. Buyer access is strictly denied.',
    }) as PortalAccessResponseDto;
  }

  @Get('profile')
  @ApiOperation({ summary: 'Manufacturer profile access check' })
  @ApiOkResponse({ type: PortalProfileResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  profile(@CurrentUser() user: AuthUser): PortalProfileResponseDto {
    return ok('Manufacturer profile accessed', {
      username: user.username,
      role: 'SUPPLIER/MANUFACTURER',
    }) as PortalProfileResponseDto;
  }
}
