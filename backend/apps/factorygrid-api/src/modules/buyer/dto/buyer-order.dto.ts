import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class BuyerOrderQueryDto {
  @ApiPropertyOptional({ description: 'Search term for MO#, PO#, RFQ#, Quote Ref, or Customer' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Status filter: ALL, PENDING, CONFIRMED, IN_PROCESS, COMPLETED, CLOSED, ON_HOLD' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size limit', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}

export class BuyerOrderLineDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  dosageForm!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  uom!: string;

  @ApiProperty()
  unitPrice!: number;

  @ApiProperty()
  totalPrice!: number;

  @ApiProperty()
  leadTimeDays!: number;
}

export class BuyerSubOrderDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  subOrderNumber!: string;

  @ApiProperty()
  masterOrderId!: string;

  @ApiProperty()
  masterOrderNumber!: string;

  @ApiProperty()
  poNumber!: string;

  @ApiProperty()
  manufacturerId!: string;

  @ApiProperty()
  manufacturerName!: string;

  @ApiPropertyOptional()
  mfgCity?: string;

  @ApiPropertyOptional()
  mfgState?: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  productionStatus?: string;

  @ApiProperty()
  totalAmount!: number;

  @ApiProperty()
  totalQuantity!: number;

  @ApiProperty()
  leadTimeDays!: number;

  @ApiPropertyOptional()
  deliveryDate?: string | null;

  @ApiPropertyOptional()
  shippingAddress?: string | null;

  @ApiPropertyOptional()
  billingAddress?: string | null;

  @ApiProperty({ type: [BuyerOrderLineDto] })
  lines!: BuyerOrderLineDto[];
}

export class BuyerPurchaseOrderDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  poNumber!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  mfgName!: string;

  @ApiProperty()
  totalAmount!: number;

  @ApiProperty()
  totalQuantity!: number;
}

export class BuyerMasterOrderDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  orderNumber!: string;

  @ApiProperty()
  poNumber!: string;

  @ApiPropertyOptional()
  rfqId?: string | null;

  @ApiPropertyOptional()
  rfqNumber?: string | null;

  @ApiPropertyOptional()
  quoteId?: string | null;

  @ApiPropertyOptional()
  quoteReference?: string | null;

  @ApiProperty()
  isGeneric!: boolean;

  @ApiPropertyOptional()
  buyerId?: string | null;

  @ApiPropertyOptional()
  customerId?: string | null;

  @ApiProperty()
  customerName!: string;

  @ApiProperty()
  customerCode!: string;

  @ApiProperty()
  customerClassification!: string;

  @ApiProperty()
  totalAmount!: number;

  @ApiProperty()
  totalQuantity!: number;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  adminApprovalStatus!: string;

  @ApiProperty()
  advanceRequired!: boolean;

  @ApiProperty()
  advanceStatus!: string;

  @ApiProperty()
  advanceMethod!: string;

  @ApiProperty()
  advancePercentage!: number;

  @ApiProperty()
  requiredAdvanceAmount!: number;

  @ApiProperty()
  advanceReceived!: number;

  @ApiProperty()
  advanceOutstanding!: number;

  @ApiPropertyOptional()
  advanceDueDate?: string | null;

  @ApiPropertyOptional()
  advanceNotes?: string | null;

  @ApiProperty()
  isOnHold!: boolean;

  @ApiPropertyOptional()
  holdReason?: string | null;

  @ApiProperty()
  holdCount!: number;

  @ApiPropertyOptional()
  holdPlacedAt?: string | null;

  @ApiPropertyOptional()
  holdPlacedBy?: string | null;

  @ApiPropertyOptional()
  adminApprovedAt?: string | null;

  @ApiPropertyOptional()
  adminApprovedBy?: string | null;

  @ApiPropertyOptional()
  paymentTerms?: string | null;

  @ApiProperty()
  createdDate!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiPropertyOptional()
  expectedDeliveryDate?: string | null;

  @ApiPropertyOptional()
  shippingAddress?: string | null;

  @ApiPropertyOptional()
  billingAddress?: string | null;

  @ApiPropertyOptional()
  buyerGst?: string | null;

  @ApiPropertyOptional()
  remarks?: string | null;

  @ApiProperty({ type: [BuyerSubOrderDto] })
  subOrders!: BuyerSubOrderDto[];

  @ApiProperty({ type: [BuyerPurchaseOrderDto] })
  purchaseOrders!: BuyerPurchaseOrderDto[];

  @ApiProperty({ type: [BuyerOrderLineDto] })
  lines!: BuyerOrderLineDto[];

  @ApiPropertyOptional()
  statusHistory?: Array<{
    id: string;
    previousStatus: string;
    newStatus: string;
    changedBy: string;
    changedAt: string;
    remarks?: string;
  }>;
}

export class BuyerOrderSummaryDto {
  @ApiProperty()
  totalOrdersCount!: number;

  @ApiProperty()
  pendingApprovalCount!: number;

  @ApiProperty()
  pendingAdvanceCount!: number;

  @ApiProperty()
  confirmedCount!: number;

  @ApiProperty()
  inProcessCount!: number;

  @ApiProperty()
  completedCount!: number;

  @ApiProperty()
  onHoldCount!: number;

  @ApiProperty()
  totalGmv!: number;
}

export class BuyerOrderListResponseDto {
  @ApiProperty({ type: BuyerOrderSummaryDto })
  summary!: BuyerOrderSummaryDto;

  @ApiProperty()
  pagination!: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };

  @ApiProperty({ type: [BuyerMasterOrderDto] })
  orders!: BuyerMasterOrderDto[];
}
