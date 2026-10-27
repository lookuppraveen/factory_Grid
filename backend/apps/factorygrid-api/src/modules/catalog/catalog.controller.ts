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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Public, Roles } from '@factorygrid/auth';
import { CatalogService } from './catalog.service';
import {
  CreateCatalogProductDto,
  ProductQueryDto,
  UpdateCatalogProductDto,
} from './dto/catalog-product.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category-admin.dto';

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

  // -------------------------------------------------------------------
  // CATEGORIES
  // -------------------------------------------------------------------

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'List Category -> Sub-Category -> Sub-Sub-Category hierarchy' })
  @ApiQuery({ name: 'productTypeId', required: false })
  listCategories(@Query('productTypeId') productTypeId?: string) {
    return this.service.listCategories(productTypeId);
  }

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
}
