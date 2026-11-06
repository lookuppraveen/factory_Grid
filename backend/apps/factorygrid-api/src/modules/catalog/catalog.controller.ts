import {
  BrandQueryDto,
  CreateBrandDto,
  UpdateBrandDto,
  CreateAdminManufacturerDto,
  UpdateAdminManufacturerDto,
  ManufacturerQueryDto,
  CreateProductManufacturerMappingDto,
  UpdateProductManufacturerMappingDto,
  ProductManufacturerMappingQueryDto,
} from './dto/brand-mfg-mapping.dto';
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
  ProductBulkUploadDto,
  ProductQueryDto,
  UpdateCatalogProductDto,
} from './dto/catalog-product.dto';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './dto/category-admin.dto';
import {
  CreateCustomerSegmentDto,
  CreatePriceDto,
  CreateProductTaxDto,
  CreateProductUomDto,
  ProductPriceQueryDto,
  ProductTaxQueryDto,
  ProductUomQueryDto,
  UpdateCustomerSegmentDto,
  UpdatePriceDto,
  UpdateProductTaxDto,
  UpdateProductUomDto,
} from './dto/pricing-tax-uom.dto';
import {
  BulkProductTypeAttributesDto,
  CreateProductTypeDto,
  ProductTypeAttributeItemDto,
  ProductTypeQueryDto,
  UpdateProductTypeAttributeDto,
  UpdateProductTypeDto,
} from './dto/product-type.dto';

