import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '@factorygrid/auth';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRfqDto, UpdateRfqDto } from './dto/rfq.dto';
import {
  AdminRfqQueryDto,
  AdminRfqStatsResponseDto,
  SubmitGenericAdminPricingDto,
} from './dto/admin-rfq.dto';
import {
  BuyerQuoteComparisonQueryDto,
  SelectQuoteComparisonPayloadDto,
} from './dto/buyer-quote-comparison.dto';

@Injectable()
export class RfqService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves actual authenticated buyer identity and organization data from PostgreSQL.
   */
  private async resolveBuyer(userId: number, user: AuthUser) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!dbUser) {
      throw new NotFoundException(`Authenticated user with ID ${userId} not found.`);
    }

    if (dbUser.accountStatus === 'SUSPENDED' || dbUser.accountStatus === 'INACTIVE') {
      throw new ForbiddenException(`Your buyer account is ${dbUser.accountStatus.toLowerCase()}. Access to procurement operations is restricted.`);
    }

    // Attempt to locate buyer registration
    let reg = await this.prisma.buyerRegistration.findFirst({
      where: { userId: BigInt(userId) },
      orderBy: { createdAt: 'desc' },
    });

    if (!reg && dbUser.email) {
      reg = await this.prisma.buyerRegistration.findFirst({
        where: { email: { equals: dbUser.email.trim(), mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Locate customer verification code
    const verification = await this.prisma.customerVerificationRequest.findFirst({
      where: {
        OR: [
          { userId: BigInt(userId) },
          ...(dbUser.email ? [{ email: { equals: dbUser.email.trim(), mode: 'insensitive' as const } }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (verification?.verificationStatus === 'Rejected') {
      throw new ForbiddenException('Your customer verification was rejected by compliance. Please review requested requirements before creating RFQs.');
    }

    const isSpecialApproved =
      dbUser.accountStatus === 'ACTIVE' &&
      (verification?.verificationStatus === 'Active' || verification?.verificationStatus === 'Approved') &&
      verification?.customerClassification === 'SPECIAL_PARTY';

    const customerClassification = isSpecialApproved ? 'SPECIAL_PARTY' : 'REGULAR';
    const buyerName = dbUser.fullName || user.username;
    const companyName = dbUser.companyName || reg?.companyName || 'My Organization';
    const customerCode = verification?.customerCode || dbUser.companyCode || reg?.registrationCode || 'CUS-PENDING';

    return {
      userId: dbUser.id,
      buyerRegistrationId: reg?.id || null,
      buyerName,
      companyName,
      customerCode,
      customerClassification,
      isSpecialApproved,
      defaultDeliveryAddress: reg?.shippingAddress
        ? `${reg.shippingAddress}, ${reg.state || ''} ${reg.pincode || ''}`.trim()
        : reg?.billingAddress || '',
    };
  }

  /**
   * Generates a unique, sequential backend-controlled RFQ number (RFQ-YYYY-XXXX).
   */
  private async generateNextRfqNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `RFQ-${currentYear}-`;

    const lastRfq = await this.prisma.rfq.findFirst({
      where: { rfqNumber: { startsWith: prefix } },
      orderBy: { id: 'desc' },
      select: { rfqNumber: true },
    });

    let nextSeq = 1001;
    if (lastRfq?.rfqNumber) {
      const parts = lastRfq.rfqNumber.split('-');
      const numPart = parseInt(parts[2], 10);
      if (!isNaN(numPart)) {
        nextSeq = numPart + 1;
      }
    }

    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Creates a new RFQ (Draft or Submitted) for the authenticated buyer.
   */
  async createRfq(userId: number, dto: CreateRfqDto, user: AuthUser) {
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('At least one product line is required to create an RFQ.');
    }

    for (const [idx, line] of dto.lines.entries()) {
      if (!line.productName?.trim()) {
        throw new BadRequestException(`Line #${idx + 1}: Product name is required.`);
      }
      if (!line.quantity || line.quantity <= 0) {
        throw new BadRequestException(`Line #${idx + 1}: Quantity must be greater than zero.`);
      }
    }

    const buyer = await this.resolveBuyer(userId, user);

    const hasSpecialPricing = dto.lines.some(
      (l: any) => l.buyerProvidedPrice !== undefined && l.buyerProvidedPrice !== null && Number(l.buyerProvidedPrice) > 0,
    );
    const isRequestingSpecialParty = dto.customerClassification === 'SPECIAL_PARTY' || hasSpecialPricing;

    if (isRequestingSpecialParty && !buyer.isSpecialApproved) {
      throw new ForbiddenException(
        'Your account is approved as a Standard Regular Buyer. Special Buyer pre-agreed pricing workflow is restricted to verified and approved Special Buyers.',
      );
    }

    const rfqNumber = await this.generateNextRfqNumber();

    const isSubmitted = dto.status === 'Submitted';
    const initialStatus = isSubmitted
      ? (dto.isGeneric || dto.lines.some((l) => l.productType === 'GENERIC') ? 'Pricing In Progress' : 'Submitted')
      : 'Draft';

    const parseDate = (d?: string) => {
      if (!d) return null;
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const effectiveClassification = (buyer.isSpecialApproved && dto.customerClassification === 'SPECIAL_PARTY')
      ? 'SPECIAL_PARTY'
      : 'REGULAR';

    const rfq = await this.prisma.$transaction(async (tx) => {
      const createdRfq = await tx.rfq.create({
        data: {
          rfqNumber,
          userId: buyer.userId,
          buyerRegistrationId: buyer.buyerRegistrationId,
          buyerName: buyer.buyerName,
          companyName: buyer.companyName,
          customerCode: buyer.customerCode,
          customerClassification: effectiveClassification,
          status: initialStatus,
          priority: dto.priority || 'STANDARD',
          deliveryLocation: dto.deliveryLocation || buyer.defaultDeliveryAddress || 'Primary Delivery Address',
          rfqDate: new Date(),
          requiredDate: parseDate(dto.requiredDate),
          deadlineDate: parseDate(dto.deadlineDate),
          remarks: dto.remarks || null,
          creditRequired: !!dto.creditRequired,
          creditTerms: dto.creditTerms || null,
          isGeneric: !!dto.isGeneric || dto.lines.some((l) => l.productType === 'GENERIC'),
          submittedAt: isSubmitted ? new Date() : null,
        },
      });

      for (let i = 0; i < dto.lines.length; i++) {
        const line = dto.lines[i];
        let resolvedProductId: string | null = null;
        let resolvedProductCode: string | null = line.productCode?.trim() || null;

        if (line.productId?.trim() && line.productId !== 'other') {
          const prod = await tx.catalogProduct.findFirst({
            where: {
              OR: [
                { id: line.productId.trim() },
                { productCode: line.productId.trim() },
              ],
            },
          });
          if (prod) {
            resolvedProductId = prod.id;
            resolvedProductCode = prod.productCode;
          }
        }

        await tx.rfqLine.create({
          data: {
            rfqId: createdRfq.id,
            lineItemNumber: i + 1,
            productId: resolvedProductId,
            productName: line.productName.trim(),
            productCode: resolvedProductCode,
            category: line.category?.trim() || null,
            subCategory: line.subCategory?.trim() || null,
            subSubCategory: line.subSubCategory?.trim() || null,
            productType: line.productType === 'GENERIC' ? 'GENERIC' : 'BRANDED',
            dosageForm: line.dosageForm?.trim() || null,
            packSize: line.packSize?.trim() || null,
            uom: line.uom?.trim() || 'Units',
            quantity: line.quantity,
            targetPrice: line.buyerProvidedPrice !== undefined && line.buyerProvidedPrice !== null
              ? line.buyerProvidedPrice
              : (line.targetPrice !== undefined && line.targetPrice !== null ? line.targetPrice : null),
            requiredDate: parseDate(line.requiredDate || dto.requiredDate),
            remarks: line.remarks?.trim() || null,
            molecule: line.molecule?.trim() || null,
            strength: line.strength?.trim() || null,
          },
        });
      }

      if (isSubmitted) {
        await this.assignManufacturersToRfq(tx, createdRfq.id);
      }

      return tx.rfq.findUnique({
        where: { id: createdRfq.id },
        include: { lines: { orderBy: { lineItemNumber: 'asc' } } },
      });
    });

    return this.toRfqResponse(rfq!);
  }

  /**
   * Updates an existing RFQ draft owned by the authenticated buyer.
   */
  async updateRfq(id: number, userId: number, dto: UpdateRfqDto, user: AuthUser) {
    const existing = await this.prisma.rfq.findUnique({
      where: { id: BigInt(id) },
      include: { lines: true },
    });

    if (!existing) {
      throw new NotFoundException(`RFQ with ID ${id} not found.`);
    }

    // Cross-buyer security check
    const isPrivileged = user.roles.some((r) => r.includes('ADMIN') || r.includes('COMPLIANCE'));
    if (!isPrivileged && existing.userId !== BigInt(userId)) {
      throw new ForbiddenException("Access to another buyer's RFQ is denied.");
    }

    if (!isPrivileged && existing.status !== 'Draft') {
      throw new BadRequestException(`Cannot edit RFQ in "${existing.status}" status. Only Drafts can be modified.`);
    }

    const buyer = await this.resolveBuyer(userId, user);

    const hasSpecialPricing = dto.lines?.some(
      (l: any) => l.buyerProvidedPrice !== undefined && l.buyerProvidedPrice !== null && Number(l.buyerProvidedPrice) > 0,
    );
    const isUpdatingToSpecial = dto.customerClassification === 'SPECIAL_PARTY' || hasSpecialPricing;

    if (isUpdatingToSpecial && !buyer.isSpecialApproved) {
      throw new ForbiddenException(
        'Your account is approved as a Standard Regular Buyer. Special Buyer pre-agreed pricing workflow is restricted to verified and approved Special Buyers.',
      );
    }

    const parseDate = (d?: string) => {
      if (!d) return null;
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const updated = await this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (dto.priority !== undefined) updateData.priority = dto.priority;
      if (dto.deliveryLocation !== undefined) updateData.deliveryLocation = dto.deliveryLocation;
      if (dto.requiredDate !== undefined) updateData.requiredDate = parseDate(dto.requiredDate);
      if (dto.deadlineDate !== undefined) updateData.deadlineDate = parseDate(dto.deadlineDate);
      if (dto.remarks !== undefined) updateData.remarks = dto.remarks;
      if (dto.creditRequired !== undefined) updateData.creditRequired = dto.creditRequired;
      if (dto.creditTerms !== undefined) updateData.creditTerms = dto.creditTerms;
      if (dto.customerClassification !== undefined) {
        updateData.customerClassification = (buyer.isSpecialApproved && dto.customerClassification === 'SPECIAL_PARTY')
          ? 'SPECIAL_PARTY'
          : 'REGULAR';
      }

      if (dto.lines && dto.lines.length > 0) {
        updateData.isGeneric = dto.lines.some((l) => l.productType === 'GENERIC');
        // Delete old lines and re-insert
        await tx.rfqLine.deleteMany({ where: { rfqId: existing.id } });
        for (let i = 0; i < dto.lines.length; i++) {
          const line = dto.lines[i];
          let resolvedProductId: string | null = null;
          let resolvedProductCode: string | null = line.productCode?.trim() || null;

          if (line.productId?.trim() && line.productId !== 'other') {
            const prod = await tx.catalogProduct.findFirst({
              where: {
                OR: [
                  { id: line.productId.trim() },
                  { productCode: line.productId.trim() },
                ],
              },
            });
            if (prod) {
              resolvedProductId = prod.id;
              resolvedProductCode = prod.productCode;
            }
          }

          await tx.rfqLine.create({
            data: {
              rfqId: existing.id,
              lineItemNumber: i + 1,
              productId: resolvedProductId,
              productName: line.productName.trim(),
              productCode: resolvedProductCode,
              category: line.category?.trim() || null,
              subCategory: line.subCategory?.trim() || null,
              subSubCategory: line.subSubCategory?.trim() || null,
              productType: line.productType === 'GENERIC' ? 'GENERIC' : 'BRANDED',
              dosageForm: line.dosageForm?.trim() || null,
              packSize: line.packSize?.trim() || null,
              uom: line.uom?.trim() || 'Units',
              quantity: line.quantity,
              targetPrice: line.buyerProvidedPrice !== undefined && line.buyerProvidedPrice !== null
                ? line.buyerProvidedPrice
                : (line.targetPrice !== undefined && line.targetPrice !== null ? line.targetPrice : null),
              requiredDate: parseDate(line.requiredDate || dto.requiredDate),
              remarks: line.remarks?.trim() || null,
              molecule: line.molecule?.trim() || null,
              strength: line.strength?.trim() || null,
            },
          });
        }
      }

      return tx.rfq.update({
        where: { id: existing.id },
        data: updateData,
        include: { lines: { orderBy: { lineItemNumber: 'asc' } } },
      });
    });

    return this.toRfqResponse(updated);
  }

  /**
   * Submits a draft RFQ.
   */
  async submitRfq(id: number, userId: number, user: AuthUser) {
    const existing = await this.prisma.rfq.findUnique({
      where: { id: BigInt(id) },
      include: { lines: true },
    });

    if (!existing) {
      throw new NotFoundException(`RFQ with ID ${id} not found.`);
    }

    const isPrivileged = user.roles.some((r) => r.includes('ADMIN') || r.includes('COMPLIANCE'));
    if (!isPrivileged && existing.userId !== BigInt(userId)) {
      throw new ForbiddenException("Access to another buyer's RFQ is denied.");
    }

    const buyer = await this.resolveBuyer(userId, user);

    if (existing.customerClassification === 'SPECIAL_PARTY' && !buyer.isSpecialApproved) {
      throw new ForbiddenException(
        'Your Special Buyer status is no longer active. You cannot submit this Special Party RFQ. Please contact platform compliance.',
      );
    }

    if (existing.status !== 'Draft') {
      throw new BadRequestException(`RFQ is already in "${existing.status}" status.`);
    }

    if (!existing.lines || existing.lines.length === 0) {
      throw new BadRequestException('Cannot submit an RFQ without product lines.');
    }

    const newStatus = existing.isGeneric || existing.lines.some((l) => l.productType === 'GENERIC')
      ? 'Pricing In Progress'
      : 'Submitted';

    const updated = await this.prisma.rfq.update({
      where: { id: existing.id },
      data: {
        status: newStatus,
        submittedAt: new Date(),
      },
      include: { lines: { orderBy: { lineItemNumber: 'asc' } } },
    });

    await this.assignManufacturersToRfq(this.prisma, existing.id);

    return this.toRfqResponse(updated);
  }

  /**
   * Lists RFQs owned by the authenticated buyer, or all RFQs if administrator.
   */
  async listRfqs(userId: number, user: AuthUser, query?: { status?: string; search?: string }) {
    const isPrivileged = user.roles.some((r) => r.includes('ADMIN') || r.includes('COMPLIANCE'));
    const where: any = {};

    if (!isPrivileged) {
      where.userId = BigInt(userId);
    }

    if (query?.status && query.status !== 'ALL') {
      where.status = { equals: query.status, mode: 'insensitive' };
    }

    if (query?.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { rfqNumber: { contains: term, mode: 'insensitive' } },
        { companyName: { contains: term, mode: 'insensitive' } },
        { buyerName: { contains: term, mode: 'insensitive' } },
        { lines: { some: { productName: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    const rfqs = await this.prisma.rfq.findMany({
      where,
      include: { lines: { orderBy: { lineItemNumber: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return rfqs.map((r) => this.toRfqResponse(r));
  }

  /**
   * Retrieves single RFQ with lines, enforcing buyer ownership.
   */
  async getRfqById(id: number, userId: number, user: AuthUser) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id: BigInt(id) },
      include: { lines: { orderBy: { lineItemNumber: 'asc' } } },
    });

    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${id} not found.`);
    }

    const isPrivileged = user.roles.some((r) => r.includes('ADMIN') || r.includes('COMPLIANCE'));
    if (!isPrivileged && rfq.userId !== BigInt(userId)) {
      throw new ForbiddenException("Access to another buyer's RFQ is denied.");
    }

    return this.toRfqResponse(rfq);
  }

  /**
   * Manufacturer matching using actual PostgreSQL product-manufacturer mappings.
   * Separate operation that does NOT submit or mutate the RFQ.
   */
  async matchManufacturers(id: number, userId: number, user: AuthUser) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id: BigInt(id) },
      include: { lines: true },
    });

    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${id} not found.`);
    }

    const isPrivileged = user.roles.some((r) => r.includes('ADMIN') || r.includes('COMPLIANCE'));
    if (!isPrivileged && rfq.userId !== BigInt(userId)) {
      throw new ForbiddenException("Access to another buyer's RFQ is denied.");
    }

    const productIds = rfq.lines
      .map((l) => l.productId)
      .filter((pid): pid is string => Boolean(pid && pid !== 'other'));

    // Query real PostgreSQL manufacturer products
    const mappings = await this.prisma.manufacturerProduct.findMany({
      where: {
        productId: { in: productIds },
        registration: {
          status: { in: ['APPROVED', 'Active', 'VERIFIED'] },
        },
      },
      include: {
        registration: true,
        product: true,
      },
    });

    // Group mappings by product
    const productMappingMap = new Map<string, typeof mappings>();
    for (const m of mappings) {
      const list = productMappingMap.get(m.productId) || [];
      list.push(m);
      productMappingMap.set(m.productId, list);
    }

    const matchedLines = rfq.lines.map((line) => {
      const lineMappings = line.productId ? productMappingMap.get(line.productId) || [] : [];
      const eligibleManufacturers = lineMappings.map((m) => ({
        manufacturerId: m.registration.id.toString(),
        registrationCode: m.registration.registrationCode,
        companyName: m.registration.companyName,
        city: m.registration.city,
        state: m.registration.state,
        facilityAddress: m.registration.facilityAddress,
        verificationStatus: m.registration.status,
        moq: m.moq || 1000,
        leadTimeDays: m.leadTimeDays || 30,
        isMoqMet: !m.moq || line.quantity >= m.moq,
        matchScore: !m.moq || line.quantity >= m.moq ? 95 : 75,
      }));

      return {
        lineItemNumber: line.lineItemNumber,
        productName: line.productName,
        productId: line.productId,
        productType: line.productType,
        quantity: line.quantity,
        uom: line.uom,
        eligibleManufacturers,
        matchesCount: eligibleManufacturers.length,
      };
    });

    const uniqueMfgIds = new Set<string>();
    for (const m of mappings) {
      uniqueMfgIds.add(m.registration.id.toString());
    }

    return {
      rfqId: rfq.id.toString(),
      rfqNumber: rfq.rfqNumber,
      status: rfq.status,
      totalLines: rfq.lines.length,
      totalMatchedLines: matchedLines.filter((l) => l.matchesCount > 0).length,
      totalEligibleManufacturers: uniqueMfgIds.size,
      matchedLines,
    };
  }

  /**
   * Automatically discovers and creates manufacturer assignments for a submitted RFQ.
   */
  async assignManufacturersToRfq(tx: any, rfqId: bigint): Promise<number> {
    const rfq = await tx.rfq.findUnique({
      where: { id: rfqId },
      include: { lines: true },
    });
    if (!rfq) return 0;

    const productIds = rfq.lines
      .map((l: any) => l.productId)
      .filter((pid: any): pid is string => Boolean(pid && pid !== 'other'));

    const eligibleMfgIds = new Set<bigint>();

    // 1. Direct product mappings for approved manufacturers
    if (productIds.length > 0) {
      const mappings = await tx.manufacturerProduct.findMany({
        where: {
          productId: { in: productIds },
          registration: {
            status: { in: ['APPROVED', 'Active', 'VERIFIED'] },
          },
        },
        select: { registrationId: true },
      });
      for (const m of mappings) {
        eligibleMfgIds.add(m.registrationId);
      }
    }

    // 2. Fallback: If no direct mappings or RFQ is generic, assign all verified/approved manufacturers
    if (eligibleMfgIds.size === 0) {
      const approvedMfgs = await tx.manufacturerRegistration.findMany({
        where: {
          status: { in: ['APPROVED', 'Active', 'VERIFIED'] },
        },
        select: { id: true },
      });
      for (const m of approvedMfgs) {
        eligibleMfgIds.add(m.id);
      }
    }

    let assignedCount = 0;
    for (const mfgId of eligibleMfgIds) {
      const existing = await tx.rfqManufacturerAssignment.findUnique({
        where: {
          rfqId_manufacturerId: {
            rfqId: rfq.id,
            manufacturerId: mfgId,
          },
        },
      });

      if (!existing) {
        await tx.rfqManufacturerAssignment.create({
          data: {
            rfqId: rfq.id,
            manufacturerId: mfgId,
            status: 'ASSIGNED',
            sentAt: new Date(),
          },
        });
        assignedCount++;
      }
    }

    return assignedCount;
  }

  /**
   * Retrieves quotes submitted by manufacturers for a given RFQ owned by the authenticated buyer.
   */
  async getQuotesForRfq(id: number, userId: number, user: AuthUser) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id: BigInt(id) },
    });

    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${id} not found.`);
    }

    const isPrivileged = user.roles.some((r) => r.includes('ADMIN') || r.includes('COMPLIANCE'));
    if (!isPrivileged && rfq.userId !== BigInt(userId)) {
      throw new ForbiddenException("Access to another buyer's RFQ is denied.");
    }

    const quotes = await this.prisma.quote.findMany({
      where: { rfqId: BigInt(id) },
      include: {
        manufacturer: true,
        lines: {
          include: {
            rfqLine: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quotes.map((q) => ({
      id: q.id.toString(),
      quoteNumber: q.quoteNumber,
      rfqId: q.rfqId.toString(),
      manufacturerId: q.manufacturerId.toString(),
      manufacturerName: q.manufacturer?.companyName || 'Verified Manufacturer',
      manufacturerCode: q.manufacturer?.registrationCode || q.manufacturer?.manufacturerCode || '',
      city: q.manufacturer?.city || '',
      state: q.manufacturer?.state || '',
      status: q.status,
      totalAmount: Number(q.totalAmount),
      validUntil: q.validUntil ? q.validUntil.toISOString().split('T')[0] : null,
      deliveryTerms: q.deliveryTerms,
      paymentTerms: q.paymentTerms,
      remarks: q.remarks,
      submittedAt: q.submittedAt ? q.submittedAt.toISOString() : null,
      lines: q.lines.map((l) => ({
        id: l.id.toString(),
        rfqLineId: l.rfqLineId ? l.rfqLineId.toString() : null,
        productId: l.productId,
        productName: l.productName,
        responseType: l.responseType,
        quotedQuantity: l.quotedQuantity,
        unitPrice: Number(l.unitPrice),
        moq: l.moq,
        leadTimeDays: l.leadTimeDays,
        taxPercent: Number(l.taxPercent),
        discountPercent: Number(l.discountPercent),
        calculatedTotal: Number(l.calculatedTotal),
        cannotSupplyReason: l.cannotSupplyReason,
        cannotSupplyRemarks: l.cannotSupplyRemarks,
        remarks: l.remarks,
      })),
    }));
  }

  /**
   * Serializes BigInt and Decimal fields for clean JSON delivery.
   */
  private toRfqResponse(rfq: any) {
    return {
      id: rfq.id.toString(),
      rfqNumber: rfq.rfqNumber,
      userId: rfq.userId.toString(),
      buyerRegistrationId: rfq.buyerRegistrationId ? rfq.buyerRegistrationId.toString() : null,
      buyerName: rfq.buyerName,
      companyName: rfq.companyName,
      customerCode: rfq.customerCode,
      customerClassification: rfq.customerClassification,
      status: rfq.status,
      priority: rfq.priority,
      deliveryLocation: rfq.deliveryLocation,
      rfqDate: rfq.rfqDate ? rfq.rfqDate.toISOString().split('T')[0] : '',
      requiredDate: rfq.requiredDate ? rfq.requiredDate.toISOString().split('T')[0] : null,
      deadlineDate: rfq.deadlineDate ? rfq.deadlineDate.toISOString().split('T')[0] : null,
      remarks: rfq.remarks,
      creditRequired: rfq.creditRequired,
      creditTerms: rfq.creditTerms,
      isGeneric: rfq.isGeneric,
      submittedAt: rfq.submittedAt ? rfq.submittedAt.toISOString() : null,
      createdAt: rfq.createdAt ? rfq.createdAt.toISOString() : null,
      updatedAt: rfq.updatedAt ? rfq.updatedAt.toISOString() : null,
      lines: (rfq.lines || []).map((l: any) => ({
        id: l.id.toString(),
        rfqId: l.rfqId.toString(),
        lineItemNumber: l.lineItemNumber,
        productId: l.productId,
        productName: l.productName,
        productCode: l.productCode,
        category: l.category,
        subCategory: l.subCategory,
        subSubCategory: l.subSubCategory,
        productType: l.productType,
        dosageForm: l.dosageForm,
        packSize: l.packSize,
        uom: l.uom,
        quantity: l.quantity,
        targetPrice: l.targetPrice ? Number(l.targetPrice) : null,
        buyerProvidedPrice: l.targetPrice ? Number(l.targetPrice) : null,
        requiredDate: l.requiredDate ? l.requiredDate.toISOString().split('T')[0] : null,
        remarks: l.remarks,
        molecule: l.molecule,
        strength: l.strength,
      })),
    };
  }

  /**
   * Lists RFQs for Quote Comparison for the authenticated buyer.
   * Real PostgreSQL query computing product lines, real quote response counts, and comparison status.
   */
  async listQuoteComparisons(userId: number, user: AuthUser, query?: BuyerQuoteComparisonQueryDto) {
    const isPrivileged = user.roles.some((r) => r.includes('ADMIN') || r.includes('COMPLIANCE'));
    const where: any = {};

    if (!isPrivileged) {
      where.userId = BigInt(userId);
    }

    if (query?.status && query.status !== 'ALL') {
      where.status = { equals: query.status, mode: 'insensitive' };
    } else {
      where.status = { not: 'Draft' };
    }

    if (query?.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { rfqNumber: { contains: term, mode: 'insensitive' } },
        { companyName: { contains: term, mode: 'insensitive' } },
        { buyerName: { contains: term, mode: 'insensitive' } },
        { customerCode: { contains: term, mode: 'insensitive' } },
        { lines: { some: { productName: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    const rfqs = await this.prisma.rfq.findMany({
      where,
      include: {
        lines: {
          orderBy: { lineItemNumber: 'asc' },
        },
        quotes: {
          where: { status: { not: 'DRAFT' } },
          include: {
            lines: true,
            manufacturer: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rfqs.map((rfq) => {
      const quotationCount = rfq.quotes.length;
      const productLineCount = rfq.lines.length;

      const hasSelections = rfq.lines.some((l) => l.remarks?.startsWith('SELECTED_QUOTE_LINE:')) ||
        rfq.quotes.some((q) => q.status === 'ACCEPTED' || q.status === 'PARTIALLY_ACCEPTED');

      const selectedLinesCount = rfq.lines.filter((l) => l.remarks?.startsWith('SELECTED_QUOTE_LINE:')).length;

      let comparisonStatus = 'READY_FOR_COMPARISON';
      if (selectedLinesCount > 0 && selectedLinesCount === productLineCount) {
        comparisonStatus = 'ALLOCATED';
      } else if (quotationCount > 0) {
        comparisonStatus = 'READY_FOR_COMPARISON';
      } else {
        comparisonStatus = rfq.status === 'Submitted' || rfq.status === 'Pricing In Progress'
          ? 'PRICING_IN_PROGRESS'
          : rfq.status.toUpperCase().replace(/\s+/g, '_');
      }

      return {
        rfqId: rfq.id.toString(),
        rfqNumber: rfq.rfqNumber,
        buyerName: rfq.companyName || rfq.buyerName || 'Buyer Organization',
        customerCode: rfq.customerCode || null,
        productLineCount,
        quotationCount,
        deadline: rfq.deadlineDate ? rfq.deadlineDate.toISOString().split('T')[0] : null,
        requiredDate: rfq.requiredDate ? rfq.requiredDate.toISOString().split('T')[0] : null,
        status: comparisonStatus,
        rawStatus: rfq.status,
        priority: rfq.priority,
        isGeneric: rfq.isGeneric,
        hasSelectedQuotes: hasSelections,
        selectedLinesCount,
      };
    });
  }

  /**
   * Retrieves full comparison detail for an RFQ, including all RFQ lines,
   * submitted manufacturer quotations with per-line pricing, and current selections.
   */
  async getQuoteComparisonDetail(rfqId: string | number, userId: number, user: AuthUser) {
    const isNumeric = !isNaN(Number(rfqId));
    const rfq = await this.prisma.rfq.findFirst({
      where: {
        OR: [
          { rfqNumber: String(rfqId) },
          ...(isNumeric ? [{ id: BigInt(rfqId) }] : []),
        ],
      },
      include: {
        lines: {
          orderBy: { lineItemNumber: 'asc' },
        },
        quotes: {
          where: { status: { not: 'DRAFT' } },
          include: {
            manufacturer: true,
            lines: {
              orderBy: { id: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!rfq) {
      throw new NotFoundException(`RFQ with identifier "${rfqId}" was not found.`);
    }

    const isPrivileged = user.roles.some((r) => r.includes('ADMIN') || r.includes('COMPLIANCE'));
    if (!isPrivileged && rfq.userId !== BigInt(userId)) {
      throw new ForbiddenException("Access to another buyer's RFQ comparison is denied.");
    }

    const lineSelections: Record<string, {
      quoteLineId: string;
      quoteId: string;
      manufacturerId: string;
      manufacturerName: string;
      unitPrice: number;
      leadTimeDays: number;
      moq: number;
    }> = {};

    rfq.lines.forEach((l) => {
      if (l.remarks && l.remarks.startsWith('SELECTED_QUOTE_LINE:')) {
        const parts = l.remarks.split(':');
        const qlId = parts[1];
        const mfgId = parts[3];

        for (const q of rfq.quotes) {
          const matchedLine = q.lines.find((line) => line.id.toString() === qlId);
          if (matchedLine) {
            lineSelections[l.id.toString()] = {
              quoteLineId: qlId,
              quoteId: q.id.toString(),
              manufacturerId: q.manufacturerId.toString(),
              manufacturerName: q.manufacturer.companyName,
              unitPrice: Number(matchedLine.unitPrice),
              leadTimeDays: matchedLine.leadTimeDays,
              moq: matchedLine.moq,
            };
            break;
          }
        }
      }
    });

    return {
      rfq: {
        id: rfq.id.toString(),
        rfqNumber: rfq.rfqNumber,
        buyerName: rfq.companyName || rfq.buyerName,
        companyName: rfq.companyName,
        customerCode: rfq.customerCode,
        customerClassification: rfq.customerClassification,
        priority: rfq.priority,
        deliveryLocation: rfq.deliveryLocation || 'Primary Delivery Address',
        rfqDate: rfq.rfqDate ? rfq.rfqDate.toISOString().split('T')[0] : '',
        requiredDate: rfq.requiredDate ? rfq.requiredDate.toISOString().split('T')[0] : null,
        deadlineDate: rfq.deadlineDate ? rfq.deadlineDate.toISOString().split('T')[0] : null,
        creditRequired: rfq.creditRequired,
        creditTerms: rfq.creditTerms,
        isGeneric: rfq.isGeneric,
        status: rfq.status,
        remarks: rfq.remarks,
      },
      lines: rfq.lines.map((l) => {
        const sel = lineSelections[l.id.toString()];
        return {
          id: l.id.toString(),
          lineItemNumber: l.lineItemNumber,
          productId: l.productId,
          productName: l.productName,
          category: l.category,
          dosageForm: l.dosageForm,
          packSize: l.packSize,
          uom: l.uom,
          quantity: l.quantity,
          targetPrice: l.targetPrice ? Number(l.targetPrice) : null,
          requiredDate: l.requiredDate ? l.requiredDate.toISOString().split('T')[0] : null,
          selectedManufacturer: sel || null,
        };
      }),
      manufacturerQuotations: rfq.quotes.map((q) => ({
        id: q.id.toString(),
        quoteNumber: q.quoteNumber,
        status: q.status,
        manufacturerId: q.manufacturerId.toString(),
        manufacturerName: q.manufacturer.companyName,
        manufacturerCode: q.manufacturer.registrationCode || q.manufacturer.manufacturerCode,
        city: q.manufacturer.city || '',
        state: q.manufacturer.state || '',
        totalAmount: Number(q.totalAmount),
        submissionDate: q.submittedAt ? q.submittedAt.toISOString() : q.createdAt.toISOString(),
        validUntil: q.validUntil ? q.validUntil.toISOString().split('T')[0] : null,
        deliveryTerms: q.deliveryTerms || 'Standard Fleet Delivery',
        paymentTerms: q.paymentTerms || '30 Days Net',
        remarks: q.remarks || null,
        lines: q.lines.map((ql) => {
          const isSelected = lineSelections[ql.rfqLineId ? ql.rfqLineId.toString() : '']?.quoteLineId === ql.id.toString();
          return {
            id: ql.id.toString(),
            rfqLineId: ql.rfqLineId ? ql.rfqLineId.toString() : null,
            productId: ql.productId,
            productName: ql.productName,
            responseType: ql.responseType,
            quotedQuantity: ql.quotedQuantity,
            unitPrice: Number(ql.unitPrice),
            moq: ql.moq,
            leadTimeDays: ql.leadTimeDays,
            calculatedTotal: Number(ql.calculatedTotal),
            deliveryTerms: ql.deliveryTerms,
            cannotSupplyReason: ql.cannotSupplyReason,
            cannotSupplyRemarks: ql.cannotSupplyRemarks,
            isSelected,
          };
        }),
      })),
      lineSelections,
    };
  }

  /**
   * Persists the buyer's manufacturer quotation selections for an RFQ into PostgreSQL.
   */
  async selectQuotesForRfq(rfqId: string | number, userId: number, dto: SelectQuoteComparisonPayloadDto, user: AuthUser) {
    if (!dto.selections || dto.selections.length === 0) {
      throw new BadRequestException('At least one manufacturer quotation line selection is required.');
    }

    const isNumeric = !isNaN(Number(rfqId));
    const rfq = await this.prisma.rfq.findFirst({
      where: {
        OR: [
          { rfqNumber: String(rfqId) },
          ...(isNumeric ? [{ id: BigInt(rfqId) }] : []),
        ],
      },
      include: {
        lines: true,
        quotes: {
          include: { lines: true, manufacturer: true },
        },
      },
    });

    if (!rfq) {
      throw new NotFoundException(`RFQ with identifier "${rfqId}" not found.`);
    }

    const isPrivileged = user.roles.some((r) => r.includes('ADMIN') || r.includes('COMPLIANCE'));
    if (!isPrivileged && rfq.userId !== BigInt(userId)) {
      throw new ForbiddenException("Access to another buyer's RFQ is denied.");
    }

    for (const sel of dto.selections) {
      const rfqLine = rfq.lines.find((l) => l.id.toString() === sel.rfqLineId);
      if (!rfqLine) {
        throw new BadRequestException(`RFQ Line ID ${sel.rfqLineId} does not belong to RFQ ${rfq.rfqNumber}.`);
      }

      const quote = rfq.quotes.find((q) => q.id.toString() === sel.quoteId);
      if (!quote) {
        throw new BadRequestException(`Quotation ID ${sel.quoteId} does not belong to RFQ ${rfq.rfqNumber}.`);
      }

      const quoteLine = quote.lines.find((ql) => ql.id.toString() === sel.quoteLineId);
      if (!quoteLine) {
        throw new BadRequestException(`Quotation Line ID ${sel.quoteLineId} was not found in Quote ${quote.quoteNumber}.`);
      }

      if (quoteLine.responseType === 'CANNOT_SUPPLY') {
        throw new BadRequestException(`Cannot select a quotation line marked as "Cannot Supply" (${quoteLine.productName}).`);
      }

      if (quote.validUntil && new Date() > new Date(quote.validUntil)) {
        throw new BadRequestException(`Quotation ${quote.quoteNumber} has expired on ${quote.validUntil.toISOString().split('T')[0]}.`);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const selectedQuoteIds = new Set<string>();

      for (const sel of dto.selections) {
        selectedQuoteIds.add(sel.quoteId);

        await tx.rfqLine.update({
          where: { id: BigInt(sel.rfqLineId) },
          data: {
            remarks: `SELECTED_QUOTE_LINE:${sel.quoteLineId}:MFR:${sel.manufacturerId}`,
          },
        });

        await tx.quoteLine.update({
          where: { id: BigInt(sel.quoteLineId) },
          data: {
            remarks: 'SELECTED',
          },
        });
      }

      for (const q of rfq.quotes) {
        const isChosen = selectedQuoteIds.has(q.id.toString());
        await tx.quote.update({
          where: { id: q.id },
          data: {
            status: isChosen ? 'ACCEPTED' : 'SUBMITTED',
          },
        });
      }

      await tx.rfq.update({
        where: { id: rfq.id },
        data: {
          status: 'Vendor Selected',
        },
      });

      // Automatically generate/persist Master Order, Sub Orders, and Purchase Orders in PostgreSQL
      let masterOrder = await tx.masterOrder.findFirst({
        where: { rfqId: rfq.id },
      });
      if (!masterOrder) {
        const moNumber = `MO-${rfq.rfqNumber.replace('RFQ-', '')}`;
        masterOrder = await tx.masterOrder.create({
          data: {
            orderNumber: moNumber,
            rfqId: rfq.id,
            buyerId: rfq.userId,
            buyerRegistrationId: rfq.buyerRegistrationId,
            customerName: rfq.companyName || rfq.buyerName,
            customerCode: rfq.customerCode,
            customerClassification: rfq.customerClassification,
            totalAmount: 0,
            totalQuantity: 0,
            status: 'IN_PROGRESS',
            orderDate: new Date(),
            expectedDeliveryDate: rfq.requiredDate || rfq.deadlineDate,
            shippingAddress: rfq.deliveryLocation,
            billingAddress: rfq.deliveryLocation,
          },
        });
      }

      // Group quote selections by manufacturer
      const selectionsByMfg = new Map<string, typeof dto.selections>();
      for (const sel of dto.selections) {
        const list = selectionsByMfg.get(sel.manufacturerId) || [];
        list.push(sel);
        selectionsByMfg.set(sel.manufacturerId, list);
      }

      let subOrderIndex = 1;
      let grandTotalAmount = 0;
      let grandTotalQuantity = 0;

      for (const [mfgIdStr, mfgSels] of selectionsByMfg.entries()) {
        const mfgId = BigInt(mfgIdStr);
        const mfgReg = await tx.manufacturerRegistration.findUnique({
          where: { id: mfgId },
        });
        const chosenQuote = rfq.quotes.find((q) => q.manufacturerId === mfgId);

        let subTotalAmount = 0;
        let subTotalQuantity = 0;

        const subLinesData: any[] = [];
        for (const sel of mfgSels) {
          const rLine = rfq.lines.find((l) => l.id.toString() === sel.rfqLineId);
          const qLine = chosenQuote?.lines.find((ql) => ql.id.toString() === sel.quoteLineId);
          const qty = qLine?.quotedQuantity || rLine?.quantity || 1;
          const uPrice = Number(qLine?.unitPrice || 0);
          const lineTot = Number(qLine?.calculatedTotal || qty * uPrice);

          subTotalAmount += lineTot;
          subTotalQuantity += qty;

          subLinesData.push({
            productId: rLine?.productId || qLine?.productId || null,
            productName: qLine?.productName || rLine?.productName || 'Pharmaceutical Product',
            dosageForm: rLine?.dosageForm || 'Tablet',
            packSize: rLine?.packSize || null,
            quantity: qty,
            uom: rLine?.uom || 'Units',
            unitPrice: uPrice,
            lineTotal: lineTot,
            leadTimeDays: qLine?.leadTimeDays || 14,
          });
        }

        grandTotalAmount += subTotalAmount;
        grandTotalQuantity += subTotalQuantity;

        const soNumber = `${masterOrder.orderNumber}-${String(subOrderIndex).padStart(2, '0')}`;
        subOrderIndex++;

        let subOrder = await tx.subOrder.findFirst({
          where: { subOrderNumber: soNumber },
        });

        if (!subOrder) {
          subOrder = await tx.subOrder.create({
            data: {
              subOrderNumber: soNumber,
              masterOrderId: masterOrder.id,
              manufacturerId: mfgId,
              quoteId: chosenQuote?.id,
              status: 'AWAITING_ACCEPTANCE',
              productionStatus: 'AWAITING_ACCEPTANCE',
              totalAmount: subTotalAmount,
              totalQuantity: subTotalQuantity,
              leadTimeDays: 14,
              deliveryDate: rfq.requiredDate || rfq.deadlineDate,
              shippingAddress: rfq.deliveryLocation,
              billingAddress: rfq.deliveryLocation,
              sourceQuoteRef: chosenQuote?.quoteNumber || '—',
              lines: {
                create: subLinesData,
              },
            },
          });

          const poNumber = `PO-${soNumber}`;
          await tx.purchaseOrder.create({
            data: {
              poNumber,
              subOrderId: subOrder.id,
              masterOrderId: masterOrder.id,
              manufacturerId: mfgId,
              status: 'ISSUED',
              orderDate: new Date(),
              deliveryDate: rfq.requiredDate || rfq.deadlineDate,
              shippingAddress: rfq.deliveryLocation,
              billingAddress: rfq.deliveryLocation,
              buyerName: rfq.companyName || rfq.buyerName,
              mfgName: mfgReg?.companyName || 'Verified Manufacturer',
              totalAmount: subTotalAmount,
              totalQuantity: subTotalQuantity,
              paymentTerms: chosenQuote?.paymentTerms || 'Net 30 Days',
              deliveryTerms: chosenQuote?.deliveryTerms || 'Door Delivery',
              sourceQuoteRef: chosenQuote?.quoteNumber || '—',
              lines: {
                create: subLinesData.map((l) => ({
                  productId: l.productId,
                  productName: l.productName,
                  dosageForm: l.dosageForm,
                  quantity: l.quantity,
                  uom: l.uom,
                  unitPrice: l.unitPrice,
                  lineTotal: l.lineTotal,
                })),
              },
            },
          });

          await tx.orderStatusHistory.create({
            data: {
              subOrderId: subOrder.id,
              previousStatus: 'ISSUED',
              newStatus: 'AWAITING_ACCEPTANCE',
              changedBy: user.username || 'Buyer',
              remarks: `Purchase Order issued from RFQ ${rfq.rfqNumber} quotation selection.`,
            },
          });
        }
      }

      await tx.masterOrder.update({
        where: { id: masterOrder.id },
        data: {
          totalAmount: grandTotalAmount,
          totalQuantity: grandTotalQuantity,
        },
      });
    });

    return {
      message: 'Manufacturer quotations selected and saved successfully.',
      rfqNumber: rfq.rfqNumber,
      selectedCount: dto.selections.length,
    };
  }

  /**
   * Lists all RFQs for Admin RFQ Monitoring with line details and quote metrics.
   */
  async listAdminRfqs(query?: AdminRfqQueryDto) {
    const where: any = {};

    if (query?.status && query.status !== 'ALL') {
      where.status = { equals: query.status, mode: 'insensitive' };
    }

    if (query?.type === 'GENERIC') {
      where.OR = [
        { isGeneric: true },
        { lines: { some: { productType: 'GENERIC' } } },
      ];
    } else if (query?.type === 'BRANDED') {
      where.AND = [
        { isGeneric: false },
        { lines: { none: { productType: 'GENERIC' } } },
      ];
    }

    if (query?.search?.trim()) {
      const term = query.search.trim();
      const searchConditions = [
        { rfqNumber: { contains: term, mode: 'insensitive' } },
        { companyName: { contains: term, mode: 'insensitive' } },
        { buyerName: { contains: term, mode: 'insensitive' } },
        { customerCode: { contains: term, mode: 'insensitive' } },
        { lines: { some: { productName: { contains: term, mode: 'insensitive' } } } },
        { lines: { some: { molecule: { contains: term, mode: 'insensitive' } } } },
      ];
      if (where.AND) {
        where.AND.push({ OR: searchConditions });
      } else if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const rfqs = await this.prisma.rfq.findMany({
      where,
      include: {
        lines: { orderBy: { lineItemNumber: 'asc' } },
        quotes: {
          include: {
            manufacturer: true,
            lines: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rfqs.map((rfq) => this.toAdminRfqResponse(rfq));
  }

  /**
   * Computes dynamic KPI statistics directly from PostgreSQL for the Admin RFQ Monitor.
   */
  async getAdminRfqStats(): Promise<AdminRfqStatsResponseDto> {
    const rfqs = await this.prisma.rfq.findMany({
      include: {
        lines: { select: { productType: true } },
      },
    });

    const totalRfqs = rfqs.length;
    let genericRfqs = 0;
    let pendingGenericCount = 0;
    let brandedRfqs = 0;
    let activeQuotedCount = 0;
    let closedAwardedCount = 0;

    for (const r of rfqs) {
      const isGen = r.isGeneric || r.lines.some((l) => l.productType === 'GENERIC');
      if (isGen) {
        genericRfqs++;
        const st = (r.status || '').toLowerCase();
        if (st === 'submitted' || st === 'draft' || st === 'open' || st === 'pending') {
          pendingGenericCount++;
        }
      } else {
        brandedRfqs++;
      }

      const st = (r.status || '').toLowerCase();
      if (['closed', 'awarded', 'vendor selected', 'sub-order created', 'order created'].includes(st)) {
        closedAwardedCount++;
      } else if (['quoted', 'under review', 'open', 'submitted', 'draft', 'in review'].includes(st)) {
        activeQuotedCount++;
      }
    }

    return {
      totalRfqs,
      genericRfqs,
      pendingGenericCount,
      brandedRfqs,
      activeQuotedCount,
      closedAwardedCount,
    };
  }

  /**
   * Retrieves full details of an RFQ for Admin inspection by ID or RFQ Number.
   */
  async getAdminRfqDetail(idOrRfqNumber: string | number) {
    const isNum = !isNaN(Number(idOrRfqNumber));
    const rfq = await this.prisma.rfq.findFirst({
      where: isNum
        ? { OR: [{ id: BigInt(idOrRfqNumber) }, { rfqNumber: String(idOrRfqNumber) }] }
        : { rfqNumber: String(idOrRfqNumber) },
      include: {
        lines: { orderBy: { lineItemNumber: 'asc' } },
        quotes: {
          include: {
            manufacturer: true,
            lines: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        assignments: {
          include: {
            manufacturer: true,
          },
        },
      },
    });

    if (!rfq) {
      throw new NotFoundException(`RFQ "${idOrRfqNumber}" not found in PostgreSQL.`);
    }

    return this.toAdminRfqResponse(rfq);
  }

  /**
   * Saves and persists Admin Generic Medicine pricing in PostgreSQL.
   */
  async submitGenericAdminPricing(
    idOrRfqNumber: string | number,
    dto: SubmitGenericAdminPricingDto,
    adminUser: AuthUser,
  ) {
    const isNum = !isNaN(Number(idOrRfqNumber));
    const rfq = await this.prisma.rfq.findFirst({
      where: isNum
        ? { OR: [{ id: BigInt(idOrRfqNumber) }, { rfqNumber: String(idOrRfqNumber) }] }
        : { rfqNumber: String(idOrRfqNumber) },
      include: {
        lines: { orderBy: { lineItemNumber: 'asc' } },
        quotes: true,
      },
    });

    if (!rfq) {
      throw new NotFoundException(`Generic RFQ "${idOrRfqNumber}" not found in PostgreSQL.`);
    }

    let calculatedTotal = 0;
    const linePriceUpdates: Array<{ lineId: bigint; price: number; quantity: number }> = [];

    for (const line of rfq.lines) {
      const lineKey = line.id.toString();
      const price = dto.linePrices[lineKey] !== undefined
        ? Number(dto.linePrices[lineKey])
        : (line.targetPrice ? Number(line.targetPrice) : 4.20);
      calculatedTotal += price * line.quantity;
      linePriceUpdates.push({ lineId: line.id, price, quantity: line.quantity });
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Update lines targetPrice and remarks
      for (const update of linePriceUpdates) {
        await tx.rfqLine.update({
          where: { id: update.lineId },
          data: {
            targetPrice: update.price,
            remarks: `ADMIN_PRICED:${update.price}`,
          },
        });
      }

      // 2. Find or create platform Quote
      const quoteNum = `QUO-GEN-${rfq.rfqNumber.replace('RFQ-', '')}`;
      let quote = await tx.quote.findFirst({
        where: { rfqId: rfq.id, quoteNumber: quoteNum },
      });

      if (!quote) {
        // Find default or first available manufacturer for platform generic quotes
        const mfg = await tx.manufacturerRegistration.findFirst({
          orderBy: { id: 'asc' },
        });
        const mfgId = mfg ? mfg.id : BigInt(1);

        quote = await tx.quote.create({
          data: {
            quoteNumber: quoteNum,
            rfqId: rfq.id,
            manufacturerId: mfgId,
            status: 'SUBMITTED',
            totalAmount: calculatedTotal,
            validUntil: new Date(Date.now() + 30 * 86400000),
            deliveryTerms: 'FactoryGrid Direct Platform Supply (Generic)',
            paymentTerms: 'Standard Platform Settlement Terms',
            remarks: dto.remarks || 'Official FactoryGrid Direct quotation priced via internal price list.',
            submittedAt: new Date(),
          },
        });
      } else {
        quote = await tx.quote.update({
          where: { id: quote.id },
          data: {
            totalAmount: calculatedTotal,
            status: 'SUBMITTED',
            remarks: dto.remarks || quote.remarks,
            submittedAt: new Date(),
          },
        });
      }

      // 3. Upsert quote lines
      for (const line of rfq.lines) {
        const update = linePriceUpdates.find((u) => u.lineId === line.id);
        const unitPrice = update ? update.price : 4.20;
        const lineTotal = unitPrice * line.quantity;

        const existingQuoteLine = await tx.quoteLine.findFirst({
          where: { quoteId: quote.id, rfqLineId: line.id },
        });

        if (existingQuoteLine) {
          await tx.quoteLine.update({
            where: { id: existingQuoteLine.id },
            data: {
              unitPrice,
              quotedQuantity: line.quantity,
              calculatedTotal: lineTotal,
            },
          });
        } else {
          await tx.quoteLine.create({
            data: {
              quoteId: quote.id,
              rfqLineId: line.id,
              productId: line.productId,
              productName: line.productName,
              responseType: 'QUOTE',
              quotedQuantity: line.quantity,
              unitPrice,
              moq: 1000,
              leadTimeDays: 7,
              calculatedTotal: lineTotal,
            },
          });
        }
      }

      // 4. Update RFQ status to Quoted
      await tx.rfq.update({
        where: { id: rfq.id },
        data: {
          status: 'Quoted',
        },
      });
    });

    return this.getAdminRfqDetail(rfq.id.toString());
  }

  /**
   * Retrieves quotes for a specific RFQ for Admin monitoring.
   */
  async getQuotesForAdminRfq(idOrRfqNumber: string | number, user: AuthUser) {
    const isNum = !isNaN(Number(idOrRfqNumber));
    const rfq = await this.prisma.rfq.findFirst({
      where: isNum
        ? { OR: [{ id: BigInt(idOrRfqNumber) }, { rfqNumber: String(idOrRfqNumber) }] }
        : { rfqNumber: String(idOrRfqNumber) },
    });

    if (!rfq) {
      throw new NotFoundException(`RFQ "${idOrRfqNumber}" not found.`);
    }

    return this.getQuotesForRfq(Number(rfq.id), Number(user.id), user);
  }

  /**
   * Maps an RFQ Prisma record with lines and quotes to the standard Admin RFQ Response format.
   */
  private toAdminRfqResponse(rfq: any) {
    const quotes = rfq.quotes || [];
    const quotesCount = quotes.length;

    let lowestPrice = 0;
    let highestPrice = 0;
    if (quotesCount > 0) {
      const amounts = quotes.map((q: any) => Number(q.totalAmount || 0));
      lowestPrice = Math.min(...amounts);
      highestPrice = Math.max(...amounts);
    }

    const acceptedQuote = quotes.find((q: any) => q.status === 'ACCEPTED' || q.status === 'PARTIALLY_ACCEPTED');
    const isAwarded = rfq.status === 'Vendor Selected' || rfq.status === 'Awarded' || rfq.status === 'Closed' || Boolean(acceptedQuote);
    const selectedManufacturerName = acceptedQuote
      ? acceptedQuote.manufacturer?.companyName || 'Awarded Manufacturer'
      : isAwarded && quotes.length > 0
        ? quotes[0].manufacturer?.companyName || 'Selection Pending'
        : 'Selection Pending';

    const isGeneric = Boolean(rfq.isGeneric || rfq.lines?.some((l: any) => l.productType === 'GENERIC'));
    let genericStatus = 'NONE';
    if (isGeneric) {
      const st = (rfq.status || '').toLowerCase();
      if (['quoted', 'vendor selected', 'awarded', 'closed'].includes(st)) {
        genericStatus = 'PRICED';
      } else {
        genericStatus = 'SUBMITTED';
      }
    }

    return {
      id: rfq.id.toString(),
      rfqNumber: rfq.rfqNumber,
      customerId: rfq.userId ? rfq.userId.toString() : '1',
      customerName: rfq.companyName || rfq.buyerName || 'Direct Buyer',
      customerCode: rfq.customerCode || '',
      customerClassification: rfq.customerClassification || 'REGULAR',
      createdDate: rfq.rfqDate ? rfq.rfqDate.toISOString().split('T')[0] : (rfq.createdAt ? rfq.createdAt.toISOString().split('T')[0] : ''),
      createdAt: rfq.createdAt ? rfq.createdAt.toISOString() : '',
      targetDeliveryDate: rfq.requiredDate
        ? rfq.requiredDate.toISOString().split('T')[0]
        : (rfq.deadlineDate ? rfq.deadlineDate.toISOString().split('T')[0] : ''),
      deadlineDate: rfq.deadlineDate ? rfq.deadlineDate.toISOString().split('T')[0] : '',
      status: rfq.status,
      priority: rfq.priority || 'STANDARD',
      deliveryLocation: rfq.deliveryLocation || '',
      remarks: rfq.remarks || '',
      creditRequired: rfq.creditRequired ?? false,
      creditTerms: rfq.creditTerms || 'Net 30 Days',
      isGeneric,
      genericStatus,
      quotesCount,
      lowestPrice,
      highestPrice,
      isAwarded,
      selectedManufacturerName,
      quotes: quotes.map((q: any) => ({
        id: q.id.toString(),
        quoteNumber: q.quoteNumber,
        manufacturerId: q.manufacturerId ? q.manufacturerId.toString() : '',
        manufacturerName: q.manufacturer?.companyName || 'Verified Manufacturer',
        totalAmount: Number(q.totalAmount || 0),
        status: q.status,
        validUntil: q.validUntil ? q.validUntil.toISOString().split('T')[0] : null,
      })),
      lines: (rfq.lines || []).map((l: any, idx: number) => ({
        id: l.id.toString(),
        rfqLineId: l.id.toString(),
        lineItemNumber: l.lineItemNumber || idx + 1,
        productId: l.productId || `p${idx + 1}`,
        productName: l.productName,
        productCode: l.productCode,
        category: l.category,
        subCategory: l.subCategory,
        subSubCategory: l.subSubCategory,
        productType: l.productType || (isGeneric ? 'GENERIC' : 'BRANDED'),
        dosageForm: l.dosageForm || 'Tablet',
        packSize: l.packSize || '10 x 10 Strip',
        uom: l.uom || 'Units',
        quantity: Number(l.quantity),
        targetPrice: l.targetPrice ? Number(l.targetPrice) : null,
        internalPrice: l.targetPrice ? Number(l.targetPrice) : null,
        adminProcessingStatus: genericStatus,
        requiredDate: l.requiredDate ? l.requiredDate.toISOString().split('T')[0] : null,
        remarks: l.remarks || '',
        molecule: l.molecule || '',
        strength: l.strength || '',
      })),
    };
  }
}
