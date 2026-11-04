import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '@factorygrid/auth';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRfqDto, UpdateRfqDto } from './dto/rfq.dto';

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
}