@ApiTags('Product Catalog & Master Data')
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
  @Post('products/bulk-upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Bulk upload products into central catalog' })
  bulkUploadProducts(@Body() dto: ProductBulkUploadDto) {
    return this.service.bulkUploadProducts(dto);
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

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Delete('categories/:id')
  @ApiOperation({ summary: 'Admin: Delete Category record' })
  @ApiParam({ name: 'id', description: 'Category ID or category code' })
  deleteCategory(@Param('id') id: string) {
    return this.service.deleteCategory(id);
  }

  @Public()
  @Get('categories/product-type/:productTypeId')
  @ApiOperation({ summary: 'List categories by Product Type ID' })
  @ApiParam({ name: 'productTypeId', description: 'Product Type ID (e.g. pt_med, pt_nut)' })
  listCategoriesByProductType(@Param('productTypeId') productTypeId: string) {
    return this.service.listCategories(productTypeId);
  }

  @Public()
  @Get('categories/hierarchy-options')
  @ApiOperation({ summary: 'Get available categories, sub-categories and sub-sub-categories options grouped by Product Type' })
  getCategoryHierarchyOptions(@Query('productTypeId') productTypeId?: string) {
    return this.service.getCategoryHierarchyOptions(productTypeId);
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

  // -------------------------------------------------------------------
  // PRODUCT PRICES (/api/v1/catalog/prices)
  // -------------------------------------------------------------------

  @Public()
  @Get('prices')
  @ApiOperation({ summary: 'List product prices with filtering by product, manufacturer, segment and status' })
  listPrices(@Query() query: ProductPriceQueryDto) {
    return this.service.listAllProductPrices(query);
  }

  @Public()
  @Get('prices/:id')
  @ApiOperation({ summary: 'Get single price record details' })
  @ApiParam({ name: 'id', description: 'Price record ID' })
  getPrice(@Param('id') id: string) {
    return this.service.getProductPriceById(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN', 'MANUFACTURER')
  @ApiBearerAuth()
  @Post('prices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new product price rule' })
  createPrice(@Body() dto: CreatePriceDto) {
    return this.service.createProductPrice(dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN', 'MANUFACTURER')
  @ApiBearerAuth()
  @Put('prices/:id')
  @ApiOperation({ summary: 'Update product price rule' })
  @ApiParam({ name: 'id', description: 'Price record ID' })
  updatePrice(@Param('id') id: string, @Body() dto: UpdatePriceDto) {
    return this.service.updateProductPrice(id, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN', 'MANUFACTURER')
  @ApiBearerAuth()
  @Patch('prices/:id/status')
  @ApiOperation({ summary: 'Toggle product price status between ACTIVE and INACTIVE' })
  @ApiParam({ name: 'id', description: 'Price record ID' })
  togglePriceStatus(@Param('id') id: string) {
    return this.service.toggleProductPriceStatus(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Delete('prices/:id')
  @ApiOperation({ summary: 'Delete product price rule' })
  @ApiParam({ name: 'id', description: 'Price record ID' })
  deletePrice(@Param('id') id: string) {
    return this.service.deleteProductPrice(id);
  }

  // -------------------------------------------------------------------
  // PRODUCT TAXES (/api/v1/catalog/taxes)
  // -------------------------------------------------------------------

  @Public()
  @Get('taxes')
  @ApiOperation({ summary: 'List product tax mappings with product and status filtering' })
  listTaxes(@Query() query: ProductTaxQueryDto) {
    return this.service.listAllProductTaxes(query);
  }

  @Public()
  @Get('taxes/:id')
  @ApiOperation({ summary: 'Get single product tax mapping details' })
  @ApiParam({ name: 'id', description: 'Tax record ID' })
  getTax(@Param('id') id: string) {
    return this.service.getProductTaxById(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post('taxes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create product tax mapping' })
  createTax(@Body() dto: CreateProductTaxDto) {
    return this.service.createProductTax(dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('taxes/:id')
  @ApiOperation({ summary: 'Update product tax mapping' })
  @ApiParam({ name: 'id', description: 'Tax record ID' })
  updateTax(@Param('id') id: string, @Body() dto: UpdateProductTaxDto) {
    return this.service.updateProductTax(id, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Patch('taxes/:id/status')
  @ApiOperation({ summary: 'Toggle product tax mapping status' })
  @ApiParam({ name: 'id', description: 'Tax record ID' })
  toggleTaxStatus(@Param('id') id: string) {
    return this.service.toggleProductTaxStatus(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Delete('taxes/:id')
  @ApiOperation({ summary: 'Delete product tax mapping' })
  @ApiParam({ name: 'id', description: 'Tax record ID' })
  deleteTax(@Param('id') id: string) {
    return this.service.deleteProductTax(id);
  }

  // -------------------------------------------------------------------
  // PRODUCT UOMS (/api/v1/catalog/uoms)
  // -------------------------------------------------------------------

  @Public()
  @Get('uoms')
  @ApiOperation({ summary: 'List product UOM configurations' })
  listUoms(@Query() query: ProductUomQueryDto) {
    return this.service.listAllProductUoms(query);
  }

  @Public()
  @Get('uoms/:id')
  @ApiOperation({ summary: 'Get single product UOM details' })
  @ApiParam({ name: 'id', description: 'UOM record ID' })
  getUom(@Param('id') id: string) {
    return this.service.getProductUomById(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post('uoms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create product UOM configuration' })
  createUom(@Body() dto: CreateProductUomDto) {
    return this.service.createProductUom(dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('uoms/:id')
  @ApiOperation({ summary: 'Update product UOM configuration' })
  @ApiParam({ name: 'id', description: 'UOM record ID' })
  updateUom(@Param('id') id: string, @Body() dto: UpdateProductUomDto) {
    return this.service.updateProductUom(id, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Patch('uoms/:id/status')
  @ApiOperation({ summary: 'Toggle product UOM active status' })
  @ApiParam({ name: 'id', description: 'UOM record ID' })
  toggleUomStatus(@Param('id') id: string) {
    return this.service.toggleProductUomStatus(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Delete('uoms/:id')
  @ApiOperation({ summary: 'Delete product UOM configuration' })
  @ApiParam({ name: 'id', description: 'UOM record ID' })
  deleteUom(@Param('id') id: string) {
    return this.service.deleteProductUom(id);
  }

  // -------------------------------------------------------------------
  // CUSTOMER SEGMENTS (/api/v1/catalog/customer-segments)
  // -------------------------------------------------------------------

  @Public()
  @Get('customer-segments')
  @ApiOperation({ summary: 'List all customer segments' })
  listCustomerSegments() {
    return this.service.listCustomerSegments();
  }

  @Public()
  @Get('customer-segments/:id')
  @ApiOperation({ summary: 'Get single customer segment' })
  @ApiParam({ name: 'id', description: 'Customer segment ID' })
  getCustomerSegment(@Param('id') id: string) {
    return this.service.getCustomerSegmentById(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post('customer-segments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create customer segment' })
  createCustomerSegment(@Body() dto: CreateCustomerSegmentDto) {
    return this.service.createCustomerSegment(dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('customer-segments/:id')
  @ApiOperation({ summary: 'Update customer segment' })
  @ApiParam({ name: 'id', description: 'Customer segment ID' })
  updateCustomerSegment(@Param('id') id: string, @Body() dto: UpdateCustomerSegmentDto) {
    return this.service.updateCustomerSegment(id, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Delete('customer-segments/:id')
  @ApiOperation({ summary: 'Delete customer segment' })
  @ApiParam({ name: 'id', description: 'Customer segment ID' })
  deleteCustomerSegment(@Param('id') id: string) {
    return this.service.deleteCustomerSegment(id);
  }

  // -------------------------------------------------------------------
  // BRAND MASTER
  // -------------------------------------------------------------------

  @Public()
  @Get('brands')
  @ApiOperation({ summary: 'List all brands with optional search and status filter' })
  listBrands(@Query() query: BrandQueryDto) {
    return this.service.listBrands(query);
  }

  @Public()
  @Get('brands/:id')
  @ApiOperation({ summary: 'Get brand by ID or Code' })
  @ApiParam({ name: 'id', description: 'Brand ID or Brand Code' })
  getBrandById(@Param('id') id: string) {
    return this.service.getBrandById(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post('brands')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create brand in Brand Master' })
  createBrand(@Body() dto: CreateBrandDto) {
    return this.service.createBrand(dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('brands/:id')
  @ApiOperation({ summary: 'Update brand in Brand Master' })
  @ApiParam({ name: 'id', description: 'Brand ID or Code' })
  updateBrand(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.service.updateBrand(id, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Patch('brands/:id/status')
  @ApiOperation({ summary: 'Toggle brand active/inactive status' })
  @ApiParam({ name: 'id', description: 'Brand ID or Code' })
  toggleBrandStatus(@Param('id') id: string) {
    return this.service.toggleBrandStatus(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Delete('brands/:id')
  @ApiOperation({ summary: 'Delete brand from Brand Master' })
  @ApiParam({ name: 'id', description: 'Brand ID or Code' })
  deleteBrand(@Param('id') id: string) {
    return this.service.deleteBrand(id);
  }

  // -------------------------------------------------------------------
  // MANUFACTURER MASTER (ADMIN)
  // -------------------------------------------------------------------

  @Public()
  @Get('manufacturers')
  @ApiOperation({ summary: 'List all verified manufacturers with search and filter' })
  listAdminManufacturers(@Query() query: ManufacturerQueryDto) {
    return this.service.listAdminManufacturers(query);
  }

  @Public()
  @Get('manufacturers/:id')
  @ApiOperation({ summary: 'Get manufacturer details by ID or code' })
  @ApiParam({ name: 'id', description: 'Manufacturer ID or Code' })
  getAdminManufacturerById(@Param('id') id: string) {
    return this.service.getAdminManufacturerById(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post('manufacturers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create manufacturer in Manufacturer Master' })
  createAdminManufacturer(@Body() dto: CreateAdminManufacturerDto) {
    return this.service.createAdminManufacturer(dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('manufacturers/:id')
  @ApiOperation({ summary: 'Update manufacturer details in Manufacturer Master' })
  @ApiParam({ name: 'id', description: 'Manufacturer ID or Code' })
  updateAdminManufacturer(@Param('id') id: string, @Body() dto: UpdateAdminManufacturerDto) {
    return this.service.updateAdminManufacturer(id, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Patch('manufacturers/:id/status')
  @ApiOperation({ summary: 'Toggle manufacturer lifecycle status' })
  @ApiParam({ name: 'id', description: 'Manufacturer ID or Code' })
  toggleAdminManufacturerStatus(@Param('id') id: string) {
    return this.service.toggleAdminManufacturerStatus(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Delete('manufacturers/:id')
  @ApiOperation({ summary: 'Delete manufacturer from Manufacturer Master' })
  @ApiParam({ name: 'id', description: 'Manufacturer ID or Code' })
  deleteAdminManufacturer(@Param('id') id: string) {
    return this.service.deleteAdminManufacturer(id);
  }

  // -------------------------------------------------------------------
  // PRODUCT MANUFACTURER MAPPINGS (ADMIN)
  // -------------------------------------------------------------------

  @Public()
  @Get('product-manufacturers')
  @ApiOperation({ summary: 'List product-to-manufacturer mappings across catalog' })
  listProductManufacturerMappings(@Query() query: ProductManufacturerMappingQueryDto) {
    return this.service.listAdminProductManufacturerMappings(query);
  }

  @Public()
  @Get('product-manufacturers/:id')
  @ApiOperation({ summary: 'Get product-manufacturer mapping details by ID' })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  getProductManufacturerMappingById(@Param('id') id: string) {
    return this.service.getAdminProductManufacturerMappingById(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post('product-manufacturers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new product-to-manufacturer mapping' })
  createProductManufacturerMapping(@Body() dto: CreateProductManufacturerMappingDto) {
    return this.service.createAdminProductManufacturerMapping(dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put('product-manufacturers/:id')
  @ApiOperation({ summary: 'Update product-to-manufacturer mapping' })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  updateProductManufacturerMapping(@Param('id') id: string, @Body() dto: UpdateProductManufacturerMappingDto) {
    return this.service.updateAdminProductManufacturerMapping(id, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Patch('product-manufacturers/:id/preferred')
  @ApiOperation({ summary: 'Set mapping as preferred manufacturer for product' })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  setPreferredManufacturerMapping(@Param('id') id: string) {
    return this.service.setPreferredManufacturerMapping(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Patch('product-manufacturers/:id/status')
  @ApiOperation({ summary: 'Toggle product-manufacturer mapping active/inactive status' })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  toggleProductManufacturerMappingStatus(@Param('id') id: string) {
    return this.service.toggleAdminProductManufacturerMappingStatus(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Delete('product-manufacturers/:id')
  @ApiOperation({ summary: 'Remove product-to-manufacturer mapping' })
  @ApiParam({ name: 'id', description: 'Mapping ID' })
  deleteProductManufacturerMapping(@Param('id') id: string) {
    return this.service.deleteAdminProductManufacturerMapping(id);
  }

}
