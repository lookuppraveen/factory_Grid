import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '@factorygrid/auth';
import { ManufacturerProductService } from './manufacturer-product.service';
import {
  CreateManufacturerProductDto,
  ManufacturerProductQueryDto,
  UpdateManufacturerProductDto,
  UpdateManufacturerProductStatusDto,
} from './dto/manufacturer-product.dto';

@ApiTags('Manufacturer Product Catalog')
@ApiBearerAuth()
@Roles('MANUFACTURER', 'SUPPLIER', 'ROLE_MANUFACTURER', 'ROLE_SUPPLIER')
@Controller('manufacturer/products')
export class ManufacturerProductController {
  constructor(private readonly service: ManufacturerProductService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get summary statistics of mapped products for authenticated manufacturer',
  })
  getSummary(@CurrentUser() user: AuthUser) {
    return this.service.getSummary(user);
  }

  @Get()
  @ApiOperation({
    summary: 'List products mapped exclusively to authenticated manufacturer facility',
  })
  listMappedProducts(
    @CurrentUser() user: AuthUser,
    @Query() query: ManufacturerProductQueryDto,
  ) {
    return this.service.listMappedProducts(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single product mapping details by mapping ID' })
  @ApiParam({ name: 'id', description: 'Product mapping ID' })
  getMappingById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.getMappingById(user, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add product mapping from master catalogue to manufacturer facility',
  })
  @ApiCreatedResponse({ description: 'Product mapped successfully' })
  createMapping(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateManufacturerProductDto,
  ) {
    return this.service.createMapping(user, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update manufacturer-specific details of a mapped product' })
  @ApiParam({ name: 'id', description: 'Product mapping ID' })
  updateMapping(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateManufacturerProductDto,
  ) {
    return this.service.updateMapping(user, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate product mapping' })
  @ApiParam({ name: 'id', description: 'Product mapping ID' })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateManufacturerProductStatusDto,
  ) {
    return this.service.updateStatus(user, id, dto.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove product mapping from facility' })
  @ApiParam({ name: 'id', description: 'Product mapping ID' })
  deleteMapping(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.deleteMapping(user, id);
  }
}
