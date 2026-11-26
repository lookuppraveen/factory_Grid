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
  BuyerQuoteComparisonQueryDto,
  SelectQuoteComparisonPayloadDto,
} from './dto/buyer-quote-comparison.dto';

@ApiTags('Buyer Quote Comparison')
@ApiBearerAuth()
@Roles('BUYER', 'ROLE_BUYER', 'ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
@Controller('buyer/quote-comparisons')
export class BuyerQuoteComparisonController {
  constructor(private readonly service: RfqService) {}

  @Get()
  @ApiOperation({
    summary: 'List RFQs ready for Quote Comparison for the authenticated buyer',
    description: 'Returns buyer RFQs with computed manufacturer quotation response counts directly from PostgreSQL.',
  })
  @ApiOkResponse({ description: 'List of RFQs for quote comparison' })
  listQuoteComparisons(
    @CurrentUser() user: AuthUser,
    @Query() query: BuyerQuoteComparisonQueryDto,
  ) {
    return this.service.listQuoteComparisons(Number(user.id), user, query);
  }

  @Get(':rfqId')
  @ApiOperation({
    summary: 'Get full quote comparison detail matrix for a specific RFQ',
    description: 'Retrieves RFQ product lines and submitted manufacturer quotations with per-line pricing.',
  })
  @ApiParam({ name: 'rfqId', description: 'RFQ numeric ID or RFQ Number (e.g. RFQ-2026-1001)' })
  getQuoteComparisonDetail(
    @Param('rfqId') rfqId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.getQuoteComparisonDetail(rfqId, Number(user.id), user);
  }

  @Post(':rfqId/select')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Persist buyer manufacturer quotation selections per RFQ line',
    description: 'Saves preferred manufacturer quote line choices in PostgreSQL for downstream order fulfillment.',
  })
  @ApiParam({ name: 'rfqId', description: 'RFQ numeric ID or RFQ Number' })
  selectQuotesForRfq(
    @Param('rfqId') rfqId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SelectQuoteComparisonPayloadDto,
  ) {
    return this.service.selectQuotesForRfq(rfqId, Number(user.id), dto, user);
  }
}
