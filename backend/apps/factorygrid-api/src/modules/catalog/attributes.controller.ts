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
  CreateAttributeMasterDto,
  UpdateAttributeMasterDto,
} from './dto/attribute-master.dto';

@ApiTags('Attributes (Attribute Master)')
@Controller('attributes')
export class AttributesController {
  constructor(private readonly service: CatalogService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List central Attribute Master records',
    description: 'Fetch reusable enterprise attributes with filters for data type, status, and text search.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Filter by attribute name or code' })
  @ApiQuery({ name: 'dataType', required: false, enum: ['ALL', 'TEXT', 'NUMBER', 'DECIMAL', 'BOOLEAN', 'DATE', 'LIST'] })
  @ApiQuery({ name: 'status', required: false, enum: ['ALL', 'ACTIVE', 'INACTIVE'] })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  listAttributes(@Query() query: AttributeMasterQueryDto) {
    return this.service.listAttributes(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get attribute definition by ID or code' })
  @ApiParam({ name: 'id', description: 'Attribute ID or attribute code' })
  getAttribute(@Param('id') id: string) {
    return this.service.getAttributeById(id);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Admin: Create new central reusable attribute',
    description: 'Persists reusable attribute into PostgreSQL attribute_masters table.',
  })
  @ApiCreatedResponse({ description: 'Attribute created successfully' })
  createAttribute(@Body() dto: CreateAttributeMasterDto) {
    return this.service.createAttribute(dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Admin: Update attribute definition' })
  @ApiParam({ name: 'id', description: 'Attribute ID or attribute code' })
  updateAttribute(@Param('id') id: string, @Body() dto: UpdateAttributeMasterDto) {
    return this.service.updateAttribute(id, dto);
  }

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin: Toggle attribute active status' })
  @ApiParam({ name: 'id', description: 'Attribute ID or attribute code' })
  toggleAttributeStatus(@Param('id') id: string) {
    return this.service.toggleAttributeStatus(id);
  }

  // -------------------------------------------------------------------
  // PRODUCT TYPE ASSOCIATION
  // -------------------------------------------------------------------

  @Roles('ADMIN', 'ROLE_ADMIN')
  @ApiBearerAuth()
  @Post(':id/product-types/:productTypeId')
  @ApiOperation({ summary: 'Admin: Assign this attribute to a Product Type' })
  @ApiParam({ name: 'id', description: 'Attribute ID or code' })
  @ApiParam({ name: 'productTypeId', description: 'Product Type ID or code' })
  assignToProductType(
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
  @Delete(':id/product-types/:productTypeId')
  @ApiOperation({ summary: 'Admin: Remove this attribute from a Product Type' })
  @ApiParam({ name: 'id', description: 'Attribute ID or code' })
  @ApiParam({ name: 'productTypeId', description: 'Product Type ID or code' })
  removeFromProductType(
    @Param('id') id: string,
    @Param('productTypeId') productTypeId: string,
  ) {
    return this.service.removeProductTypeAttribute(productTypeId, id);
  }
}

