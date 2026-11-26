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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '@factorygrid/auth';
import { ManufacturerRfqService } from './manufacturer-rfq.service';
import {
  DeclineManufacturerRfqDto,
  ManufacturerRfqQueryDto,
  SubmitManufacturerQuoteDto,
} from './dto/manufacturer-rfq.dto';

@ApiTags('Manufacturer RFQs')
@ApiBearerAuth()
@Roles('MANUFACTURER', 'SUPPLIER', 'ROLE_MANUFACTURER', 'ROLE_SUPPLIER', 'ADMIN', 'ROLE_ADMIN')
@Controller('manufacturer/rfqs')
export class ManufacturerRfqController {
  constructor(private readonly service: ManufacturerRfqService) {}

  @Get()
  @ApiOperation({
    summary: 'List RFQs assigned to the authenticated manufacturer',
    description: 'Returns assigned RFQs from PostgreSQL with computed workflow status (ACTION NEEDED, DRAFT, SUBMITTED, DECLINED, EXPIRED).',
  })
  @ApiOkResponse({ description: 'List of assigned RFQs with status breakdown counts' })
  listAssignedRfqs(
    @CurrentUser() user: AuthUser,
    @Query() query: ManufacturerRfqQueryDto,
  ) {
    return this.service.listAssignedRfqs(user, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get single assigned RFQ with products and existing quote',
    description: 'Retrieves full RFQ details for quoting. Automatically marks assignment as VIEWED on first access.',
  })
  @ApiParam({ name: 'id', description: 'RFQ numeric ID' })
  getAssignedRfq(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.getAssignedRfqById(Number(id), user);
  }

  @Post(':id/quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit or draft a manufacturer quote for an assigned RFQ',
    description: 'Saves line-item pricing, tax, discount, delivery terms, or cannot-supply reasons into PostgreSQL.',
  })
  @ApiParam({ name: 'id', description: 'RFQ numeric ID' })
  submitQuote(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SubmitManufacturerQuoteDto,
  ) {
    return this.service.submitQuote(Number(id), dto, user);
  }

  @Post(':id/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Decline an assigned RFQ with reason and remarks',
  })
  @ApiParam({ name: 'id', description: 'RFQ numeric ID' })
  declineRfq(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: DeclineManufacturerRfqDto,
  ) {
    return this.service.declineRfq(Number(id), dto, user);
  }
}
