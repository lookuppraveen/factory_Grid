import {
  Controller,
  Get,
  Param,
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
import { ManufacturerRfqService } from './manufacturer-rfq.service';
import { ManufacturerRfqQueryDto } from './dto/manufacturer-rfq.dto';

@ApiTags('Manufacturer Quotes')
@ApiBearerAuth()
@Roles('MANUFACTURER', 'SUPPLIER', 'ROLE_MANUFACTURER', 'ROLE_SUPPLIER', 'ADMIN', 'ROLE_ADMIN')
@Controller('manufacturer/quotes')
export class ManufacturerQuoteController {
  constructor(private readonly service: ManufacturerRfqService) {}

  @Get()
  @ApiOperation({
    summary: 'List commercial quotations submitted by the authenticated manufacturer',
    description: 'Returns real submitted quotations from PostgreSQL with summary KPIs and manufacturer isolation.',
  })
  @ApiOkResponse({ description: 'List of submitted quotations and summary commercial metrics' })
  listSubmittedQuotes(
    @CurrentUser() user: AuthUser,
    @Query() query: ManufacturerRfqQueryDto,
  ) {
    return this.service.listSubmittedQuotes(user, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get single submitted quotation with products and commercial details',
    description: 'Retrieves full details of a specific quotation submitted by the manufacturer.',
  })
  @ApiParam({ name: 'id', description: 'Quote ID or Quote Number (e.g. QUO-2026-1001)' })
  getSubmittedQuoteDetail(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.getSubmittedQuoteDetail(id, user);
  }
}
