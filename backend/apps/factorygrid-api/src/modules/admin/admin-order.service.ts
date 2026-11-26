import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '@factorygrid/auth';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdminOrderQueryDto,
  AdminOrdersSummaryDto,
  ApproveMasterOrderDto,
  HoldMasterOrderDto,
  RejectMasterOrderDto,
} from './dto/admin-order.dto';

@Injectable()
export class AdminOrderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Transforms a database MasterOrder record into the format required by the Admin UI.
   */
  private toAdminMasterOrderResponse(mo: any) {
    const totalAmount = Number(mo.totalAmount || 0);
    const advanceAmount = Number(mo.advanceAmount || 0);
    const advanceReceived = Number(mo.advanceReceived || 0);
    const advanceOutstanding = Number(mo.advanceOutstanding || 0);

    const firstPo = mo.purchaseOrders?.[0];
    const firstSo = mo.subOrders?.[0];
    const primaryPoNumber = firstPo?.poNumber || firstSo?.purchaseOrder?.poNumber || (firstSo ? `PO-${firstSo.subOrderNumber}` : mo.orderNumber);

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
        poNumber: so.purchaseOrder?.poNumber || `PO-${so.subOrderNumber}`,
        manufacturerId: so.manufacturerId.toString(),
        manufacturerName: so.manufacturer?.companyName || 'Verified Manufacturer',
        mfgCity: so.manufacturer?.city || '',
        mfgState: so.manufacturer?.state || '',
        status: so.status,
        productionStatus: so.productionStatus,
        totalAmount: Number(so.totalAmount || 0),
        totalQuantity: so.totalQuantity,
        leadTimeDays: so.leadTimeDays,
        deliveryDate: so.deliveryDate ? so.deliveryDate.toISOString().split('T')[0] : null,
        shippingAddress: so.shippingAddress,
        billingAddress: so.billingAddress,
        lines: soLines,
      };
    });

    const isHeld = Boolean(mo.isOnHold || mo.status === 'ON_HOLD');
    const adminApproval = mo.adminApprovalStatus || 'PENDING';

    return {
      id: mo.id.toString(),
      orderNumber: mo.orderNumber,
      poNumber: primaryPoNumber,
      rfqId: mo.rfqId ? mo.rfqId.toString() : null,
      rfqNumber: mo.rfq?.rfqNumber || null,
      isGeneric: Boolean(mo.rfq?.isGeneric),
      buyerId: mo.buyerId ? mo.buyerId.toString() : null,
      customerName: mo.customerName,
      customerCode: mo.customerCode || 'CUST',
      customerClassification: mo.customerClassification || 'REGULAR',
      totalAmount,
      totalQuantity: mo.totalQuantity,
      status: mo.status,
      adminApprovalStatus: adminApproval,
      advanceRequired: Boolean(mo.advanceRequired),
      advanceStatus: mo.advanceStatus || (mo.advanceRequired ? 'PENDING' : 'NOT_REQUIRED'),
      advanceMethod: mo.advanceMethod || 'PERCENTAGE',
      advancePercentage: mo.advancePercentage ? Number(mo.advancePercentage) : 30,
      requiredAdvanceAmount: advanceAmount > 0 ? advanceAmount : Math.round(totalAmount * 0.3),
      advanceReceived,
      advanceOutstanding,
      advanceDueDate: mo.advanceDueDate ? mo.advanceDueDate.toISOString().split('T')[0] : null,
      advanceNotes: mo.advanceNotes || null,
      isOnHold: isHeld,
      holdReason: mo.holdReason || null,
      holdCount: mo.holdCount || 0,
      holdPlacedAt: mo.holdPlacedAt ? mo.holdPlacedAt.toISOString() : null,
      holdPlacedBy: mo.holdPlacedBy || null,
      adminApprovedAt: mo.adminApprovedAt ? mo.adminApprovedAt.toISOString() : null,
      adminApprovedBy: mo.adminApprovedBy || null,
      adminRejectionReason: mo.adminRejectionReason || null,
      paymentTerms: mo.paymentTerms || '30% Advance + Net 30 Days',
      createdDate: mo.orderDate ? mo.orderDate.toISOString().split('T')[0] : mo.createdAt.toISOString().split('T')[0],
      createdAt: mo.createdAt.toISOString(),
      expectedDeliveryDate: mo.expectedDeliveryDate ? mo.expectedDeliveryDate.toISOString().split('T')[0] : '2026-10-15',
      shippingAddress: mo.shippingAddress || 'Plot 14, Phase I Industrial Area, Delhi - 110020',
      billingAddress: mo.billingAddress || 'Connaught Place Corporate Office, New Delhi - 110001',
      buyerGst: mo.buyerGst || '07AABCB1234F1Z1',
      subOrders: subOrdersMapped,
      purchaseOrders: (mo.purchaseOrders || []).map((po: any) => ({
        id: po.id.toString(),
        poNumber: po.poNumber,
        status: po.status,
        mfgName: po.mfgName,
        totalAmount: Number(po.totalAmount || 0),
        totalQuantity: po.totalQuantity,
      })),
      statusHistory: (mo.statusHistory || []).map((h: any) => ({
        id: h.id.toString(),
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        changedBy: h.changedBy,
        changedAt: h.changedAt.toISOString(),
        remarks: h.remarks,
      })),
    };
  }

  /**
   * Retrieves summary KPI metrics directly aggregated from real PostgreSQL records.
   */
  async getAdminOrdersSummary(): Promise<AdminOrdersSummaryDto> {
    const allOrders = await this.prisma.masterOrder.findMany({
      select: {
        totalAmount: true,
        status: true,
        adminApprovalStatus: true,
        advanceStatus: true,
        advanceReceived: true,
        advanceOutstanding: true,
        isOnHold: true,
      },
    });

    let pendingApprovalCount = 0;
    let pendingAdvanceCount = 0;
    let totalAdvanceReceived = 0;
    let totalAdvanceOutstanding = 0;
    let totalGmv = 0;

    for (const o of allOrders) {
      const amt = Number(o.totalAmount || 0);
      totalGmv += amt;

      const approval = o.adminApprovalStatus || 'PENDING';
      const st = o.status || '';

      if (approval === 'PENDING' || st === 'PENDING_ADMIN_APPROVAL') {
        pendingApprovalCount++;
      }

      if (o.advanceStatus === 'PENDING' || st === 'PENDING_ADVANCE') {
        pendingAdvanceCount++;
      }

      totalAdvanceReceived += Number(o.advanceReceived || 0);
      totalAdvanceOutstanding += Number(o.advanceOutstanding || 0);
    }

    return {
      pendingApprovalCount,
      pendingAdvanceCount,
      totalAdvanceReceived,
      totalAdvanceOutstanding,
      totalOrdersCount: allOrders.length,
      totalGmv,
    };
  }

  /**
   * Lists Master Orders from PostgreSQL with backend filtering, search, and pagination.
   */
  async listAdminOrders(query: AdminOrderQueryDto) {
    const all = await this.prisma.masterOrder.findMany({
      include: {
        rfq: true,
        subOrders: {
          include: {
            lines: { orderBy: { id: 'asc' } },
            manufacturer: true,
            purchaseOrder: { include: { lines: true } },
          },
          orderBy: { id: 'asc' },
        },
        purchaseOrders: {
          include: { lines: { orderBy: { id: 'asc' } } },
          orderBy: { id: 'asc' },
        },
        statusHistory: { orderBy: { changedAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = all.map((mo) => this.toAdminMasterOrderResponse(mo));

    // In-memory filter pipeline matching the Admin table rules
    const filtered = mapped.filter((ord) => {
      // 1. Search term
      if (query.search?.trim()) {
        const term = query.search.trim().toLowerCase();
        const matchOrder = ord.orderNumber.toLowerCase().includes(term);
        const matchPo = ord.poNumber.toLowerCase().includes(term);
        const matchRfq = (ord.rfqNumber || '').toLowerCase().includes(term);
        const matchCust = ord.customerName.toLowerCase().includes(term);
        const matchSub = ord.subOrders.some(
          (so: any) =>
            so.subOrderNumber.toLowerCase().includes(term) ||
            so.manufacturerName.toLowerCase().includes(term) ||
            so.lines.some((l: any) => l.productName.toLowerCase().includes(term)),
        );
        if (!matchOrder && !matchPo && !matchRfq && !matchCust && !matchSub) {
          return false;
        }
      }

      // 2. PO Approval Filter
      const isApproved = ord.adminApprovalStatus === 'APPROVED' || ord.status === 'CONFIRMED_RELEASED' || ord.status === 'PENDING_ADVANCE';
      const isRejected = ord.status === 'REJECTED_BY_ADMIN' || ord.adminApprovalStatus === 'REJECTED';
      const isPending = ord.status === 'PENDING_ADMIN_APPROVAL' || ord.adminApprovalStatus === 'PENDING' || (!isApproved && !isRejected);

      if (query.approvalStatus === 'PENDING' && !isPending) return false;
      if (query.approvalStatus === 'APPROVED' && !isApproved) return false;
      if (query.approvalStatus === 'REJECTED' && !isRejected) return false;

      // 3. Advance Payment Filter
      if (query.advanceStatus === 'NOT_REQUIRED' && !(ord.advanceRequired === false || ord.advanceStatus === 'NOT_REQUIRED')) return false;
      if (query.advanceStatus === 'PENDING' && !(ord.advanceStatus === 'PENDING' && ord.status === 'PENDING_ADVANCE')) return false;
      if (query.advanceStatus === 'PARTIALLY_PAID' && ord.advanceStatus !== 'PARTIALLY_PAID') return false;
      if (query.advanceStatus === 'PAID' && ord.advanceStatus !== 'PAID') return false;

      // 4. PO Status Filter
      if (query.poStatus === 'ON_HOLD' && !ord.isOnHold) return false;
      if (query.poStatus === 'AWAITING_ADVANCE' && ord.status !== 'PENDING_ADVANCE') return false;
      if (query.poStatus === 'CONFIRMED_RELEASED' && ord.status !== 'CONFIRMED_RELEASED') return false;
      if (query.poStatus === 'REJECTED' && !isRejected) return false;

      return true;
    });

    const page = Math.max(1, Number(query.page) || 1);
    const size = Math.max(1, Math.min(Number(query.size) || 50, 100));
    const total = filtered.length;
    const totalPages = Math.ceil(total / size);
    const paginated = filtered.slice((page - 1) * size, page * size);

    const summary = await this.getAdminOrdersSummary();

    return {
      summary,
      pagination: {
        page,
        size,
        total,
        totalPages,
      },
      orders: paginated,
    };
  }

  /**
   * Retrieves full details for a single Master Order.
   */
  async getAdminOrderDetail(idOrCode: string | number) {
    const isNum = !isNaN(Number(idOrCode));
    const mo = await this.prisma.masterOrder.findFirst({
      where: isNum
        ? {
            OR: [
              { id: BigInt(idOrCode) },
              { orderNumber: String(idOrCode) },
            ],
          }
        : { orderNumber: String(idOrCode) },
      include: {
        rfq: true,
        subOrders: {
          include: {
            lines: { orderBy: { id: 'asc' } },
            manufacturer: true,
            purchaseOrder: { include: { lines: true } },
          },
          orderBy: { id: 'asc' },
        },
        purchaseOrders: {
          include: { lines: { orderBy: { id: 'asc' } } },
          orderBy: { id: 'asc' },
        },
        statusHistory: { orderBy: { changedAt: 'desc' } },
      },
    });

    if (!mo) {
      throw new NotFoundException(`Master Order "${idOrCode}" not found in PostgreSQL.`);
    }

    return this.toAdminMasterOrderResponse(mo);
  }

  /**
   * Retrieves detail for a single Purchase Order.
   */
  async getAdminPurchaseOrderDetail(idOrPoNumber: string | number) {
    const isNum = !isNaN(Number(idOrPoNumber));
    const po = await this.prisma.purchaseOrder.findFirst({
      where: isNum
        ? {
            OR: [
              { id: BigInt(idOrPoNumber) },
              { poNumber: String(idOrPoNumber) },
            ],
          }
        : { poNumber: String(idOrPoNumber) },
      include: {
        lines: { orderBy: { id: 'asc' } },
        subOrder: {
          include: {
            lines: true,
            manufacturer: true,
          },
        },
        masterOrder: {
          include: { rfq: true },
        },
        manufacturer: true,
      },
    });

    if (!po) {
      throw new NotFoundException(`Purchase Order "${idOrPoNumber}" not found in PostgreSQL.`);
    }

    const lines = po.lines.map((l) => ({
      id: l.id.toString(),
      productId: l.productId,
      productName: l.productName,
      dosageForm: l.dosageForm || 'Tablet',
      quantity: l.quantity,
      uom: l.uom || 'Units',
      unitPrice: Number(l.unitPrice),
      totalPrice: Number(l.lineTotal),
    }));

    return {
      id: po.id.toString(),
      poNumber: po.poNumber,
      status: po.status,
      adminApprovalStatus: po.adminApprovalStatus || 'PENDING',
      isOnHold: po.isOnHold,
      holdReason: po.holdReason,
      masterOrderId: po.masterOrderId.toString(),
      masterOrderNumber: po.masterOrder.orderNumber,
      subOrderId: po.subOrderId.toString(),
      subOrderNumber: po.subOrder.subOrderNumber,
      customerName: po.buyerName || po.masterOrder.customerName,
      buyerGst: po.buyerGst || po.masterOrder.buyerGst,
      manufacturerId: po.manufacturerId.toString(),
      manufacturerName: po.mfgName || po.manufacturer.companyName,
      mfgGst: po.mfgGst,
      sourceQuoteRef: po.sourceQuoteRef,
      orderDate: po.orderDate ? po.orderDate.toISOString().split('T')[0] : null,
      deliveryDate: po.deliveryDate ? po.deliveryDate.toISOString().split('T')[0] : null,
      shippingAddress: po.shippingAddress || po.masterOrder.shippingAddress,
      billingAddress: po.billingAddress || po.masterOrder.billingAddress,
      totalAmount: Number(po.totalAmount),
      totalQuantity: po.totalQuantity,
      paymentTerms: po.paymentTerms || po.masterOrder.paymentTerms,
      deliveryTerms: po.deliveryTerms,
      lines,
    };
  }

  /**
   * Retrieves all Purchase Orders linked to a single Master Order.
   */
  async getAdminOrderPurchaseOrders(idOrCode: string | number) {
    const isNum = !isNaN(Number(idOrCode));
    const mo = await this.prisma.masterOrder.findFirst({
      where: isNum
        ? {
            OR: [
              { id: BigInt(idOrCode) },
              { orderNumber: String(idOrCode) },
            ],
          }
        : { orderNumber: String(idOrCode) },
      select: { id: true, orderNumber: true, customerName: true, buyerGst: true, shippingAddress: true, billingAddress: true, paymentTerms: true },
    });

    if (!mo) {
      throw new NotFoundException(`Master Order "${idOrCode}" not found in PostgreSQL.`);
    }

    const pos = await this.prisma.purchaseOrder.findMany({
      where: { masterOrderId: mo.id },
      include: {
        lines: { orderBy: { id: 'asc' } },
        subOrder: {
          include: {
            lines: true,
            manufacturer: true,
          },
        },
        manufacturer: true,
      },
      orderBy: { id: 'asc' },
    });

    return pos.map((po) => ({
      id: po.id.toString(),
      poNumber: po.poNumber,
      status: po.status,
      adminApprovalStatus: po.adminApprovalStatus || 'PENDING',
      isOnHold: po.isOnHold,
      holdReason: po.holdReason,
      masterOrderId: mo.id.toString(),
      masterOrderNumber: mo.orderNumber,
      subOrderId: po.subOrderId.toString(),
      subOrderNumber: po.subOrder?.subOrderNumber || '',
      customerName: po.buyerName || mo.customerName,
      buyerGst: po.buyerGst || mo.buyerGst,
      manufacturerId: po.manufacturerId.toString(),
      manufacturerName: po.mfgName || po.manufacturer?.companyName || '',
      mfgGst: po.mfgGst,
      sourceQuoteRef: po.sourceQuoteRef,
      orderDate: po.orderDate ? po.orderDate.toISOString().split('T')[0] : null,
      deliveryDate: po.deliveryDate ? po.deliveryDate.toISOString().split('T')[0] : null,
      shippingAddress: po.shippingAddress || mo.shippingAddress,
      billingAddress: po.billingAddress || mo.billingAddress,
      totalAmount: Number(po.totalAmount),
      totalQuantity: po.totalQuantity,
      paymentTerms: po.paymentTerms || mo.paymentTerms,
      deliveryTerms: po.deliveryTerms,
      lines: po.lines.map((l) => ({
        id: l.id.toString(),
        productId: l.productId,
        productName: l.productName,
        dosageForm: l.dosageForm || 'Tablet',
        quantity: l.quantity,
        uom: l.uom || 'Units',
        unitPrice: Number(l.unitPrice),
        totalPrice: Number(l.lineTotal),
      })),
    }));
  }

  /**
   * Approves a Master Order and configures Advance Payment rules in PostgreSQL.
   */
  async approveMasterOrder(idOrCode: string | number, dto: ApproveMasterOrderDto, user: AuthUser) {
    const isNum = !isNaN(Number(idOrCode));
    const mo = await this.prisma.masterOrder.findFirst({
      where: isNum
        ? {
            OR: [
              { id: BigInt(idOrCode) },
              { orderNumber: String(idOrCode) },
            ],
          }
        : { orderNumber: String(idOrCode) },
      include: { subOrders: true, purchaseOrders: true },
    });

    if (!mo) {
      throw new NotFoundException(`Master Order "${idOrCode}" not found.`);
    }

    const previousStatus = mo.status;
    const totalAmt = Number(mo.totalAmount || 0);
    const now = new Date();

    let nextStatus = 'CONFIRMED_RELEASED';
    let advStatus = 'NOT_REQUIRED';
    let advAmount = 0;
    let advOutstanding = 0;
    let advPct = dto.advancePercentage || 30;

    if (dto.advanceRequired) {
      nextStatus = 'PENDING_ADVANCE';
      advStatus = 'PENDING';
      if (dto.advanceMethod === 'FIXED_AMOUNT' && dto.fixedAmount !== undefined) {
        advAmount = Math.min(dto.fixedAmount, totalAmt);
        advPct = totalAmt > 0 ? Math.round((advAmount / totalAmt) * 100) : 30;
      } else {
        advAmount = Math.round((totalAmt * advPct) / 100);
      }
      advOutstanding = advAmount;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const uMo = await tx.masterOrder.update({
        where: { id: mo.id },
        data: {
          adminApprovalStatus: 'APPROVED',
          adminApprovedAt: now,
          adminApprovedBy: user.username,
          status: nextStatus,
          advanceRequired: Boolean(dto.advanceRequired),
          advanceStatus: advStatus,
          advanceMethod: dto.advanceMethod || 'PERCENTAGE',
          advancePercentage: advPct,
          advanceAmount: advAmount,
          advanceOutstanding: advOutstanding,
          advanceDueDate: dto.advanceDueDate ? new Date(dto.advanceDueDate) : null,
          advanceNotes: dto.advanceNotes || null,
        },
        include: {
          rfq: true,
          subOrders: {
            include: {
              lines: true,
              manufacturer: true,
              purchaseOrder: { include: { lines: true } },
            },
          },
          purchaseOrders: { include: { lines: true } },
          statusHistory: { orderBy: { changedAt: 'desc' } },
        },
      });

      // Update PO status
      await tx.purchaseOrder.updateMany({
        where: { masterOrderId: mo.id },
        data: {
          adminApprovalStatus: 'APPROVED',
        },
      });

      // Record in order status history
      await tx.orderStatusHistory.create({
        data: {
          masterOrderId: mo.id,
          previousStatus,
          newStatus: nextStatus,
          changedBy: user.username || 'Admin',
          changedAt: now,
          remarks: dto.advanceRequired
            ? `Admin approved PO. Advance payment of ₹${advAmount.toLocaleString('en-IN')} (${advPct}%) required from buyer.`
            : 'Admin approved PO. Advance payment: NOT REQUIRED. Released for execution.',
        },
      });

      return uMo;
    });

    return this.toAdminMasterOrderResponse(updated);
  }

  /**
   * Rejects a Master Order with mandatory rejection reason in PostgreSQL.
   */
  async rejectMasterOrder(idOrCode: string | number, dto: RejectMasterOrderDto, user: AuthUser) {
    if (!dto.reason || !dto.reason.trim()) {
      throw new BadRequestException('A reason for rejection is mandatory.');
    }

    const isNum = !isNaN(Number(idOrCode));
    const mo = await this.prisma.masterOrder.findFirst({
      where: isNum
        ? {
            OR: [
              { id: BigInt(idOrCode) },
              { orderNumber: String(idOrCode) },
            ],
          }
        : { orderNumber: String(idOrCode) },
      include: { subOrders: true, purchaseOrders: true },
    });

    if (!mo) {
      throw new NotFoundException(`Master Order "${idOrCode}" not found.`);
    }

    const previousStatus = mo.status;
    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const uMo = await tx.masterOrder.update({
        where: { id: mo.id },
        data: {
          adminApprovalStatus: 'REJECTED',
          status: 'REJECTED_BY_ADMIN',
          adminRejectionReason: dto.reason.trim(),
        },
        include: {
          rfq: true,
          subOrders: {
            include: {
              lines: true,
              manufacturer: true,
              purchaseOrder: { include: { lines: true } },
            },
          },
          purchaseOrders: { include: { lines: true } },
          statusHistory: { orderBy: { changedAt: 'desc' } },
        },
      });

      await tx.purchaseOrder.updateMany({
        where: { masterOrderId: mo.id },
        data: {
          adminApprovalStatus: 'REJECTED',
          status: 'REJECTED',
        },
      });

      await tx.subOrder.updateMany({
        where: { masterOrderId: mo.id },
        data: {
          status: 'REJECTED',
          rejectionReason: dto.reason.trim(),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          masterOrderId: mo.id,
          previousStatus,
          newStatus: 'REJECTED_BY_ADMIN',
          changedBy: user.username || 'Admin',
          changedAt: now,
          remarks: `Admin REJECTED purchase order. Reason: ${dto.reason.trim()}`,
        },
      });

      return uMo;
    });

    return this.toAdminMasterOrderResponse(updated);
  }

  /**
   * Places a Master Order on administrative hold with mandatory reason.
   */
  async holdMasterOrder(idOrCode: string | number, dto: HoldMasterOrderDto, user: AuthUser) {
    if (!dto.reason || !dto.reason.trim()) {
      throw new BadRequestException('A reason for placing on hold is mandatory.');
    }

    const isNum = !isNaN(Number(idOrCode));
    const mo = await this.prisma.masterOrder.findFirst({
      where: isNum
        ? {
            OR: [
              { id: BigInt(idOrCode) },
              { orderNumber: String(idOrCode) },
            ],
          }
        : { orderNumber: String(idOrCode) },
    });

    if (!mo) {
      throw new NotFoundException(`Master Order "${idOrCode}" not found.`);
    }

    const previousStatus = mo.status;
    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const uMo = await tx.masterOrder.update({
        where: { id: mo.id },
        data: {
          isOnHold: true,
          holdReason: dto.reason.trim(),
          holdCount: (mo.holdCount || 0) + 1,
          holdPlacedAt: now,
          holdPlacedBy: user.username || 'Admin',
        },
        include: {
          rfq: true,
          subOrders: {
            include: {
              lines: true,
              manufacturer: true,
              purchaseOrder: { include: { lines: true } },
            },
          },
          purchaseOrders: { include: { lines: true } },
          statusHistory: { orderBy: { changedAt: 'desc' } },
        },
      });

      await tx.purchaseOrder.updateMany({
        where: { masterOrderId: mo.id },
        data: {
          isOnHold: true,
          holdReason: dto.reason.trim(),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          masterOrderId: mo.id,
          previousStatus,
          newStatus: 'ON_HOLD',
          changedBy: user.username || 'Admin',
          changedAt: now,
          remarks: `Order placed on HOLD (Hold Count: ${(mo.holdCount || 0) + 1}). Reason: ${dto.reason.trim()}`,
        },
      });

      return uMo;
    });

    return this.toAdminMasterOrderResponse(updated);
  }

  /**
   * Releases an administrative hold on a Master Order.
   */
  async releaseHoldMasterOrder(idOrCode: string | number, user: AuthUser) {
    const isNum = !isNaN(Number(idOrCode));
    const mo = await this.prisma.masterOrder.findFirst({
      where: isNum
        ? {
            OR: [
              { id: BigInt(idOrCode) },
              { orderNumber: String(idOrCode) },
            ],
          }
        : { orderNumber: String(idOrCode) },
    });

    if (!mo) {
      throw new NotFoundException(`Master Order "${idOrCode}" not found.`);
    }

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const uMo = await tx.masterOrder.update({
        where: { id: mo.id },
        data: {
          isOnHold: false,
          holdReason: null,
        },
        include: {
          rfq: true,
          subOrders: {
            include: {
              lines: true,
              manufacturer: true,
              purchaseOrder: { include: { lines: true } },
            },
          },
          purchaseOrders: { include: { lines: true } },
          statusHistory: { orderBy: { changedAt: 'desc' } },
        },
      });

      await tx.purchaseOrder.updateMany({
        where: { masterOrderId: mo.id },
        data: {
          isOnHold: false,
          holdReason: null,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          masterOrderId: mo.id,
          previousStatus: 'ON_HOLD',
          newStatus: mo.status,
          changedBy: user.username || 'Admin',
          changedAt: now,
          remarks: 'Administrative hold RELEASED.',
        },
      });

      return uMo;
    });

    return this.toAdminMasterOrderResponse(updated);
  }
}
