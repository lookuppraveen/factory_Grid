import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '@factorygrid/auth';
import { ManufacturerOrderService } from './manufacturer-order.service';
import {
  ManufacturerOrderQueryDto,
  RejectOrderDto,
  UpdateOrderStatusDto,
} from './dto/manufacturer-order.dto';

@ApiTags('Manufacturer Orders')
@ApiBearerAuth()
@Roles('MANUFACTURER', 'SUPPLIER', 'ROLE_MANUFACTURER', 'ROLE_SUPPLIER', 'ADMIN', 'ROLE_ADMIN')
@Controller('manufacturer')
export class ManufacturerOrderController {
  constructor(private readonly service: ManufacturerOrderService) {}

  @Get('orders')
  @ApiOperation({
    summary: 'List orders assigned to authenticated manufacturer from PostgreSQL',
    description: 'Retrieves all sub-orders and purchase orders belonging to the logged-in manufacturer with tab metrics and status filtering.',
  })
  @ApiOkResponse({ description: 'Paginated manufacturer orders with KPI metric breakdown' })
  listOrders(
    @CurrentUser() user: AuthUser,
    @Query() query: ManufacturerOrderQueryDto,
  ) {
    return this.service.listManufacturerOrders(user, query);
  }

  @Get('orders/:id')
  @ApiOperation({
    summary: 'Get full order and PO detail by sub-order ID or order number',
    description: 'Returns sub-order details, product lines, commercial totals, and status transition history from PostgreSQL.',
  })
  @ApiParam({ name: 'id', description: 'Sub-Order ID or Sub-Order Number (e.g. SO-2026-1007-01)' })
  getOrderDetail(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.getManufacturerOrderDetail(id, user);
  }

  @Post('orders/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept purchase order and release for manufacturing',
    description: 'Transitions order status to Scheduled / Artwork stage and records status history in PostgreSQL.',
  })
  @ApiParam({ name: 'id', description: 'Sub-Order ID or Sub-Order Number' })
  acceptOrder(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.acceptOrder(id, user);
  }

  @Post('orders/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject purchase order with mandatory reason and optional remarks',
    description: 'Records rejection reason in PostgreSQL and updates order status to Rejected.',
  })
  @ApiParam({ name: 'id', description: 'Sub-Order ID or Sub-Order Number' })
  rejectOrder(
    @Param('id') id: string,
    @Body() dto: RejectOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.rejectOrder(id, dto, user);
  }

  @Patch('orders/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update manufacturing stage status',
    description: 'Validates workflow stage progression (IN_PRODUCTION, QUALITY_PACKAGING, READY_TO_DISPATCH, COMPLETED) and updates PostgreSQL.',
  })
  @ApiParam({ name: 'id', description: 'Sub-Order ID or Sub-Order Number' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateOrderStatus(id, dto, user);
  }

  @Get('purchase-orders/:poId')
  @ApiOperation({
    summary: 'Get official B2B Purchase Order document details from PostgreSQL',
    description: 'Retrieves authentic PO header, vendor, buyer, line items, and commercial values directly from PostgreSQL.',
  })
  @ApiParam({ name: 'poId', description: 'Purchase Order ID or PO Number (e.g. PO-SO-2026-1007-01)' })
  getPurchaseOrder(
    @Param('poId') poId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.getPurchaseOrder(poId, user);
  }
}
