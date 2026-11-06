import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '@factorygrid/auth';
import { CatalogService } from './catalog.service';

@ApiTags('Product Catalog & Master Data')
@Controller('sub-categories')
export class SubCategoriesController {
  constructor(private readonly service: CatalogService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List sub-categories for a category by query param (categoryId)' })
  @ApiQuery({ name: 'categoryId', required: true, description: 'Category name, ID or code' })
  getSubCategories(@Query('categoryId') categoryId: string) {
    if (!categoryId) return [];
    return this.service.getSubCategories(categoryId);
  }
}

@ApiTags('Product Catalog & Master Data')
@Controller('sub-sub-categories')
export class SubSubCategoriesController {
  constructor(private readonly service: CatalogService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List sub-sub-categories by subCategoryId or categoryId + subCategory' })
  @ApiQuery({ name: 'subCategoryId', required: false, description: 'Sub-category name or ID' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Category name, ID or code' })
  @ApiQuery({ name: 'subCategory', required: false, description: 'Sub-category name' })
  getSubSubCategories(
    @Query('subCategoryId') subCategoryId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('subCategory') subCategory?: string,
  ) {
    const subCat = subCategoryId || subCategory;
    if (categoryId && subCat) {
      return this.service.getSubSubCategories(categoryId, subCat);
    }
    if (subCat) {
      return this.service.getSubSubCategoriesBySubCategoryOnly(subCat);
    }
    return [];
  }
}
