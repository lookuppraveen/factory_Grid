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
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser, CurrentUser, Public, Roles } from '@factorygrid/auth';
import {
  BulkImportProductMarginsDto,
  CalculateMarginDto,
  MarginQueryDto,
  SetCategoryMarginDto,
  SetManufacturerMarginDto,
  SetPlatformFeeDto,
  SetProductMarginDto,
} from './dto/margins.dto';
import { MarginsService } from './margins.service';

@ApiTags('Margin Engine & Commercial Pricing')
@Controller('margins')
export class MarginsController {
  constructor(private readonly marginsService: MarginsService) {}

  // =====================================================================
  // SUMMARY METRICS
  // =====================================================================

  @Public()
  @Get('summary')
  @ApiOperation({
    summary: 'Get consolidated Margin Engine summary metrics (Categories, Manufacturers, Products, Platform Fee)',
  })
  @ApiResponse({ status: 200, description: 'Summary statistics for Margin Engine dashboard' })
  async getSummary() {
    return this.marginsService.getSummary();
  }

  // =====================================================================
  // PLATFORM FEE
  // =====================================================================

  @Public()
  @Get('platform-fee')
  @ApiOperation({ summary: 'Get current active Platform Facilitation & Escrow Fee configuration' })
  async getPlatformFee() {
    return this.marginsService.getPlatformFee();
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('platform-fee')
  @ApiOperation({ summary: 'Admin: Update Platform Facilitation Fee (Percentage or Fixed Rate)' })
  async updatePlatformFee(
    @Body() dto: SetPlatformFeeDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.marginsService.updatePlatformFee(dto, user?.username || 'Admin');
  }

  // =====================================================================
  // 4-TIER MARGIN RESOLUTION CALCULATION
  // =====================================================================

  @Public()
  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate commercial selling price using 4-tier margin resolution engine (Product+Mfg > Mfg > Category > Default)',
  })
  async calculateApplicableMargin(@Body() dto: CalculateMarginDto) {
    return this.marginsService.calculateApplicableMargin(dto);
  }

  // =====================================================================
  // CATEGORY MARGINS
  // =====================================================================

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'List all Category Margin configurations (benchmark reference)' })
  async listCategoryMargins(@Query() query: MarginQueryDto) {
    return this.marginsService.listCategoryMargins(query);
  }

  @Public()
  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category margin by Category ID or Name' })
  @ApiParam({ name: 'id', description: 'Category ID or category name' })
  async getCategoryMargin(@Param('id') id: string) {
    return this.marginsService.getCategoryMargin(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('categories/:id')
  @ApiOperation({ summary: 'Admin: Set or update margin configuration for a Category' })
  @ApiParam({ name: 'id', description: 'Category ID or category name' })
  async setCategoryMargin(
    @Param('id') id: string,
    @Body() dto: SetCategoryMarginDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.marginsService.setCategoryMargin(id, dto, user?.username || 'Admin');
  }

  // =====================================================================
  // MANUFACTURER MARGINS
  // =====================================================================

  @Public()
  @Get('manufacturers')
  @ApiOperation({ summary: 'List all Manufacturer Margin configurations' })
  async listManufacturerMargins(@Query() query: MarginQueryDto) {
    return this.marginsService.listManufacturerMargins(query);
  }

  @Public()
  @Get('manufacturers/:id')
  @ApiOperation({ summary: 'Get manufacturer margin by Manufacturer ID or Name' })
  @ApiParam({ name: 'id', description: 'Manufacturer Registration ID' })
  async getManufacturerMargin(@Param('id') id: string) {
    return this.marginsService.getManufacturerMargin(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('manufacturers/:id')
  @ApiOperation({ summary: 'Admin: Set or update margin configuration for a Manufacturer' })
  @ApiParam({ name: 'id', description: 'Manufacturer Registration ID' })
  async setManufacturerMargin(
    @Param('id') id: string,
    @Body() dto: SetManufacturerMarginDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.marginsService.setManufacturerMargin(id, dto, user?.username || 'Admin');
  }

  // =====================================================================
  // PRODUCT / SKU MARGINS
  // =====================================================================

  @Public()
  @Get('products')
  @ApiOperation({ summary: 'List Product & SKU margins with pagination and search' })
  async listProductMargins(@Query() query: MarginQueryDto) {
    return this.marginsService.listProductMargins(query);
  }

  @Public()
  @Get('products/:productId')
  @ApiOperation({ summary: 'Get Product margin by Product ID' })
  @ApiParam({ name: 'productId', description: 'Product ID or Code' })
  async getProductMargin(@Param('productId') productId: string) {
    return this.marginsService.getProductMargin(productId);
  }

  @Public()
  @Get('products/:productId/manufacturers/:mfgId')
  @ApiOperation({ summary: 'Get margin for a specific Product and Manufacturer pair' })
  @ApiParam({ name: 'productId', description: 'Product ID or Code' })
  @ApiParam({ name: 'mfgId', description: 'Manufacturer Registration ID' })
  async getProductManufacturerMargin(
    @Param('productId') productId: string,
    @Param('mfgId') mfgId: string,
  ) {
    return this.marginsService.getProductMargin(productId, mfgId);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('products/:productId/manufacturers/:mfgId')
  @ApiOperation({ summary: 'Admin: Set margin for a specific Product and Manufacturer pair' })
  @ApiParam({ name: 'productId', description: 'Product ID or Code' })
  @ApiParam({ name: 'mfgId', description: 'Manufacturer Registration ID' })
  async setProductManufacturerMargin(
    @Param('productId') productId: string,
    @Param('mfgId') mfgId: string,
    @Body() dto: SetProductMarginDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.marginsService.setProductMargin(
      productId,
      mfgId,
      dto,
      user?.username || 'Admin',
    );
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post('products/import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Bulk import / upsert product margins (Excel / CSV upload)' })
  async bulkImportProductMargins(
    @Body() dto: BulkImportProductMarginsDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.marginsService.bulkImportProductMargins(dto, user?.username || 'Admin');
  }
}

