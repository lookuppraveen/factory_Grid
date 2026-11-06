const fs = require('fs');
const path = 'backend/apps/factorygrid-api/src/modules/catalog/catalog.controller.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Add DTO import
if (!code.includes("from './dto/brand-mfg-mapping.dto'")) {
  code = `import {
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
` + code;
}

// 2. Add endpoints before last closing brace
const endpointsToAdd = `
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
`;

const lastIndex = code.lastIndexOf('}');
code = code.slice(0, lastIndex) + endpointsToAdd + '\n}\n';

fs.writeFileSync(path, code, 'utf8');
console.log('catalog.controller.ts updated with Brand, Manufacturer, and Mapping endpoints.');
