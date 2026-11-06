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
  BulkProductTypeAttributesDto,
  CreateProductTypeDto,
  ProductTypeAttributeItemDto,
  ProductTypeQueryDto,
  UpdateProductTypeAttributeDto,
  UpdateProductTypeDto,
} from './dto/product-type.dto';

@ApiTags('Product Catalog & Master Data')
@Controller('product-types')
export class ProductTypesController {
  constructor(private readonly service: CatalogService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all Product Types with pagination, search, and lifecycle filtering' })
  listProductTypes(@Query() query: ProductTypeQueryDto) {
    return this.service.listProductTypes(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get Product Type by ID or Code' })
  @ApiParam({ name: 'id', description: 'Product type ID (e.g. pt_med) or code (e.g. PHARMA)' })
  getProductType(@Param('id') id: string) {
    return this.service.getProductTypeById(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin: Create new Product Type' })
  @ApiCreatedResponse({ description: 'Product Type successfully created' })
  createProductType(@Body() dto: CreateProductTypeDto) {
    return this.service.createProductType(dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Admin: Update Product Type' })
  updateProductType(@Param('id') id: string, @Body() dto: UpdateProductTypeDto) {
    return this.service.updateProductType(id, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin: Toggle Product Type active/inactive lifecycle status' })
  toggleProductTypeStatus(@Param('id') id: string) {
    return this.service.toggleProductTypeStatus(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Delete Product Type' })
  deleteProductType(@Param('id') id: string) {
    return this.service.deleteProductType(id);
  }

  // -------------------------------------------------------------------
  // PRODUCT TYPE ATTRIBUTES (PRODUCT_TYPE_ATTRIBUTE)
  // -------------------------------------------------------------------

  @Public()
  @Get(':id/attributes')
  @ApiOperation({
    summary: 'Get attributes applicable to this Product Type',
    description: 'Returns all attributes assigned to this Product Type with attribute definitions from Attribute Master.',
  })
  @ApiParam({ name: 'id', description: 'Product Type ID or Code' })
  getProductTypeAttributes(@Param('id') id: string) {
    return this.service.getProductTypeAttributes(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post(':id/attributes')
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
  @Put(':id/attributes')
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
  @Put(':id/attributes/:attributeId')
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
  @Delete(':id/attributes/:attributeId')
  @ApiOperation({ summary: 'Admin: Remove attribute assignment from Product Type' })
  @ApiParam({ name: 'id', description: 'Product Type ID or Code' })
  @ApiParam({ name: 'attributeId', description: 'Attribute ID or Code' })
  removeProductTypeAttribute(
    @Param('id') id: string,
    @Param('attributeId') attributeId: string,
  ) {
    return this.service.removeProductTypeAttribute(id, attributeId);
  }
}
