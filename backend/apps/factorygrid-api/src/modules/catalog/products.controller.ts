import {
  Body,
  Controller,
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
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Public, Roles } from '@factorygrid/auth';
import { CatalogService } from './catalog.service';
import { CreateProductTaxDto, CreateProductUomDto } from './dto/pricing-tax-uom.dto';
import {
  BulkProductAttributesDto,
  CreateProductPriceDto,
  MapProductManufacturerDto,
} from './dto/attribute-master.dto';
import {
  CreateCatalogProductDto,
  ProductBulkUploadDto,
  ProductQueryDto,
  UpdateCatalogProductDto,
} from './dto/catalog-product.dto';

@ApiTags('Product Catalog & Master Data')
@Controller('products')
export class ProductsController {
  constructor(private readonly service: CatalogService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List master product catalog with filters and pagination',
    description: 'Public read-only formulation catalogue from PostgreSQL for buyers and marketplace users.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Text search by name, code, composition' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'subCategory', required: false })
  @ApiQuery({ name: 'subSubCategory', required: false })
  @ApiQuery({ name: 'dosageForm', required: false })
  @ApiQuery({ name: 'lifecycleStatus', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listProducts(@Query() query: ProductQueryDto) {
    return this.service.listProducts(query);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search products by query string' })
  @ApiQuery({ name: 'q', required: false })
  searchProducts(@Query('q') q?: string, @Query() rest?: ProductQueryDto) {
    return this.service.listProducts({ ...rest, search: q || rest?.search });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get single catalog product by ID or Code' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  getProduct(@Param('id') id: string) {
    return this.service.getProductById(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin: Create new central catalog product' })
  @ApiCreatedResponse({ description: 'Product created successfully' })
  createProduct(@Body() dto: CreateCatalogProductDto) {
    return this.service.createProduct(dto);
  }
  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post('bulk-upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Bulk upload products into central catalog' })
  bulkUploadProducts(@Body() dto: ProductBulkUploadDto) {
    return this.service.bulkUploadProducts(dto);
  }


  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Admin: Update central catalog product' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  updateProduct(@Param('id') id: string, @Body() dto: UpdateCatalogProductDto) {
    return this.service.updateProduct(id, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin: Toggle or update product lifecycle status' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  toggleProductStatus(@Param('id') id: string) {
    return this.service.toggleProductStatus(id);
  }

  // -------------------------------------------------------------------
  // DYNAMIC PRODUCT ATTRIBUTES
  // -------------------------------------------------------------------

  @Public()
  @Get(':id/attributes')
  @ApiOperation({ summary: 'Get dynamic attributes for product' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  getProductAttributes(@Param('id') id: string) {
    return this.service.getProductAttributes(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put(':id/attributes')
  @ApiOperation({ summary: 'Admin: Update dynamic attributes for product' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  saveProductAttributes(
    @Param('id') id: string,
    @Body() dto: BulkProductAttributesDto,
  ) {
    return this.service.syncProductAttributes(id, dto.attributes);
  }

  // -------------------------------------------------------------------
  // PRODUCT PRICES
  // -------------------------------------------------------------------

  @Public()
  @Get(':id/prices')
  @ApiOperation({ summary: 'Get price list for product' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  getProductPrices(@Param('id') id: string) {
    return this.service.listProductPrices(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN', 'MANUFACTURER')
  @ApiBearerAuth()
  @Post(':id/prices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add product price definition' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  createProductPrice(
    @Param('id') id: string,
    @Body() dto: CreateProductPriceDto,
  ) {
    return this.service.createProductPrice({ ...dto, productId: id });
  }

  // -------------------------------------------------------------------
  // MANUFACTURER MAPPINGS
  // -------------------------------------------------------------------

  @Public()
  @Get(':id/manufacturers')
  @ApiOperation({ summary: 'Get manufacturer mappings for product' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  getProductManufacturers(@Param('id') id: string) {
    return this.service.listProductManufacturers(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN', 'MANUFACTURER')
  @ApiBearerAuth()
  @Post(':id/manufacturers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Map product to manufacturer' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  mapProductManufacturer(
    @Param('id') id: string,
    @Body() dto: MapProductManufacturerDto,
  ) {
    return this.service.mapProductManufacturer(id, dto);
  }

  // -------------------------------------------------------------------
  // PRODUCT TAXES
  // -------------------------------------------------------------------

  @Public()
  @Get(':id/taxes')
  @ApiOperation({ summary: 'Get tax list for product' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  getProductTaxes(@Param('id') id: string) {
    return this.service.listProductTaxes(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post(':id/taxes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add product tax definition' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  createProductTax(
    @Param('id') id: string,
    @Body() dto: CreateProductTaxDto,
  ) {
    return this.service.createProductTax({ ...dto, productId: id });
  }

  // -------------------------------------------------------------------
  // PRODUCT UOMS
  // -------------------------------------------------------------------

  @Public()
  @Get(':id/uoms')
  @ApiOperation({ summary: 'Get UOM list for product' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  getProductUoms(@Param('id') id: string) {
    return this.service.listProductUoms(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post(':id/uoms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add product UOM definition' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  createProductUom(
    @Param('id') id: string,
    @Body() dto: CreateProductUomDto,
  ) {
    return this.service.createProductUom({ ...dto, productId: id });
  }
}
