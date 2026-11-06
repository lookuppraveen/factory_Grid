import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '@factorygrid/auth';
import { RfqService } from './rfq.service';
import { CreateRfqDto, UpdateRfqDto } from './dto/rfq.dto';

@ApiTags('Buyer')
@ApiBearerAuth()
@Roles('BUYER', 'ROLE_BUYER', 'ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
@Controller('buyer/rfqs')
export class RfqController {
  constructor(private readonly service: RfqService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create or draft a new Buyer RFQ',
    description: 'Creates an RFQ bound to the authenticated buyer identity. Automatically assigns sequential RFQ number.',
  })
  @ApiCreatedResponse({ description: 'RFQ created successfully' })
  createRfq(@CurrentUser() user: AuthUser, @Body() dto: CreateRfqDto) {
    return this.service.createRfq(Number(user.id), dto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'List RFQs for current authenticated buyer',
    description: 'Returns all RFQs belonging to the authenticated buyer. Administrators can view all RFQs.',
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (Draft, Submitted, etc.)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for RFQ number, company, or product' })
  listRfqs(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listRfqs(Number(user.id), user, { status, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single RFQ details with product lines' })
  @ApiParam({ name: 'id', description: 'RFQ numeric ID' })
  getRfq(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.getRfqById(Number(id), Number(user.id), user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing draft RFQ' })
  @ApiParam({ name: 'id', description: 'RFQ numeric ID' })
  updateRfq(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateRfqDto,
  ) {
    return this.service.updateRfq(Number(id), Number(user.id), dto, user);
  }

  @Post(':id/submit')
  @ApiOperation({
    summary: 'Submit a valid draft RFQ for pricing and manufacturer distribution',
  })
  @ApiParam({ name: 'id', description: 'RFQ numeric ID' })
  submitRfq(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() _body?: Record<string, unknown>,
  ) {
    return this.service.submitRfq(Number(id), Number(user.id), user);
  }

  @Post(':id/match')
  @ApiOperation({
    summary: 'Run AI/Rule-based manufacturer matching against real PostgreSQL records',
    description: 'Matches eligible manufacturers for products in the RFQ. Does NOT submit the RFQ.',
  })
  @ApiParam({ name: 'id', description: 'RFQ numeric ID' })
  matchManufacturers(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() _body?: Record<string, unknown>,
  ) {
    return this.service.matchManufacturers(Number(id), Number(user.id), user);
  }
}
