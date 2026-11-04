import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { ProductsController } from './products.controller';
import { CategoriesController } from './categories.controller';
import { AttributesController } from './attributes.controller';
import { ProductTypesController } from './product-types.controller';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [
    CatalogController,
    ProductsController,
    CategoriesController,
    AttributesController,
    ProductTypesController,
  ],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
