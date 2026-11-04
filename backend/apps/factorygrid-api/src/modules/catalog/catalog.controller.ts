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
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Public, Roles } from '@factorygrid/auth';
import { CatalogService } from './catalog.service';
import {
  AttributeMasterQueryDto,
  BulkProductAttributesDto,
  CreateAttributeMasterDto,
  CreateProductPriceDto,
  MapProductManufacturerDto,
  UpdateAttributeMasterDto,
} from './dto/attribute-master.dto';
import {
  CreateCatalogProductDto,
  ProductQueryDto,
  UpdateCatalogProductDto,
} from './dto/catalog-product.dto';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './dto/category-admin.dto';
import {
  BulkProductTypeAttributesDto,
  CreateProductTypeDto,
  ProductTypeAttributeItemDto,
  ProductTypeQueryDto,
  UpdateProductTypeAttributeDto,
  UpdateProductTypeDto,
} from './dto/product-type.dto';

@ApiTags('Product Catalog & Category Master')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  // -------------------------------------------------------------------
  // PRODUCTS
  // -------------------------------------------------------------------

  @Public()
  @Get('products')
  @ApiOperation({
    summary: 'List master product catalog with filters',
    description: 'Publicly readable by buyers, manufacturers and admins with query filtering.',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'subCategory', required: false })
  @ApiQuery({ name: 'subSubCategory', required: false })
  @ApiQuery({ name: 'productTypeId', required: false })
  @ApiQuery({ name: 'lifecycleStatus', required: false })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  listProducts(@Query() query: ProductQueryDto) {
    return this.service.listProducts(query);
  }

  @Public()
  @Get('products/:id')
  @ApiOperation({ summary: 'Get single catalog product by ID or Code' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  getProduct(@Param('id') id: string) {
    return this.service.getProductById(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Admin: Create new central catalog product',
    description: 'Requires platform Administrator credentials. Persists directly into PostgreSQL.',
  })
  @ApiCreatedResponse({ description: 'Product created successfully' })
  createProduct(@Body() dto: CreateCatalogProductDto) {
    return this.service.createProduct(dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('products/:id')
  @ApiOperation({ summary: 'Admin: Update central catalog product' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  updateProduct(@Param('id') id: string, @Body() dto: UpdateCatalogProductDto) {
    return this.service.updateProduct(id, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Patch('products/:id/status')
  @ApiOperation({ summary: 'Admin: Toggle or update product lifecycle status' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  toggleProductStatus(@Param('id') id: string) {
    return this.service.toggleProductStatus(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Delete('products/:id')
  @ApiOperation({ summary: 'Admin: Delete or deactivate product' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  deleteProduct(@Param('id') id: string) {
    return this.service.deleteProduct(id);
  }

  @Public()
  @Get('products/:id/attributes')
  @ApiOperation({ summary: 'Get dynamic attributes for product' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  getProductAttributes(@Param('id') id: string) {
    return this.service.getProductAttributes(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('products/:id/attributes')
  @ApiOperation({ summary: 'Admin: Update dynamic attributes for product' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  saveProductAttributes(
    @Param('id') id: string,
    @Body() dto: BulkProductAttributesDto,
  ) {
    return this.service.syncProductAttributes(id, dto.attributes);
  }

  @Public()
  @Get('products/:id/prices')
  @ApiOperation({ summary: 'Get prices for product' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  getProductPrices(@Param('id') id: string) {
    return this.service.listProductPrices(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN', 'MANUFACTURER')
  @ApiBearerAuth()
  @Post('products/:id/prices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add product price definition' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  createProductPrice(
    @Param('id') id: string,
    @Body() dto: CreateProductPriceDto,
  ) {
    return this.service.createProductPrice({ ...dto, productId: id });
  }

  @Public()
  @Get('products/:id/manufacturers')
  @ApiOperation({ summary: 'Get manufacturer mappings for product' })
  @ApiParam({ name: 'id', description: 'Product ID or Product Code' })
  getProductManufacturers(@Param('id') id: string) {
    return this.service.listProductManufacturers(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN', 'MANUFACTURER')
  @ApiBearerAuth()
  @Post('products/:id/manufacturers')
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
  // CATEGORIES
  // -------------------------------------------------------------------

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'List Category -> Sub-Category -> Sub-Sub-Category hierarchy with pagination and filters' })
  listCategories(@Query() query: CategoryQueryDto) {
    return this.service.listCategories(query);
  }

  @Public()
  @Get('categories/:id')
  @ApiOperation({ summary: 'Get single category by ID or Code' })
  @ApiParam({ name: 'id', description: 'Category ID or category code' })
  getCategory(@Param('id') id: string) {
    return this.service.getCategoryById(id);
  }

  @Public()
  @Get('product-types')
  @ApiOperation({ summary: 'List all active product types from database with pagination and filters' })
  listProductTypes(@Query() query: ProductTypeQueryDto) {
    return this.service.listProductTypes(query);
  }

  @Public()
  @Get('product-types/:id')
  @ApiOperation({ summary: 'Get Product Type by ID or Code' })
  @ApiParam({ name: 'id', description: 'Product type ID or code' })
  getProductType(@Param('id') id: string) {
    return this.service.getProductTypeById(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post('product-types')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin: Create new Product Type' })
  createProductType(@Body() dto: CreateProductTypeDto) {
    return this.service.createProductType(dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('product-types/:id')
  @ApiOperation({ summary: 'Admin: Update Product Type' })
  updateProductType(@Param('id') id: string, @Body() dto: UpdateProductTypeDto) {
    return this.service.updateProductType(id, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Patch('product-types/:id/status')
  @ApiOperation({ summary: 'Admin: Toggle Product Type active/inactive status' })
  toggleProductTypeStatus(@Param('id') id: string) {
    return this.service.toggleProductTypeStatus(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Delete('product-types/:id')
  @ApiOperation({ summary: 'Admin: Delete Product Type' })
  deleteProductType(@Param('id') id: string) {
    return this.service.deleteProductType(id);
  }

  // -------------------------------------------------------------------
  // PRODUCT TYPE ATTRIBUTES (PRODUCT_TYPE_ATTRIBUTE)
  // -------------------------------------------------------------------

  @Public()
  @Get('product-types/:id/attributes')
  @ApiOperation({ summary: 'Get attributes applicable to this Product Type' })
  @ApiParam({ name: 'id', description: 'Product Type ID or Code' })
  getProductTypeAttributes(@Param('id') id: string) {
    return this.service.getProductTypeAttributes(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post('product-types/:id/attributes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin: Assign an attribute to this Product Type' })
  @ApiParam({ name: 'id', description: 'Product Type ID or Code' })
  assignProductTypeAttribute(
    @Param('id') id: string,
    @Body() dto: ProductTypeAttributeItemDto,
  ) {
    return this.service.assignProductTypeAttribute(id, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('product-types/:id/attributes')
  @ApiOperation({ summary: 'Admin: Bulk update assigned attributes for this Product Type' })
  @ApiParam({ name: 'id', description: 'Product Type ID or Code' })
  bulkUpdateProductTypeAttributes(
    @Param('id') id: string,
    @Body() dto: BulkProductTypeAttributesDto,
  ) {
    return this.service.bulkSaveProductTypeAttributes(id, dto.attributes);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('product-types/:id/attributes/:attributeId')
  @ApiOperation({ summary: 'Admin: Update attribute configuration for this Product Type' })
  @ApiParam({ name: 'id', description: 'Product Type ID or Code' })
  @ApiParam({ name: 'attributeId', description: 'Attribute ID or Code' })
  updateProductTypeAttribute(
    @Param('id') id: string,
    @Param('attributeId') attributeId: string,
    @Body() dto: UpdateProductTypeAttributeDto,
  ) {
    return this.service.updateProductTypeAttribute(id, attributeId, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Delete('product-types/:id/attributes/:attributeId')
  @ApiOperation({ summary: 'Admin: Remove attribute assignment from Product Type' })
  @ApiParam({ name: 'id', description: 'Product Type ID or Code' })
  @ApiParam({ name: 'attributeId', description: 'Attribute ID or Code' })
  removeProductTypeAttribute(
    @Param('id') id: string,
    @Param('attributeId') attributeId: string,
  ) {
    return this.service.removeProductTypeAttribute(id, attributeId);
  }

  // -------------------------------------------------------------------
  // CATEGORIES
  // -------------------------------------------------------------------

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin: Create new Category hierarchy record' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.service.createCategory(dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('categories/:id')
  @ApiOperation({ summary: 'Admin: Update Category record' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.updateCategory(id, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Patch('categories/:id/status')
  @ApiOperation({ summary: 'Admin: Toggle category status between ACTIVE and INACTIVE' })
  toggleCategoryStatus(@Param('id') id: string) {
    return this.service.toggleCategoryStatus(id);
  }

  // -------------------------------------------------------------------
  // ATTRIBUTE MASTER (/api/v1/catalog/attributes)
  // -------------------------------------------------------------------

  @Public()
  @Get('attributes')
  @ApiOperation({ summary: 'List reusable central attribute master definitions' })
  listAttributes(@Query() query: AttributeMasterQueryDto) {
    return this.service.listAttributes(query);
  }

  @Public()
  @Get('attributes/:id')
  @ApiOperation({ summary: 'Get attribute definition by ID or code' })
  getAttribute(@Param('id') id: string) {
    return this.service.getAttributeById(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post('attributes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin: Create new central reusable attribute' })
  createAttribute(@Body() dto: CreateAttributeMasterDto) {
    return this.service.createAttribute(dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('attributes/:id')
  @ApiOperation({ summary: 'Admin: Update attribute definition' })
  updateAttribute(@Param('id') id: string, @Body() dto: UpdateAttributeMasterDto) {
    return this.service.updateAttribute(id, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Patch('attributes/:id/status')
  @ApiOperation({ summary: 'Admin: Toggle attribute status' })
  toggleAttributeStatus(@Param('id') id: string) {
    return this.service.toggleAttributeStatus(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post('attributes/:id/product-types/:productTypeId')
  @ApiOperation({ summary: 'Admin: Assign attribute to Product Type' })
  @ApiParam({ name: 'id', description: 'Attribute ID or code' })
  @ApiParam({ name: 'productTypeId', description: 'Product Type ID or code' })
  assignAttributeToProductType(
    @Param('id') id: string,
    @Param('productTypeId') productTypeId: string,
    @Body() body?: { isRequired?: boolean; displayOrder?: number },
  ) {
    return this.service.assignProductTypeAttribute(productTypeId, {
      attributeId: id,
      isRequired: body?.isRequired ?? false,
      displayOrder: body?.displayOrder ?? 1,
    });
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Delete('attributes/:id/product-types/:productTypeId')
  @ApiOperation({ summary: 'Admin: Remove attribute from Product Type' })
  @ApiParam({ name: 'id', description: 'Attribute ID or code' })
  @ApiParam({ name: 'productTypeId', description: 'Product Type ID or code' })
  removeAttributeFromProductType(
    @Param('id') id: string,
    @Param('productTypeId') productTypeId: string,
  ) {
    return this.service.removeProductTypeAttribute(productTypeId, id);
  }
}
