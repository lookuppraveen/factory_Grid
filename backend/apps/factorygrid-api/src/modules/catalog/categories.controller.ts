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
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './dto/category-admin.dto';

@ApiTags('Categories & Hierarchies')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CatalogService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List Category -> Sub-Category -> Sub-Sub-Category hierarchy with pagination and filters',
  })
  listCategories(@Query() query: CategoryQueryDto) {
    return this.service.listCategories(query);
  }

  @Public()
  @Get('product-types')
  @ApiOperation({ summary: 'List all active product types from database' })
  listProductTypes() {
    return this.service.listProductTypes();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID or Code' })
  @ApiParam({ name: 'id', description: 'Category ID or category code' })
  getCategory(@Param('id') id: string) {
    return this.service.getCategoryById(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin: Create new Category hierarchy record' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.service.createCategory(dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Admin: Update Category record' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.updateCategory(id, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin: Toggle category status between ACTIVE and INACTIVE' })
  toggleCategoryStatus(@Param('id') id: string) {
    return this.service.toggleCategoryStatus(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Delete Category record' })
  deleteCategory(@Param('id') id: string) {
    return this.service.deleteCategory(id);
  }

  @Public()
  @Get(':categoryId/sub-categories')
  @ApiOperation({ summary: 'List sub-categories for a given category' })
  @ApiParam({ name: 'categoryId', description: 'Category name, ID or code' })
  getSubCategories(@Param('categoryId') categoryId: string) {
    return this.service.getSubCategories(categoryId);
  }

  @Public()
  @Get(':categoryId/sub-categories/:subCategory/sub-sub-categories')
  @ApiOperation({
    summary: 'List sub-sub-categories for a given category and sub-category',
  })
  @ApiParam({ name: 'categoryId', description: 'Category name, ID or code' })
  @ApiParam({ name: 'subCategory', description: 'Sub-category name' })
  getSubSubCategories(
    @Param('categoryId') categoryId: string,
    @Param('subCategory') subCategory: string,
  ) {
    return this.service.getSubSubCategories(categoryId, subCategory);
  }
}

