import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '@factorygrid/auth';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BuyerOrderListResponseDto,
  BuyerOrderQueryDto,
  BuyerOrderSummaryDto,
} from './dto/buyer-order.dto';

@Injectable()
export class BuyerOrderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves the authenticated Buyer and corresponding BuyerRegistration entity.
   */
  async resolveBuyer(user: AuthUser) {
    const isPrivileged = user.roles?.some(
      (r) =>
        r.includes('ADMIN') ||
        r.includes('COMPLIANCE') ||
        r.includes('ROLE_ADMIN') ||
        r.includes('ROLE_SUPER_ADMIN'),
    );

    const dbUser = await this.prisma.user.findUnique({
      where: { id: BigInt(user.id) },
    });
    const email = dbUser?.email;

    let reg = await this.prisma.buyerRegistration.findFirst({
      where: { userId: BigInt(user.id) },
      orderBy: { id: 'desc' },
    });

    if (!reg && email) {
      reg = await this.prisma.buyerRegistration.findFirst({
        where: { email: { equals: email.trim(), mode: 'insensitive' } },
        orderBy: { id: 'desc' },
      });
      if (reg && !reg.userId) {
        await this.prisma.buyerRegistration.update({
          where: { id: reg.id },
          data: { userId: BigInt(user.id) },
        });
      }
    }

    return {
      userId: BigInt(user.id),
      userCode: user.userCode,
      username: user.username,
      email,
      registration: reg,
      isPrivileged,
    };
  }

  /**
   * Transforms a database MasterOrder record into the format required by the Buyer UI.
   */
  private toBuyerMasterOrderResponse(mo: any) {
    const totalAmount = Number(mo.totalAmount || 0);
    const advanceAmount = Number(mo.advanceAmount || 0);
    const advanceReceived = Number(mo.advanceReceived || 0);
    const advanceOutstanding = Number(mo.advanceOutstanding || 0);

    const firstPo = mo.purchaseOrders?.[0];
    const firstSo = mo.subOrders?.[0];
    const primaryPoNumber =
      firstPo?.poNumber ||
      firstSo?.purchaseOrder?.poNumber ||
      (firstSo ? `PO-${firstSo.subOrderNumber}` : mo.orderNumber);

    const subOrdersMapped = (mo.subOrders || []).map((so: any) => {
      const soLines = (so.lines || []).map((sol: any) => ({
        id: sol.id.toString(),
        productId: sol.productId || 'PROD',
        productName: sol.productName,
        dosageForm: sol.dosageForm || 'Tablet',
        quantity: sol.quantity,
        uom: sol.uom || 'Units',
        unitPrice: Number(sol.unitPrice || 0),
        totalPrice: Number(sol.lineTotal || 0),
        leadTimeDays: sol.leadTimeDays || 14,
      }));

      return {
        id: so.id.toString(),
        subOrderNumber: so.subOrderNumber,
        masterOrderId: mo.id.toString(),
        masterOrderNumber: mo.orderNumber,
        poNumber: so.purchaseOrder?.poNumber || `PO-${so.subOrderNumber}`,
        manufacturerId: so.manufacturerId.toString(),
        manufacturerName:
          so.manufacturer?.companyName || 'Verified Manufacturer',
        mfgCity: so.manufacturer?.city || '',
        mfgState: so.manufacturer?.state || '',
        status: so.status,
        productionStatus: so.productionStatus,
        totalAmount: Number(so.totalAmount || 0),
        totalQuantity: so.totalQuantity,
        leadTimeDays: so.leadTimeDays,
        deliveryDate: so.deliveryDate
          ? so.deliveryDate.toISOString().split('T')[0]
          : null,
        shippingAddress: so.shippingAddress,
        billingAddress: so.billingAddress,
        lines: soLines,
      };
    });

    const posMapped = (mo.purchaseOrders || []).map((po: any) => ({
      id: po.id.toString(),
      poNumber: po.poNumber,
      status: po.status,
      mfgName: po.manufacturer?.companyName || 'Manufacturer Facility',
      totalAmount: Number(po.totalAmount || 0),
      totalQuantity: po.totalQuantity || 0,
    }));

    // If purchaseOrders relation is empty, fall back to subOrders' linked purchaseOrders
    if (posMapped.length === 0) {
      for (const so of mo.subOrders || []) {
        if (so.purchaseOrder) {
          posMapped.push({
            id: so.purchaseOrder.id.toString(),
            poNumber: so.purchaseOrder.poNumber,
            status: so.purchaseOrder.status,
            mfgName:
              so.manufacturer?.companyName || 'Manufacturer Facility',
            totalAmount: Number(so.purchaseOrder.totalAmount || so.totalAmount || 0),
            totalQuantity: so.purchaseOrder.totalQuantity || so.totalQuantity || 0,
          });
        }
      }
    }

    const allLines = subOrdersMapped.flatMap((so: any) => so.lines);
    const isHeld = Boolean(mo.isOnHold || mo.status === 'ON_HOLD');
    const adminApproval = mo.adminApprovalStatus || 'PENDING';

    return {
      id: mo.id.toString(),
      orderNumber: mo.orderNumber,
      poNumber: primaryPoNumber,
      rfqId: mo.rfqId ? mo.rfqId.toString() : null,
      rfqNumber: mo.rfq?.rfqNumber || null,
      quoteId: mo.quoteId ? mo.quoteId.toString() : null,
      quoteReference: mo.quote?.quoteReference || null,
      isGeneric: Boolean(mo.rfq?.isGeneric),
      buyerId: mo.buyerId ? mo.buyerId.toString() : null,
      customerId: mo.buyerId ? mo.buyerId.toString() : null,
      customerName: mo.customerName,
      customerCode: mo.customerCode || 'CUST',
      customerClassification: mo.customerClassification || 'REGULAR',
      totalAmount,
      totalQuantity: mo.totalQuantity,
      status: mo.status,
      adminApprovalStatus: adminApproval,
      advanceRequired: Boolean(mo.advanceRequired),
      advanceStatus:
        mo.advanceStatus || (mo.advanceRequired ? 'PENDING' : 'NOT_REQUIRED'),
      advanceMethod: mo.advanceMethod || 'PERCENTAGE',
      advancePercentage: mo.advancePercentage
        ? Number(mo.advancePercentage)
        : 30,
      requiredAdvanceAmount:
        advanceAmount > 0 ? advanceAmount : Math.round(totalAmount * 0.3),
      advanceReceived,
      advanceOutstanding,
      advanceDueDate: mo.advanceDueDate
        ? mo.advanceDueDate.toISOString().split('T')[0]
        : null,
      advanceNotes: mo.advanceNotes || null,
      isOnHold: isHeld,
      holdReason: mo.holdReason || null,
      holdCount: mo.holdCount || 0,
      holdPlacedAt: mo.holdPlacedAt ? mo.holdPlacedAt.toISOString() : null,
      holdPlacedBy: mo.holdPlacedBy || null,
      adminApprovedAt: mo.adminApprovedAt
        ? mo.adminApprovedAt.toISOString()
        : null,
      adminApprovedBy: mo.adminApprovedBy || null,
      paymentTerms: mo.paymentTerms || '30% Advance + Net 30 Days',
      createdDate: mo.orderDate
        ? mo.orderDate.toISOString().split('T')[0]
        : mo.createdAt.toISOString().split('T')[0],
      createdAt: mo.createdAt.toISOString(),
      expectedDeliveryDate: mo.expectedDeliveryDate
        ? mo.expectedDeliveryDate.toISOString().split('T')[0]
        : null,
      shippingAddress: mo.shippingAddress,
      billingAddress: mo.billingAddress,
      buyerGst: mo.buyerGst,
      remarks: mo.remarks,
      subOrders: subOrdersMapped,
      purchaseOrders: posMapped,
      lines: allLines,
      statusHistory: (mo.statusHistory || []).map((sh: any) => ({
        id: sh.id.toString(),
        previousStatus: sh.previousStatus,
        newStatus: sh.newStatus,
        changedBy: sh.changedBy,
        changedAt: sh.changedAt.toISOString(),
        remarks: sh.remarks,
      })),
    };
  }

  /**
   * Lists Master Orders belonging strictly to the authenticated Buyer.
   */
  async listBuyerOrders(
    user: AuthUser,
    query: BuyerOrderQueryDto,
  ): Promise<BuyerOrderListResponseDto> {
    const buyerInfo = await this.resolveBuyer(user);

    // Build buyer-scoped filter
    const buyerFilter: any = [];
    buyerFilter.push({ buyerId: buyerInfo.userId });
    if (buyerInfo.registration) {
      buyerFilter.push({ buyerRegistrationId: buyerInfo.registration.id });
      if (buyerInfo.registration.companyName) {
        buyerFilter.push({
          customerName: {
            equals: buyerInfo.registration.companyName.trim(),
            mode: 'insensitive',
          },
        });
      }
    }
    if (buyerInfo.username) {
      buyerFilter.push({
        customerName: { equals: buyerInfo.username.trim(), mode: 'insensitive' },
      });
    }

    const where: any = {
      OR: buyerFilter,
    };

    // If privileged user requests with no specific buyer filter, show all
    if (buyerInfo.isPrivileged) {
      delete where.OR;
    }

    // Apply Search filter across Master Order Number, Customer, RFQ Number
    if (query.search?.trim()) {
      const q = query.search.trim();
      const searchConditions = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerCode: { contains: q, mode: 'insensitive' } },
        { rfq: { rfqNumber: { contains: q, mode: 'insensitive' } } },
        { subOrders: { some: { subOrderNumber: { contains: q, mode: 'insensitive' } } } },
      ];

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    // Apply Status filter
    if (query.status && query.status !== 'ALL') {
      const s = query.status.toUpperCase();
      if (s === 'PENDING') {
        where.status = { in: ['PENDING_ADMIN_APPROVAL', 'PENDING_ADVANCE', 'OPEN', 'PENDING'] };
      } else if (s === 'CONFIRMED') {
        where.status = { in: ['CONFIRMED', 'CONFIRMED_RELEASED', 'RELEASED'] };
      } else if (s === 'IN_PROCESS') {
        where.status = { in: ['IN_PROCESS', 'IN_PRODUCTION', 'SCHEDULED', 'PROCESSING'] };
      } else if (s === 'COMPLETED') {
        where.status = { in: ['COMPLETED', 'DELIVERED', 'CLOSED'] };
      } else if (s === 'ON_HOLD') {
        where.OR = [{ isOnHold: true }, { status: 'ON_HOLD' }];
      } else {
        where.status = s;
      }
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    // Execute optimized query with all relations
    const [orders, total] = await Promise.all([
      this.prisma.masterOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          rfq: true,
          quote: true,
          buyerRegistration: true,
          subOrders: {
            include: {
              lines: true,
              manufacturer: true,
              purchaseOrder: true,
            },
          },
          purchaseOrders: {
            include: {
              manufacturer: true,
            },
          },
          statusHistory: {
            orderBy: { changedAt: 'desc' },
          },
        },
      }),
      this.prisma.masterOrder.count({ where }),
    ]);

    // Calculate summary KPI metrics strictly from the buyer's scoped database records
    const allBuyerOrders = await this.prisma.masterOrder.findMany({
      where: buyerInfo.isPrivileged ? {} : { OR: buyerFilter },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        isOnHold: true,
        advanceStatus: true,
      },
    });

    const summary: BuyerOrderSummaryDto = {
      totalOrdersCount: allBuyerOrders.length,
      pendingApprovalCount: allBuyerOrders.filter(
        (o) => o.status === 'PENDING_ADMIN_APPROVAL',
      ).length,
      pendingAdvanceCount: allBuyerOrders.filter(
        (o) => o.status === 'PENDING_ADVANCE' || o.advanceStatus === 'PENDING',
      ).length,
      confirmedCount: allBuyerOrders.filter(
        (o) => o.status === 'CONFIRMED' || o.status === 'CONFIRMED_RELEASED',
      ).length,
      inProcessCount: allBuyerOrders.filter(
        (o) =>
          o.status === 'IN_PROCESS' ||
          o.status === 'IN_PRODUCTION' ||
          o.status === 'SCHEDULED',
      ).length,
      completedCount: allBuyerOrders.filter(
        (o) => o.status === 'COMPLETED' || o.status === 'DELIVERED',
      ).length,
      onHoldCount: allBuyerOrders.filter(
        (o) => o.isOnHold || o.status === 'ON_HOLD',
      ).length,
      totalGmv: allBuyerOrders.reduce(
        (sum, o) => sum + Number(o.totalAmount || 0),
        0,
      ),
    };

    return {
      summary,
      pagination: {
        page,
        size: limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      orders: orders.map((o) => this.toBuyerMasterOrderResponse(o)),
    };
  }

  /**
   * Retrieves full details for a single Master Order belonging to the authenticated Buyer.
   */
  async getBuyerOrderDetail(idOrCode: string, user: AuthUser) {
    const buyerInfo = await this.resolveBuyer(user);
    const isNumeric = !isNaN(Number(idOrCode));

    const order = await this.prisma.masterOrder.findFirst({
      where: {
        OR: [
          { orderNumber: idOrCode },
          ...(isNumeric ? [{ id: BigInt(idOrCode) }] : []),
        ],
      },
      include: {
        rfq: true,
        quote: true,
        buyerRegistration: true,
        subOrders: {
          include: {
            lines: true,
            manufacturer: true,
            purchaseOrder: true,
          },
        },
        purchaseOrders: {
          include: {
            manufacturer: true,
          },
        },
        statusHistory: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Master Order "${idOrCode}" not found.`);
    }

    // Verify Buyer Ownership unless privileged
    if (!buyerInfo.isPrivileged) {
      const isOwner =
        (order.buyerId && order.buyerId === buyerInfo.userId) ||
        (order.buyerRegistrationId &&
          buyerInfo.registration &&
          order.buyerRegistrationId === buyerInfo.registration.id) ||
        (order.customerName &&
          buyerInfo.registration &&
          order.customerName.toLowerCase() ===
            buyerInfo.registration.companyName.toLowerCase()) ||
        (order.customerName &&
          order.customerName.toLowerCase() === buyerInfo.username.toLowerCase());

      if (!isOwner) {
        throw new ForbiddenException(
          'Buyer Order Isolation: You do not have permission to view this order.',
        );
      }
    }

    return this.toBuyerMasterOrderResponse(order);
  }

  /**
   * Retrieves Purchase Orders associated with a Master Order.
   */
  async getBuyerOrderPurchaseOrders(idOrCode: string, user: AuthUser) {
    const detail = await this.getBuyerOrderDetail(idOrCode, user);
    return detail.purchaseOrders || [];
  }
}
