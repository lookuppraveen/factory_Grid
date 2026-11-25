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
import { AdminOrderService } from './admin-order.service';
import {
  AdminOrderQueryDto,
  AdminOrdersSummaryDto,
  ApproveMasterOrderDto,
  HoldMasterOrderDto,
  RejectMasterOrderDto,
} from './dto/admin-order.dto';

@ApiTags('Admin Master Orders & PO Monitor')
@ApiBearerAuth()
@Roles('ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
@Controller('admin')
export class AdminOrderController {
  constructor(private readonly service: AdminOrderService) {}

  @Get('orders')
  @ApiOperation({
    summary: 'List all Master Orders and Purchase Orders from PostgreSQL',
    description: 'Retrieves Master Orders with sub-orders, POs, customer details, advance status, and admin approval state.',
  })
  @ApiOkResponse({ description: 'Paginated master orders list' })
  listOrders(@Query() query: AdminOrderQueryDto) {
    return this.service.listAdminOrders(query);
  }

  @Get('orders/summary')
  @ApiOperation({
    summary: 'Get dynamic aggregated summary KPIs directly from PostgreSQL',
    description: 'Computes real pending PO approvals, advance pending, advance received, advance outstanding, total master orders, and total GMV.',
  })
  @ApiOkResponse({ description: 'Summary KPI numbers', type: AdminOrdersSummaryDto })
  getOrdersSummary(): Promise<AdminOrdersSummaryDto> {
    return this.service.getAdminOrdersSummary();
  }

  @Get('orders/:id')
  @ApiOperation({
    summary: 'Get complete Master Order details by ID or Order Number',
    description: 'Returns master order, sub-orders, product line items, delivery addresses, and status history from PostgreSQL.',
  })
  @ApiParam({ name: 'id', description: 'Master Order ID or Order Number (e.g. MO-2026-1008)' })
  getOrderDetail(@Param('id') id: string) {
    return this.service.getAdminOrderDetail(id);
  }

  @Get('orders/:id/purchase-orders')
  @ApiOperation({
    summary: 'Get all Purchase Orders linked to a Master Order from PostgreSQL',
    description: 'Returns all generated Purchase Orders with line items, quantities, and manufacturer info.',
  })
  @ApiParam({ name: 'id', description: 'Master Order ID or Order Number' })
  getOrderPurchaseOrders(@Param('id') id: string) {
    return this.service.getAdminOrderPurchaseOrders(id);
  }

  @Post('orders/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve Master Order and configure Advance Payment',
    description: 'Marks PO as Approved, configures advance payment if required, updates database transactionally, and records in history.',
  })
  @ApiParam({ name: 'id', description: 'Master Order ID or Order Number' })
  approveOrderPost(
    @Param('id') id: string,
    @Body() dto: ApproveMasterOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.approveMasterOrder(id, dto, user);
  }

  @Patch('orders/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve Master Order (PATCH alias)' })
  approveOrderPatch(
    @Param('id') id: string,
    @Body() dto: ApproveMasterOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.approveMasterOrder(id, dto, user);
  }

  @Post('orders/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject Master Order with mandatory reason',
    description: 'Sets order status to REJECTED_BY_ADMIN and rejects sub-orders/POs in PostgreSQL.',
  })
  @ApiParam({ name: 'id', description: 'Master Order ID or Order Number' })
  rejectOrderPost(
    @Param('id') id: string,
    @Body() dto: RejectMasterOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.rejectMasterOrder(id, dto, user);
  }

  @Patch('orders/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject Master Order (PATCH alias)' })
  rejectOrderPatch(
    @Param('id') id: string,
    @Body() dto: RejectMasterOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.rejectMasterOrder(id, dto, user);
  }

  @Post('orders/:id/hold')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Place Master Order on Administrative Hold',
    description: 'Records hold reason, increments hold count, and updates PostgreSQL.',
  })
  @ApiParam({ name: 'id', description: 'Master Order ID or Order Number' })
  holdOrderPost(
    @Param('id') id: string,
    @Body() dto: HoldMasterOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.holdMasterOrder(id, dto, user);
  }

  @Patch('orders/:id/hold')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Place Master Order on Hold (PATCH alias)' })
  holdOrderPatch(
    @Param('id') id: string,
    @Body() dto: HoldMasterOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.holdMasterOrder(id, dto, user);
  }

  @Post(['orders/:id/release-hold', 'orders/:id/release'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Release Administrative Hold on Master Order',
    description: 'Clears hold state and updates PostgreSQL.',
  })
  @ApiParam({ name: 'id', description: 'Master Order ID or Order Number' })
  releaseHoldOrderPost(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.releaseHoldMasterOrder(id, user);
  }

  @Patch(['orders/:id/release-hold', 'orders/:id/release'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release Administrative Hold (PATCH alias)' })
  releaseHoldOrderPatch(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.releaseHoldMasterOrder(id, user);
  }

  @Get('purchase-orders/:id')
  @ApiOperation({
    summary: 'Get Purchase Order detail by ID or PO Number from PostgreSQL',
    description: 'Returns PO header, line items, buyer details, and manufacturer info.',
  })
  @ApiParam({ name: 'id', description: 'Purchase Order ID or PO Number (e.g. PO-MO-2026-1008-01)' })
  getPurchaseOrderDetail(@Param('id') id: string) {
    return this.service.getAdminPurchaseOrderDetail(id);
  }

  @Patch('purchase-orders/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve Purchase Order directly' })
  approvePurchaseOrder(
    @Param('id') id: string,
    @Body() dto: ApproveMasterOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.approveMasterOrder(id, dto, user);
  }

  @Patch('purchase-orders/:id/hold')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Place Purchase Order on Hold directly' })
  holdPurchaseOrder(
    @Param('id') id: string,
    @Body() dto: HoldMasterOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.holdMasterOrder(id, dto, user);
  }
}
