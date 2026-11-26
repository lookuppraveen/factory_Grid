import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '@factorygrid/auth';
import { RfqService } from './rfq.service';
import {
  AdminRfqQueryDto,
  AdminRfqStatsResponseDto,
  SubmitGenericAdminPricingDto,
} from './dto/admin-rfq.dto';

@ApiTags('Admin RFQs')
@ApiBearerAuth()
@Roles('ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
@Controller('admin/rfqs')
export class AdminRfqController {
  constructor(private readonly service: RfqService) {}

  @Get()
  @ApiOperation({
    summary: 'List all RFQs with quote counts and line formulations for Admin Monitoring',
    description: 'Returns real RFQs from PostgreSQL with full line items, quotes received, price ranges, and status.',
  })
  @ApiOkResponse({ description: 'List of all RFQs for Admin Monitoring' })
  listAdminRfqs(@Query() query: AdminRfqQueryDto) {
    return this.service.listAdminRfqs(query);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get dynamic Admin RFQ dashboard statistics directly from PostgreSQL',
    description: 'Computes real Total RFQs, Generic Requests, Branded RFQs, Active/Quoted, and Closed/Awarded counts.',
  })
  @ApiOkResponse({
    description: 'Aggregated KPI statistics for the Admin RFQ Monitor',
    type: AdminRfqStatsResponseDto,
  })
  getAdminRfqStats(): Promise<AdminRfqStatsResponseDto> {
    return this.service.getAdminRfqStats();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get full RFQ inspection details by ID or RFQ Number',
    description: 'Returns RFQ header, product lines, buyer info, and submitted manufacturer quotes with per-line pricing.',
  })
  @ApiParam({ name: 'id', description: 'RFQ numeric ID or RFQ Number (e.g. RFQ-2026-1001)' })
  getAdminRfqDetail(@Param('id') id: string) {
    return this.service.getAdminRfqDetail(id);
  }

  @Post(':id/generic-pricing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save and persist Admin Generic Medicine pricing in PostgreSQL',
    description: 'Applies internal price list rates to generic RFQ lines, generates/updates a platform quotation, and sets RFQ status to Quoted.',
  })
  @ApiParam({ name: 'id', description: 'RFQ numeric ID or RFQ Number (e.g. RFQ-2026-1001)' })
  submitGenericPricing(
    @Param('id') id: string,
    @Body() dto: SubmitGenericAdminPricingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.submitGenericAdminPricing(id, dto, user);
  }

  @Get(':id/quotes')
  @ApiOperation({
    summary: 'Get all manufacturer quotes submitted for this RFQ from PostgreSQL',
    description: 'Retrieves actual submitted quotes, manufacturer details, and line-item pricing.',
  })
  @ApiParam({ name: 'id', description: 'RFQ numeric ID or RFQ Number (e.g. RFQ-2026-1001)' })
  getQuotesForRfq(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.getQuotesForAdminRfq(id, user);
  }
}
