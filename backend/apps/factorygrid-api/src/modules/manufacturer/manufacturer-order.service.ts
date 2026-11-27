import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '@factorygrid/auth';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ManufacturerOrderQueryDto,
  RejectOrderDto,
  UpdateOrderStatusDto,
} from './dto/manufacturer-order.dto';

@Injectable()
export class ManufacturerOrderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves the authenticated manufacturer registration entity from PostgreSQL.
   */
  async resolveManufacturer(user: AuthUser, explicitMfgId?: string) {
    let reg = await this.prisma.manufacturerRegistration.findFirst({
      where: { userId: BigInt(user.id) },
      orderBy: { id: 'desc' },
    });

    if (!reg) {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: BigInt(user.id) },
      });
      if (dbUser?.email) {
        reg = await this.prisma.manufacturerRegistration.findFirst({
          where: { email: { equals: dbUser.email.trim(), mode: 'insensitive' } },
          orderBy: { id: 'desc' },
        });
        if (reg && !reg.userId) {
          await this.prisma.manufacturerRegistration.update({
            where: { id: reg.id },
            data: { userId: BigInt(user.id) },
          });
        }
      }
    }

    const isPrivileged = user.roles?.some(
      (r) =>
        r.includes('ADMIN') ||
        r.includes('COMPLIANCE') ||
        r.includes('ROLE_ADMIN') ||
        r.includes('ROLE_COMPLIANCE_OFFICER'),
    );

    if (explicitMfgId) {
      if (isPrivileged) {
        const targetReg = await this.prisma.manufacturerRegistration.findFirst({
          where: {
            OR: [
              { registrationCode: explicitMfgId },
              ...(isNaN(Number(explicitMfgId)) ? [] : [{ id: BigInt(explicitMfgId) }]),
            ],
          },
        });
        if (targetReg) return targetReg;
      }

      if (reg) {
        const isMatch =
          reg.registrationCode === explicitMfgId ||
          reg.manufacturerCode === explicitMfgId ||
          String(reg.id) === explicitMfgId;
        if (!isMatch && !isPrivileged) {
          throw new ForbiddenException(
            'Manufacturer Isolation: You do not have permission to access orders for another facility.',
          );
        }
      }
    }

    if (!reg && isPrivileged) {
      reg = await this.prisma.manufacturerRegistration.findFirst({
        where: { status: { in: ['APPROVED', 'Active', 'VERIFIED'] } },
        orderBy: { id: 'asc' },
      });
      if (!reg) {
        reg = await this.prisma.manufacturerRegistration.findFirst({
          orderBy: { id: 'asc' },
        });
      }
    }

    if (!reg) {
      throw new NotFoundException(
        'No manufacturer registration found associated with this account.',
      );
    }

    return reg;
  }

  /**
   * Computes the effective UI workflow status for a sub-order.
   */
  getEffectiveStatus(so: { status: string; productionStatus?: string | null }): string {
    const st = (so.status || '').toLowerCase();
    const ps = (so.productionStatus || '').toUpperCase();

    if (st === 'rejected' || ps === 'REJECTED') {
      return 'Rejected';
    }

    if (
      st === 'awaiting acceptance' ||
      st === 'awaiting_acceptance' ||
      ps === 'AWAITING_ACCEPTANCE'
    ) {
      return 'Awaiting Acceptance';
    }

    if (
      ps === 'PO_ACCEPTED' ||
      ps === 'ACCEPTED' ||
      st === 'accepted' ||
      st === 'po_accepted'
    ) {
      return 'Accepted';
    }

    if (ps === 'ARTWORK' || ps === 'ARTWORK_PENDING') {
      return 'Artwork Pending';
    }

    if (ps === 'SCHEDULED' || st === 'scheduled') {
      return 'Scheduled';
    }

    if (ps === 'IN_PRODUCTION') {
      return 'In Production';
    }

    if (
      ps === 'QUALITY_INSPECTION' ||
      ps === 'PACKAGING' ||
      ps === 'QUALITY_PACKAGING' ||
      ps === 'QUALITY_HOLD'
    ) {
      return 'Quality & Packaging';
    }

    if (ps === 'READY_TO_DISPATCH') {
      return 'Ready to Dispatch';
    }

    if (ps === 'COMPLETED' || st === 'completed') {
      return 'Completed';
    }

    return 'Awaiting Acceptance';
  }

  /**
   * Lists manufacturer orders from PostgreSQL with real computed metrics and filters.
   */
  async listManufacturerOrders(user: AuthUser, query: ManufacturerOrderQueryDto) {
    const mfg = await this.resolveManufacturer(user);

    // Fetch all sub-orders belonging to this manufacturer
    const allOrders = await this.prisma.subOrder.findMany({
      where: { manufacturerId: mfg.id },
      include: {
        masterOrder: true,
        lines: { orderBy: { id: 'asc' } },
        purchaseOrder: {
          include: { lines: { orderBy: { id: 'asc' } } },
        },
        statusHistory: { orderBy: { changedAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute dynamic KPI metrics across all stages for this manufacturer
    let openCount = 0;
    let awaitingCount = 0;
    let acceptedCount = 0;
    let artworkCount = 0;
    let scheduledCount = 0;
    let inProdCount = 0;
    let qcPackCount = 0;
    let readyCount = 0;
    let completedCount = 0;
    let rejectedCount = 0;

    for (const so of allOrders) {
      const eff = this.getEffectiveStatus(so);
      if (eff !== 'Rejected') openCount++;
      if (eff === 'Awaiting Acceptance') awaitingCount++;
      else if (eff === 'Accepted') acceptedCount++;
      else if (eff === 'Artwork Pending') artworkCount++;
      else if (eff === 'Scheduled') scheduledCount++;
      else if (eff === 'In Production') inProdCount++;
      else if (eff === 'Quality & Packaging') qcPackCount++;
      else if (eff === 'Ready to Dispatch') readyCount++;
      else if (eff === 'Completed') completedCount++;
      else if (eff === 'Rejected') rejectedCount++;
    }

    const metrics = {
      open: openCount,
      awaiting: awaitingCount,
      accepted: acceptedCount,
      artwork: artworkCount,
      scheduled: scheduledCount,
      inProd: inProdCount,
      qcPack: qcPackCount,
      ready: readyCount,
      completed: completedCount,
      rejected: rejectedCount,
      total: allOrders.length,
    };

    // Filter by status tab if specified
    let filtered = allOrders;
    const filterStatus = query.status?.trim();
    if (filterStatus && filterStatus !== 'ALL') {
      const normalizedFilter = filterStatus.toLowerCase();
      filtered = filtered.filter((so) => {
        const eff = this.getEffectiveStatus(so).toLowerCase();
        if (normalizedFilter === 'awaiting_acceptance' || normalizedFilter === 'awaiting acceptance') {
          return eff === 'awaiting acceptance';
        }
        if (normalizedFilter === 'artwork_pending' || normalizedFilter === 'artwork pending') {
          return eff === 'artwork pending';
        }
        if (normalizedFilter === 'quality_packaging' || normalizedFilter === 'quality & packaging') {
          return eff === 'quality & packaging';
        }
        if (normalizedFilter === 'ready_to_dispatch' || normalizedFilter === 'ready to dispatch') {
          return eff === 'ready to dispatch';
        }
        if (normalizedFilter === 'in_production' || normalizedFilter === 'in production') {
          return eff === 'in production';
        }
        return eff === normalizedFilter;
      });
    }

    // Filter by search query
    const search = query.search?.toLowerCase().trim();
    if (search) {
      filtered = filtered.filter((so) => {
        const matchSO = so.subOrderNumber.toLowerCase().includes(search);
        const matchMO = so.masterOrder.orderNumber.toLowerCase().includes(search);
        const matchPO = (so.purchaseOrder?.poNumber || '').toLowerCase().includes(search);
        const matchCust = so.masterOrder.customerName.toLowerCase().includes(search);
        const matchProd = so.lines.some((l) =>
          l.productName.toLowerCase().includes(search),
        );
        const matchStat = this.getEffectiveStatus(so).toLowerCase().includes(search);
        return matchSO || matchMO || matchPO || matchCust || matchProd || matchStat;
      });
    }

    // Pagination
    const page = Math.max(1, Number(query.page || 1));
    const size = Math.min(100, Math.max(1, Number(query.size || 20)));
    const total = filtered.length;
    const totalPages = Math.ceil(total / size) || 1;
    const startIndex = (page - 1) * size;
    const paginated = filtered.slice(startIndex, startIndex + size);

    const formattedOrders = paginated.map((so) => this.toOrderResponse(so, mfg));

    return {
      manufacturer: {
        id: mfg.id.toString(),
        registrationCode: mfg.registrationCode,
        companyName: mfg.companyName,
      },
      metrics,
      pagination: {
        page,
        size,
        total,
        totalPages,
      },
      orders: formattedOrders,
    };
  }

  /**
   * Retrieves complete order detail by sub-order ID or sub-order number.
   */
  async getManufacturerOrderDetail(idOrCode: string | number, user: AuthUser) {
    const mfg = await this.resolveManufacturer(user);
    const isNum = !isNaN(Number(idOrCode));

    const so = await this.prisma.subOrder.findFirst({
      where: isNum
        ? {
            OR: [
              { id: BigInt(idOrCode) },
              { subOrderNumber: String(idOrCode) },
            ],
          }
        : { subOrderNumber: String(idOrCode) },
      include: {
        masterOrder: true,
        lines: { orderBy: { id: 'asc' } },
        purchaseOrder: {
          include: { lines: { orderBy: { id: 'asc' } } },
        },
        statusHistory: { orderBy: { changedAt: 'desc' } },
      },
    });

    if (!so) {
      throw new NotFoundException(`Order "${idOrCode}" not found.`);
    }

    const isPrivileged = user.roles?.some((r) => r.includes('ADMIN') || r.includes('COMPLIANCE'));
    if (so.manufacturerId !== mfg.id && !isPrivileged) {
      throw new ForbiddenException('Access denied: this order belongs to another manufacturer.');
    }

    return this.toOrderResponse(so, mfg);
  }

  /**
   * Accepts an order / purchase order.
   */
  async acceptOrder(idOrCode: string | number, user: AuthUser) {
    const mfg = await this.resolveManufacturer(user);
    const isNum = !isNaN(Number(idOrCode));

    const so = await this.prisma.subOrder.findFirst({
      where: isNum
        ? {
            OR: [
              { id: BigInt(idOrCode) },
              { subOrderNumber: String(idOrCode) },
            ],
          }
        : { subOrderNumber: String(idOrCode) },
      include: { masterOrder: true, purchaseOrder: true },
    });

    if (!so) {
      throw new NotFoundException(`Order "${idOrCode}" not found.`);
    }

    const isPrivileged = user.roles?.some((r) => r.includes('ADMIN') || r.includes('COMPLIANCE'));
    if (so.manufacturerId !== mfg.id && !isPrivileged) {
      throw new ForbiddenException('Access denied: this order belongs to another manufacturer.');
    }

    // Check if order is already accepted
    const effectiveStatus = this.getEffectiveStatus(so);
    if (effectiveStatus !== 'Awaiting Acceptance') {
      throw new BadRequestException('Order has already been accepted.');
    }

    // Check advance payment constraint if required on parent master order
    if (so.masterOrder.advanceRequired && Number(so.masterOrder.advanceOutstanding) > 0) {
      throw new BadRequestException(
        `Manufacturer Execution Blocked: Required Advance Payment (₹${Number(so.masterOrder.advanceOutstanding).toLocaleString('en-IN')}) is outstanding on Master Order ${so.masterOrder.orderNumber}. Acceptance is locked until full advance is recorded.`,
      );
    }

    const previousStatus = so.status || 'AWAITING_ACCEPTANCE';
    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const uSo = await tx.subOrder.update({
        where: { id: so.id },
        data: {
          status: 'ACCEPTED',
          productionStatus: 'ACCEPTED',
          acceptedAt: now,
        },
        include: {
          masterOrder: true,
          lines: true,
          purchaseOrder: { include: { lines: true } },
          statusHistory: { orderBy: { changedAt: 'desc' } },
        },
      });

      if (so.purchaseOrder) {
        await tx.purchaseOrder.update({
          where: { id: so.purchaseOrder.id },
          data: { status: 'ACCEPTED' },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          subOrderId: so.id,
          previousStatus,
          newStatus: 'ACCEPTED',
          changedBy: user.username || mfg.companyName || 'Manufacturer',
          changedAt: now,
          remarks: 'Purchase Order accepted by manufacturer',
        },
      });

      return uSo;
    });

    return this.toOrderResponse(updated, mfg);
  }

  /**
   * Rejects an order with reason and remarks.
   */
  async rejectOrder(idOrCode: string | number, dto: RejectOrderDto, user: AuthUser) {
    const mfg = await this.resolveManufacturer(user);
    const isNum = !isNaN(Number(idOrCode));

    const so = await this.prisma.subOrder.findFirst({
      where: isNum
        ? {
            OR: [
              { id: BigInt(idOrCode) },
              { subOrderNumber: String(idOrCode) },
            ],
          }
        : { subOrderNumber: String(idOrCode) },
      include: { masterOrder: true, purchaseOrder: true },
    });

    if (!so) {
      throw new NotFoundException(`Order "${idOrCode}" not found.`);
    }

    const isPrivileged = user.roles?.some((r) => r.includes('ADMIN') || r.includes('COMPLIANCE'));
    if (so.manufacturerId !== mfg.id && !isPrivileged) {
      throw new ForbiddenException('Access denied: this order belongs to another manufacturer.');
    }

    const previousStatus = so.status;
    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const uSo = await tx.subOrder.update({
        where: { id: so.id },
        data: {
          status: 'Rejected',
          productionStatus: 'REJECTED',
          rejectionReason: dto.rejectionReason,
          rejectionRemarks: dto.rejectionRemarks || null,
        },
        include: {
          masterOrder: true,
          lines: true,
          purchaseOrder: { include: { lines: true } },
          statusHistory: { orderBy: { changedAt: 'desc' } },
        },
      });

      if (so.purchaseOrder) {
        await tx.purchaseOrder.update({
          where: { id: so.purchaseOrder.id },
          data: { status: 'REJECTED' },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          subOrderId: so.id,
          previousStatus,
          newStatus: 'Rejected',
          changedBy: user.username || mfg.companyName || 'Manufacturer',
          changedAt: now,
          remarks: `Manufacturer ${mfg.companyName} REJECTED Purchase Order ${so.purchaseOrder?.poNumber || so.subOrderNumber}. Reason: ${dto.rejectionReason}. Remarks: ${dto.rejectionRemarks || 'None'}`,
        },
      });

      return uSo;
    });

    return this.toOrderResponse(updated, mfg);
  }

  /**
   * Updates manufacturing workflow status with state validation.
   */
  async updateOrderStatus(idOrCode: string | number, dto: UpdateOrderStatusDto, user: AuthUser) {
    const mfg = await this.resolveManufacturer(user);
    const isNum = !isNaN(Number(idOrCode));

    const so = await this.prisma.subOrder.findFirst({
      where: isNum
        ? {
            OR: [
              { id: BigInt(idOrCode) },
              { subOrderNumber: String(idOrCode) },
            ],
          }
        : { subOrderNumber: String(idOrCode) },
      include: { masterOrder: true, purchaseOrder: true },
    });

    if (!so) {
      throw new NotFoundException(`Order "${idOrCode}" not found.`);
    }

    const isPrivileged = user.roles?.some((r) => r.includes('ADMIN') || r.includes('COMPLIANCE'));
    if (so.manufacturerId !== mfg.id && !isPrivileged) {
      throw new ForbiddenException('Access denied: this order belongs to another manufacturer.');
    }

    const normalizedTarget = dto.status.trim().toUpperCase();
    const validProductionStatuses = [
      'ACCEPTED',
      'PO_ACCEPTED',
      'ARTWORK',
      'ARTWORK_PENDING',
      'SCHEDULED',
      'IN_PRODUCTION',
      'QUALITY_INSPECTION',
      'PACKAGING',
      'QUALITY_PACKAGING',
      'READY_TO_DISPATCH',
      'COMPLETED',
      'REJECTED',
    ];

    if (!validProductionStatuses.includes(normalizedTarget)) {
      throw new BadRequestException(
        `Invalid status "${dto.status}". Allowed values: ${validProductionStatuses.join(', ')}`,
      );
    }

    const previousStatus = so.productionStatus || so.status;
    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const uSo = await tx.subOrder.update({
        where: { id: so.id },
        data: {
          productionStatus: normalizedTarget,
          status: normalizedTarget === 'COMPLETED' ? 'Completed' : normalizedTarget === 'REJECTED' ? 'Rejected' : so.status,
        },
        include: {
          masterOrder: true,
          lines: true,
          purchaseOrder: { include: { lines: true } },
          statusHistory: { orderBy: { changedAt: 'desc' } },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          subOrderId: so.id,
          previousStatus,
          newStatus: normalizedTarget,
          changedBy: user.username || mfg.companyName || 'Manufacturer',
          changedAt: now,
          remarks: dto.remarks || `Status transitioned to ${normalizedTarget}`,
        },
      });

      return uSo;
    });

    return this.toOrderResponse(updated, mfg);
  }

  /**
   * Retrieves a Purchase Order by ID or PO Number from PostgreSQL.
   */
  async getPurchaseOrder(poIdOrNumber: string | number, user: AuthUser) {
    const mfg = await this.resolveManufacturer(user);
    const isNum = !isNaN(Number(poIdOrNumber));

    const po = await this.prisma.purchaseOrder.findFirst({
      where: isNum
        ? {
            OR: [
              { id: BigInt(poIdOrNumber) },
              { poNumber: String(poIdOrNumber) },
            ],
          }
        : { poNumber: String(poIdOrNumber) },
      include: {
        lines: { orderBy: { id: 'asc' } },
        subOrder: {
          include: {
            masterOrder: true,
            lines: true,
          },
        },
        manufacturer: true,
      },
    });

    if (!po) {
      throw new NotFoundException(`Purchase Order "${poIdOrNumber}" not found.`);
    }

    const isPrivileged = user.roles?.some((r) => r.includes('ADMIN') || r.includes('COMPLIANCE'));
    if (po.manufacturerId !== mfg.id && !isPrivileged) {
      throw new ForbiddenException('Access denied: this purchase order belongs to another manufacturer.');
    }

    const lines = po.lines.map((l) => ({
      id: l.id.toString(),
      productId: l.productId || '',
      productName: l.productName,
      dosageForm: l.dosageForm || 'Tablet',
      quantity: l.quantity,
      uom: l.uom || 'Units',
      unitPrice: Number(l.unitPrice),
      lineTotal: Number(l.lineTotal),
    }));

    const subtotal = lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice), 0);
    const totalAmount = Number(po.totalAmount) || subtotal;

    return {
      id: po.id.toString(),
      poNumber: po.poNumber,
      subOrderNumber: po.subOrder.subOrderNumber,
      subOrderId: po.subOrder.id.toString(),
      masterOrderNumber: po.subOrder.masterOrder.orderNumber,
      masterOrderId: po.subOrder.masterOrder.id.toString(),
      customerName: po.buyerName || po.subOrder.masterOrder.customerName,
      buyerGst: po.buyerGst || po.subOrder.masterOrder.buyerGst || '—',
      mfgName: po.mfgName || po.manufacturer.companyName,
      mfgGst: po.mfgGst || '—',
      sourceQuoteRef: po.sourceQuoteRef || po.subOrder.sourceQuoteRef || '—',
      orderDate: po.orderDate ? po.orderDate.toISOString().split('T')[0] : '',
      deliverySchedule: po.deliveryDate
        ? po.deliveryDate.toISOString().split('T')[0]
        : `${po.subOrder.leadTimeDays || 14} Days`,
      shippingAddress: po.shippingAddress || po.subOrder.shippingAddress || po.subOrder.masterOrder.shippingAddress || '—',
      billingAddress: po.billingAddress || po.subOrder.billingAddress || po.subOrder.masterOrder.billingAddress || '—',
      status: po.status,
      subOrderStatus: po.subOrder.status,
      totalQuantity: po.totalQuantity || lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal,
      orderValue: totalAmount,
      totalAmount,
      advanceRequired: po.subOrder.masterOrder.advanceRequired,
      advanceOutstanding: Number(po.subOrder.masterOrder.advanceOutstanding),
      lines,
    };
  }

  /**
   * Formats a SubOrder database record into the JSON contract expected by the UI table.
   */
  private toOrderResponse(so: any, mfg: any) {
    const effStatus = this.getEffectiveStatus(so);
    const lines = (so.lines || []).map((l: any) => ({
      id: l.id.toString(),
      productId: l.productId || '',
      name: l.productName,
      productName: l.productName,
      dosageForm: l.dosageForm || 'Tablet',
      quantity: Number(l.quantity),
      uom: l.uom || 'Units',
      unitPrice: Number(l.unitPrice),
      lineTotal: Number(l.lineTotal || l.unitPrice * l.quantity),
      leadTime: `${l.leadTimeDays || so.leadTimeDays || 14} Days`,
    }));

    const totalQty = so.totalQuantity || lines.reduce((sum: number, l: any) => sum + l.quantity, 0);
    const orderVal = Number(so.totalAmount) || lines.reduce((sum: number, l: any) => sum + l.lineTotal, 0);

    return {
      id: so.id.toString(),
      orderNumber: so.subOrderNumber,
      subOrderNumber: so.subOrderNumber,
      masterOrderNumber: so.masterOrder.orderNumber,
      purchaseOrderNumber: so.purchaseOrder?.poNumber || `PO-${so.subOrderNumber}`,
      poId: so.purchaseOrder?.id ? so.purchaseOrder.id.toString() : null,
      poNumber: so.purchaseOrder?.poNumber || `PO-${so.subOrderNumber}`,
      mfgId: mfg.id.toString(),
      mfgName: mfg.companyName,
      customer: {
        id: so.masterOrder.buyerId ? so.masterOrder.buyerId.toString() : '',
        name: so.masterOrder.customerName,
        code: so.masterOrder.customerCode || '',
        classification: so.masterOrder.customerClassification === 'SPECIAL_PARTY' ? 'B2B_SPECIAL' : (so.masterOrder.customerClassification === 'REGULAR' || !so.masterOrder.customerClassification ? 'B2B' : so.masterOrder.customerClassification),
      },
      customerName: so.masterOrder.customerName,
      orderDate: so.masterOrder.orderDate
        ? so.masterOrder.orderDate.toISOString().split('T')[0]
        : (so.createdAt ? so.createdAt.toISOString().split('T')[0] : ''),
      deliverySchedule: so.deliveryDate
        ? so.deliveryDate.toISOString().split('T')[0]
        : (so.masterOrder.expectedDeliveryDate ? so.masterOrder.expectedDeliveryDate.toISOString().split('T')[0] : `${so.leadTimeDays || 14} Days`),
      deliveryDate: so.deliveryDate
        ? so.deliveryDate.toISOString().split('T')[0]
        : `${so.leadTimeDays || 14} Days`,
      shippingAddress: so.shippingAddress || so.masterOrder.shippingAddress || '',
      billingAddress: so.billingAddress || so.masterOrder.billingAddress || '',
      buyerGst: so.masterOrder.buyerGst || '',
      mfgGst: so.purchaseOrder?.mfgGst || '',
      sourceQuoteRef: so.sourceQuoteRef || '—',
      products: lines,
      lines,
      productsCount: lines.length,
      totalQuantity: totalQty,
      orderValue: orderVal,
      leadTimeDays: so.leadTimeDays || 14,
      status: effStatus,
      rawStatus: so.status,
      productionStatus: so.productionStatus,
      rejectionReason: so.rejectionReason,
      rejectionRemarks: so.rejectionRemarks,
      acceptedAt: so.acceptedAt ? so.acceptedAt.toISOString() : null,
      advanceRequired: so.masterOrder.advanceRequired,
      advanceOutstanding: Number(so.masterOrder.advanceOutstanding),
      statusHistory: (so.statusHistory || []).map((sh: any) => ({
        id: sh.id.toString(),
        previousStatus: sh.previousStatus,
        newStatus: sh.newStatus,
        changedBy: sh.changedBy,
        changedAt: sh.changedAt ? sh.changedAt.toISOString() : '',
        remarks: sh.remarks || '',
      })),
    };
  }
}
