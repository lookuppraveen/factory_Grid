import {
  Controller,
  Get,
  Param,
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
import { BuyerOrderService } from './buyer-order.service';
import {
  BuyerOrderListResponseDto,
  BuyerOrderQueryDto,
  BuyerPurchaseOrderDto,
} from './dto/buyer-order.dto';

@ApiTags('Buyer Orders')
@ApiBearerAuth()
@Roles('BUYER', 'ROLE_BUYER', 'ADMIN', 'ROLE_ADMIN')
@Controller('buyer')
export class BuyerOrderController {
  constructor(private readonly service: BuyerOrderService) {}

  @Get('orders')
  @ApiOperation({
    summary: 'List master orders belonging to the authenticated buyer',
    description:
      'Retrieves all master orders, sub-orders, purchase orders, and status information for the logged-in buyer with search and status filtering.',
  })
  @ApiOkResponse({
    description: 'Paginated master orders for the authenticated buyer',
    type: BuyerOrderListResponseDto,
  })
  listOrders(
    @CurrentUser() user: AuthUser,
    @Query() query: BuyerOrderQueryDto,
  ) {
    return this.service.listBuyerOrders(user, query);
  }

  @Get('orders/:id')
  @ApiOperation({
    summary: 'Get master order details by ID or order number',
    description:
      'Returns complete master order details with sub-orders, lines, purchase orders, and audit history.',
  })
  @ApiParam({
    name: 'id',
    description: 'Master Order ID or Order Number (e.g. MO-2026-1008)',
  })
  getOrderDetail(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.getBuyerOrderDetail(id, user);
  }

  @Get('orders/:id/purchase-orders')
  @ApiOperation({
    summary: 'Get purchase orders associated with a master order',
    description:
      'Returns all purchase orders issued across sub-orders for the specified master order.',
  })
  @ApiParam({
    name: 'id',
    description: 'Master Order ID or Order Number',
  })
  @ApiOkResponse({
    description: 'List of purchase orders',
    type: [BuyerPurchaseOrderDto],
  })
  getPurchaseOrders(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.getBuyerOrderPurchaseOrders(id, user);
  }
}
