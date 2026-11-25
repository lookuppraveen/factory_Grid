import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '@factorygrid/auth';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DeclineManufacturerRfqDto,
  ManufacturerRfqQueryDto,
  SubmitManufacturerQuoteDto,
} from './dto/manufacturer-rfq.dto';

@Injectable()
export class ManufacturerRfqService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves authenticated manufacturer registration from PostgreSQL.
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

    const isAdmin =
      (user as any).roles?.includes('ADMIN') ||
      (user as any).roles?.includes('ROLE_ADMIN') ||
      (user as any).role === 'ADMIN';

    if (explicitMfgId) {
      if (isAdmin) {
        const targetReg = await this.prisma.manufacturerRegistration.findFirst({
          where: {
            OR: [
              { registrationCode: explicitMfgId },
              ...(isNaN(Number(explicitMfgId)) ? [] : [{ id: BigInt(explicitMfgId) }]),
            ],
          },
        });
        if (targetReg) return targetReg;
      } else if (reg) {
        const isMatch =
          reg.registrationCode === explicitMfgId ||
          reg.manufacturerCode === explicitMfgId ||
          String(reg.id) === explicitMfgId;
        if (!isMatch) {
          throw new ForbiddenException(
            'Manufacturer Isolation: You do not have permission to access RFQs for another facility.',
          );
        }
      }
    }

    if (!reg && isAdmin) {
      reg = await this.prisma.manufacturerRegistration.findFirst({
        where: { status: { in: ['APPROVED', 'Active', 'VERIFIED'] } },
        orderBy: { id: 'asc' },
      });
      if (!reg) {
        reg = await this.prisma.manufacturerRegistration.findFirst({ orderBy: { id: 'asc' } });
      }
    }

    if (!reg) {
      throw new NotFoundException('Authenticated user is not registered as a verified manufacturer.');
    }

    return reg;
  }

  /**
   * Generates next sequential Quote number (QUO-YYYY-XXXX).
   */
  private async generateNextQuoteNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `QUO-${currentYear}-`;

    const lastQuote = await this.prisma.quote.findFirst({
      where: { quoteNumber: { startsWith: prefix } },
      orderBy: { id: 'desc' },
      select: { quoteNumber: true },
    });

    let nextSeq = 1001;
    if (lastQuote?.quoteNumber) {
      const parts = lastQuote.quoteNumber.split('-');
      const numPart = parseInt(parts[2], 10);
      if (!isNaN(numPart)) {
        nextSeq = numPart + 1;
      }
    }

    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Helper to check if deadline has passed.
   */
  private isDeadlinePassed(deadlineDate: Date | null): boolean {
    if (!deadlineDate) return false;
    const d = new Date(deadlineDate);
    if (isNaN(d.getTime())) return false;
    d.setHours(23, 59, 59, 999);
    return new Date() > d;
  }

  /**
   * Lists RFQs assigned to the authenticated manufacturer with computed status badges and counts.
   */
  async listAssignedRfqs(user: AuthUser, query?: ManufacturerRfqQueryDto) {
    const mfg = await this.resolveManufacturer(user);

    const assignments = await this.prisma.rfqManufacturerAssignment.findMany({
      where: { manufacturerId: mfg.id },
      include: {
        rfq: {
          include: {
            lines: {
              orderBy: { lineItemNumber: 'asc' },
            },
          },
        },
        quotes: {
          where: { manufacturerId: mfg.id },
          include: {
            lines: true,
          },
          orderBy: { id: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute status and counts across all assignments
    let actionNeededCount = 0;
    let draftSavedCount = 0;
    let submittedCount = 0;
    let declinedCount = 0;
    let expiredCount = 0;

    const mappedItems = assignments.map((assignment) => {
      const rfq = assignment.rfq;
      const quote = assignment.quotes?.[0] || null;
      const isPast = this.isDeadlinePassed(rfq.deadlineDate);

      let computedStatus: 'DECLINED' | 'SUBMITTED' | 'DRAFT' | 'EXPIRED' | 'ACTION NEEDED' = 'ACTION NEEDED';

      if (assignment.status === 'DECLINED') {
        computedStatus = 'DECLINED';
        declinedCount++;
      } else if (quote?.status === 'SUBMITTED' || assignment.status === 'QUOTED') {
        computedStatus = 'SUBMITTED';
        submittedCount++;
      } else if (quote?.status === 'DRAFT' || assignment.status === 'DRAFT') {
        computedStatus = 'DRAFT';
        draftSavedCount++;
      } else if (isPast || rfq.status === 'Closed' || rfq.status === 'Expired') {
        computedStatus = 'EXPIRED';
        expiredCount++;
      } else {
        computedStatus = 'ACTION NEEDED';
        actionNeededCount++;
      }

      return {
        assignmentId: assignment.id.toString(),
        rfqId: rfq.id.toString(),
        rfqNumber: rfq.rfqNumber,
        customerName: rfq.companyName || rfq.buyerName,
        buyerName: rfq.buyerName,
        customerClassification: rfq.customerClassification,
        priority: rfq.priority,
        deliveryLocation: rfq.deliveryLocation,
        rfqDate: rfq.rfqDate ? rfq.rfqDate.toISOString().split('T')[0] : '',
        deadlineDate: rfq.deadlineDate ? rfq.deadlineDate.toISOString().split('T')[0] : null,
        requiredDate: rfq.requiredDate ? rfq.requiredDate.toISOString().split('T')[0] : null,
        status: computedStatus,
        assignmentStatus: assignment.status,
        quoteStatus: quote?.status || null,
        sentAt: assignment.sentAt ? assignment.sentAt.toISOString() : null,
        viewedAt: assignment.viewedAt ? assignment.viewedAt.toISOString() : null,
        totalLines: rfq.lines.length,
        totalQuantity: rfq.lines.reduce((sum, l) => sum + (l.quantity || 0), 0),
        linesPreview: rfq.lines.slice(0, 3).map((l) => ({
          productName: l.productName,
          quantity: l.quantity,
          uom: l.uom,
        })),
        quote: quote
          ? {
              id: quote.id.toString(),
              quoteNumber: quote.quoteNumber,
              status: quote.status,
              totalAmount: Number(quote.totalAmount),
              submittedAt: quote.submittedAt ? quote.submittedAt.toISOString() : null,
              linesCount: quote.lines.length,
            }
          : null,
      };
    });

    // Apply filtering
    let filtered = mappedItems;

    if (query?.status && query.status !== 'ALL') {
      const s = query.status.toUpperCase();
      if (s === 'ACTION_NEEDED' || s === 'NEW' || s === 'ACTION NEEDED') {
        filtered = filtered.filter((i) => i.status === 'ACTION NEEDED');
      } else if (s === 'DRAFT') {
        filtered = filtered.filter((i) => i.status === 'DRAFT');
      } else if (s === 'SUBMITTED') {
        filtered = filtered.filter((i) => i.status === 'SUBMITTED');
      } else if (s === 'DECLINED') {
        filtered = filtered.filter((i) => i.status === 'DECLINED');
      } else if (s === 'EXPIRED') {
        filtered = filtered.filter((i) => i.status === 'EXPIRED');
      }
    }

    if (query?.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.rfqNumber.toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q) ||
          i.linesPreview.some((l) => l.productName.toLowerCase().includes(q)),
      );
    }

    return {
      manufacturer: {
        id: mfg.id.toString(),
        registrationCode: mfg.registrationCode,
        manufacturerCode: mfg.manufacturerCode || mfg.registrationCode,
        companyName: mfg.companyName,
        city: mfg.city || '',
        state: mfg.state || '',
      },
      counts: {
        all: mappedItems.length,
        actionNeeded: actionNeededCount,
        draftSaved: draftSavedCount,
        submitted: submittedCount,
        declined: declinedCount,
        expired: expiredCount,
      },
      items: filtered,
    };
  }

  /**
   * Retrieves single assigned RFQ detail for quoting, marking viewed if first time.
   */
  async getAssignedRfqById(rfqId: number, user: AuthUser) {
    const mfg = await this.resolveManufacturer(user);

    const assignment = await this.prisma.rfqManufacturerAssignment.findUnique({
      where: {
        rfqId_manufacturerId: {
          rfqId: BigInt(rfqId),
          manufacturerId: mfg.id,
        },
      },
      include: {
        rfq: {
          include: {
            lines: {
              orderBy: { lineItemNumber: 'asc' },
            },
          },
        },
        quotes: {
          where: { manufacturerId: mfg.id },
          include: {
            lines: {
              orderBy: { id: 'asc' },
            },
          },
          orderBy: { id: 'desc' },
          take: 1,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(`RFQ with ID ${rfqId} is not assigned to your manufacturing facility.`);
    }

    // Auto mark as viewed
    if (assignment.status === 'ASSIGNED') {
      await this.prisma.rfqManufacturerAssignment.update({
        where: { id: assignment.id },
        data: {
          status: 'VIEWED',
          viewedAt: new Date(),
        },
      });
      assignment.status = 'VIEWED';
      assignment.viewedAt = new Date();
    }

    const rfq = assignment.rfq;
    const existingQuote = assignment.quotes?.[0] || null;

    return {
      assignmentId: assignment.id.toString(),
      status: assignment.status,
      sentAt: assignment.sentAt ? assignment.sentAt.toISOString() : null,
      viewedAt: assignment.viewedAt ? assignment.viewedAt.toISOString() : null,
      declinedAt: assignment.declinedAt ? assignment.declinedAt.toISOString() : null,
      declineReason: assignment.declineReason,
      declineRemarks: assignment.declineRemarks,
      manufacturer: {
        id: mfg.id.toString(),
        registrationCode: mfg.registrationCode,
        manufacturerCode: mfg.manufacturerCode || mfg.registrationCode,
        companyName: mfg.companyName,
      },
      rfq: {
        id: rfq.id.toString(),
        rfqNumber: rfq.rfqNumber,
        buyerName: rfq.buyerName,
        companyName: rfq.companyName,
        customerCode: rfq.customerCode,
        customerClassification: rfq.customerClassification,
        priority: rfq.priority,
        deliveryLocation: rfq.deliveryLocation,
        rfqDate: rfq.rfqDate ? rfq.rfqDate.toISOString().split('T')[0] : '',
        requiredDate: rfq.requiredDate ? rfq.requiredDate.toISOString().split('T')[0] : null,
        deadlineDate: rfq.deadlineDate ? rfq.deadlineDate.toISOString().split('T')[0] : null,
        remarks: rfq.remarks,
        creditRequired: rfq.creditRequired,
        creditTerms: rfq.creditTerms,
        isGeneric: rfq.isGeneric,
        status: rfq.status,
        lines: rfq.lines.map((l) => ({
          id: l.id.toString(),
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
          requiredDate: l.requiredDate ? l.requiredDate.toISOString().split('T')[0] : null,
          remarks: l.remarks,
          molecule: l.molecule,
          strength: l.strength,
        })),
      },
      existingQuote: existingQuote
        ? {
            id: existingQuote.id.toString(),
            quoteNumber: existingQuote.quoteNumber,
            status: existingQuote.status,
            totalAmount: Number(existingQuote.totalAmount),
            validUntil: existingQuote.validUntil ? existingQuote.validUntil.toISOString().split('T')[0] : null,
            deliveryTerms: existingQuote.deliveryTerms,
            paymentTerms: existingQuote.paymentTerms,
            remarks: existingQuote.remarks,
            submittedAt: existingQuote.submittedAt ? existingQuote.submittedAt.toISOString() : null,
            lines: existingQuote.lines.map((ql) => ({
              id: ql.id.toString(),
              rfqLineId: ql.rfqLineId ? ql.rfqLineId.toString() : null,
              productId: ql.productId,
              productName: ql.productName,
              responseType: ql.responseType,
              quotedQuantity: ql.quotedQuantity,
              unitPrice: Number(ql.unitPrice),
              moq: ql.moq,
              leadTimeDays: ql.leadTimeDays,
              taxPercent: Number(ql.taxPercent),
              discountPercent: Number(ql.discountPercent),
              calculatedTotal: Number(ql.calculatedTotal),
              deliveryTerms: ql.deliveryTerms,
              cannotSupplyReason: ql.cannotSupplyReason,
              cannotSupplyRemarks: ql.cannotSupplyRemarks,
              remarks: ql.remarks,
            })),
          }
        : null,
    };
  }

  /**
   * Submits or saves a draft quote for an assigned RFQ.
   */
  async submitQuote(rfqId: number, dto: SubmitManufacturerQuoteDto, user: AuthUser) {
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('At least one quotation line is required.');
    }

    const mfg = await this.resolveManufacturer(user);

    const assignment = await this.prisma.rfqManufacturerAssignment.findUnique({
      where: {
        rfqId_manufacturerId: {
          rfqId: BigInt(rfqId),
          manufacturerId: mfg.id,
        },
      },
      include: { rfq: true },
    });

    if (!assignment) {
      throw new NotFoundException(`RFQ with ID ${rfqId} is not assigned to your facility.`);
    }

    if (assignment.status === 'DECLINED') {
      throw new BadRequestException('Cannot submit a quotation for an RFQ that has already been declined.');
    }

    const isDraft = dto.status === 'DRAFT';
    const quoteStatus = isDraft ? 'DRAFT' : 'SUBMITTED';

    // Parse validUntil
    let validUntilDate: Date | null = null;
    if (dto.validUntil) {
      const parsed = new Date(dto.validUntil);
      if (!isNaN(parsed.getTime())) {
        validUntilDate = parsed;
      }
    }

    // Calculate line totals and overall total
    let overallTotal = 0;
    const computedLines = dto.lines.map((l) => {
      let lineTotal = 0;
      if (l.responseType === 'QUOTE') {
        const qty = Number(l.quotedQuantity) || 1;
        const price = Number(l.unitPrice) || 0;
        const disc = Number(l.discountPercent) || 0;
        const tax = Number(l.taxPercent) || 0;

        const discountedSubtotal = qty * price * (1 - disc / 100);
        lineTotal = discountedSubtotal * (1 + tax / 100);
        overallTotal += lineTotal;
      }

      return {
        ...l,
        calculatedTotal: lineTotal,
      };
    });

    const quote = await this.prisma.$transaction(async (tx) => {
      // Find existing quote for this assignment/RFQ
      let existingQuote = await tx.quote.findFirst({
        where: {
          rfqId: BigInt(rfqId),
          manufacturerId: mfg.id,
        },
      });

      let quoteRecord;
      if (existingQuote) {
        // Delete old lines
        await tx.quoteLine.deleteMany({
          where: { quoteId: existingQuote.id },
        });

        // Update quote header
        quoteRecord = await tx.quote.update({
          where: { id: existingQuote.id },
          data: {
            status: quoteStatus,
            totalAmount: overallTotal,
            validUntil: validUntilDate,
            deliveryTerms: dto.deliveryTerms || null,
            paymentTerms: dto.paymentTerms || null,
            remarks: dto.remarks || null,
            submittedAt: isDraft ? null : new Date(),
          },
        });
      } else {
        const quoteNumber = await this.generateNextQuoteNumber();
        quoteRecord = await tx.quote.create({
          data: {
            quoteNumber,
            rfqId: BigInt(rfqId),
            manufacturerId: mfg.id,
            assignmentId: assignment.id,
            status: quoteStatus,
            totalAmount: overallTotal,
            validUntil: validUntilDate,
            deliveryTerms: dto.deliveryTerms || null,
            paymentTerms: dto.paymentTerms || null,
            remarks: dto.remarks || null,
            submittedAt: isDraft ? null : new Date(),
          },
        });
      }

      // Create lines
      for (const cl of computedLines) {
        await tx.quoteLine.create({
          data: {
            quoteId: quoteRecord.id,
            rfqLineId: cl.rfqLineId && !isNaN(Number(cl.rfqLineId)) ? BigInt(cl.rfqLineId) : null,
            productId: cl.productId || null,
            productName: cl.productName,
            responseType: cl.responseType,
            quotedQuantity: cl.quotedQuantity,
            unitPrice: cl.unitPrice || 0,
            moq: cl.moq || 1,
            leadTimeDays: cl.leadTimeDays || 14,
            taxPercent: cl.taxPercent || 0,
            discountPercent: cl.discountPercent || 0,
            calculatedTotal: cl.calculatedTotal,
            deliveryTerms: cl.deliveryTerms || dto.deliveryTerms || null,
            cannotSupplyReason: cl.cannotSupplyReason || null,
            cannotSupplyRemarks: cl.cannotSupplyRemarks || null,
            remarks: cl.remarks || null,
          },
        });
      }

      // Update assignment status
      await tx.rfqManufacturerAssignment.update({
        where: { id: assignment.id },
        data: {
          status: isDraft ? 'DRAFT' : 'QUOTED',
        },
      });

      // If submitted, update RFQ status to Quoted if it is currently Submitted or Pricing In Progress
      if (!isDraft) {
        const currentRfq = await tx.rfq.findUnique({
          where: { id: BigInt(rfqId) },
        });
        if (currentRfq && (currentRfq.status === 'Submitted' || currentRfq.status === 'Pricing In Progress')) {
          await tx.rfq.update({
            where: { id: currentRfq.id },
            data: { status: 'Quoted' },
          });
        }
      }

      return tx.quote.findUnique({
        where: { id: quoteRecord.id },
        include: {
          lines: { orderBy: { id: 'asc' } },
          manufacturer: true,
        },
      });
    });

    return {
      message: isDraft ? 'Draft quotation saved successfully' : 'Quotation submitted successfully to Buyer',
      quote: {
        id: quote!.id.toString(),
        quoteNumber: quote!.quoteNumber,
        rfqId: quote!.rfqId.toString(),
        manufacturerId: quote!.manufacturerId.toString(),
        status: quote!.status,
        totalAmount: Number(quote!.totalAmount),
        validUntil: quote!.validUntil ? quote!.validUntil.toISOString().split('T')[0] : null,
        deliveryTerms: quote!.deliveryTerms,
        paymentTerms: quote!.paymentTerms,
        remarks: quote!.remarks,
        submittedAt: quote!.submittedAt ? quote!.submittedAt.toISOString() : null,
        lines: quote!.lines.map((l) => ({
          id: l.id.toString(),
          rfqLineId: l.rfqLineId ? l.rfqLineId.toString() : null,
          productName: l.productName,
          responseType: l.responseType,
          quotedQuantity: l.quotedQuantity,
          unitPrice: Number(l.unitPrice),
          moq: l.moq,
          leadTimeDays: l.leadTimeDays,
          taxPercent: Number(l.taxPercent),
          discountPercent: Number(l.discountPercent),
          calculatedTotal: Number(l.calculatedTotal),
        })),
      },
    };
  }

  /**
   * Declines an assigned RFQ.
   */
  async declineRfq(rfqId: number, dto: DeclineManufacturerRfqDto, user: AuthUser) {
    const mfg = await this.resolveManufacturer(user);

    const assignment = await this.prisma.rfqManufacturerAssignment.findUnique({
      where: {
        rfqId_manufacturerId: {
          rfqId: BigInt(rfqId),
          manufacturerId: mfg.id,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(`RFQ with ID ${rfqId} is not assigned to your facility.`);
    }

    const updated = await this.prisma.rfqManufacturerAssignment.update({
      where: { id: assignment.id },
      data: {
        status: 'DECLINED',
        declinedAt: new Date(),
        declineReason: dto.declineReason,
        declineRemarks: dto.declineRemarks || null,
      },
    });

    return {
      message: 'RFQ declined successfully',
      assignmentId: updated.id.toString(),
      status: updated.status,
      declinedAt: updated.declinedAt?.toISOString(),
    };
  }

  /**
   * Lists commercial quotations submitted by the authenticated manufacturer.
   */
  async listSubmittedQuotes(user: AuthUser, query?: ManufacturerRfqQueryDto) {
    const mfg = await this.resolveManufacturer(user);

    const searchTerm = query?.search?.trim() || '';
    const statusFilter = query?.status && query.status !== 'ALL' ? query.status : undefined;

    const baseWhere: any = {
      manufacturerId: mfg.id,
      ...(statusFilter ? { status: statusFilter } : { status: { not: 'DRAFT' } }),
    };

    if (searchTerm) {
      baseWhere.OR = [
        { quoteNumber: { contains: searchTerm, mode: 'insensitive' } },
        { rfq: { rfqNumber: { contains: searchTerm, mode: 'insensitive' } } },
        { rfq: { buyerName: { contains: searchTerm, mode: 'insensitive' } } },
        { rfq: { companyName: { contains: searchTerm, mode: 'insensitive' } } },
        { lines: { some: { productName: { contains: searchTerm, mode: 'insensitive' } } } },
      ];
    }

    const quotes = await this.prisma.quote.findMany({
      where: baseWhere,
      include: {
        rfq: {
          select: {
            id: true,
            rfqNumber: true,
            companyName: true,
            buyerName: true,
            customerCode: true,
            customerClassification: true,
            priority: true,
            deliveryLocation: true,
            rfqDate: true,
            requiredDate: true,
            deadlineDate: true,
          },
        },
        lines: {
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Aggregate metrics for this manufacturer's submitted quotes
    const allSubmittedQuotes = await this.prisma.quote.findMany({
      where: {
        manufacturerId: mfg.id,
        status: { not: 'DRAFT' },
      },
      select: {
        totalAmount: true,
      },
    });

    const totalSubmittedCount = allSubmittedQuotes.length;
    const totalCommercialValue = allSubmittedQuotes.reduce(
      (sum, q) => sum + Number(q.totalAmount || 0),
      0,
    );

    const items = quotes.map((q) => {
      const quotedLines = q.lines.filter((l) => l.responseType === 'QUOTE');
      const cannotSupplyLines = q.lines.filter((l) => l.responseType === 'CANNOT_SUPPLY');

      let productsSummary = 'No products';
      if (q.lines.length > 0) {
        const firstLine = q.lines[0];
        if (q.lines.length === 1) {
          productsSummary = firstLine.productName;
        } else {
          productsSummary = `${firstLine.productName} (+${q.lines.length - 1} more)`;
        }
      }

      return {
        id: q.id.toString(),
        quoteNumber: q.quoteNumber,
        rfqId: q.rfqId.toString(),
        rfqNumber: q.rfq.rfqNumber,
        buyer: q.rfq.companyName || q.rfq.buyerName || 'Buyer',
        buyerCustomerCode: q.rfq.customerCode || null,
        buyerDeliveryLocation: q.rfq.deliveryLocation || null,
        totalAmount: Number(q.totalAmount || 0),
        submissionDate: q.submittedAt ? q.submittedAt.toISOString() : q.createdAt.toISOString(),
        validUntil: q.validUntil ? q.validUntil.toISOString().split('T')[0] : null,
        deliveryTerms: q.deliveryTerms || null,
        paymentTerms: q.paymentTerms || null,
        remarks: q.remarks || null,
        status: q.status,
        productsSummary,
        linesCount: q.lines.length,
        quotedLinesCount: quotedLines.length,
        cannotSupplyLinesCount: cannotSupplyLines.length,
        linesPreview: q.lines.map((l) => ({
          id: l.id.toString(),
          productName: l.productName,
          responseType: l.responseType,
          quantity: l.quotedQuantity,
          unitPrice: Number(l.unitPrice),
          moq: l.moq,
          leadTimeDays: l.leadTimeDays,
          calculatedTotal: Number(l.calculatedTotal),
        })),
      };
    });

    return {
      manufacturer: {
        id: mfg.id.toString(),
        registrationCode: mfg.registrationCode,
        manufacturerCode: mfg.manufacturerCode,
        companyName: mfg.companyName,
      },
      metrics: {
        submittedCount: totalSubmittedCount,
        totalCommercialValue: Math.round(totalCommercialValue),
      },
      items,
    };
  }

  /**
   * Retrieves single submitted quote detail for authenticated manufacturer.
   */
  async getSubmittedQuoteDetail(quoteId: string | number, user: AuthUser) {
    const mfg = await this.resolveManufacturer(user);

    const isNumeric = !isNaN(Number(quoteId));
    const quote = await this.prisma.quote.findFirst({
      where: {
        OR: [
          { quoteNumber: String(quoteId) },
          ...(isNumeric ? [{ id: BigInt(quoteId) }] : []),
        ],
        manufacturerId: mfg.id,
      },
      include: {
        rfq: {
          include: {
            lines: { orderBy: { lineItemNumber: 'asc' } },
          },
        },
        lines: { orderBy: { id: 'asc' } },
        manufacturer: true,
      },
    });

    if (!quote) {
      throw new NotFoundException(`Quotation with reference "${quoteId}" was not found or is not accessible.`);
    }

    return {
      id: quote.id.toString(),
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      totalAmount: Number(quote.totalAmount || 0),
      submissionDate: quote.submittedAt ? quote.submittedAt.toISOString() : quote.createdAt.toISOString(),
      validUntil: quote.validUntil ? quote.validUntil.toISOString().split('T')[0] : null,
      deliveryTerms: quote.deliveryTerms || null,
      paymentTerms: quote.paymentTerms || null,
      remarks: quote.remarks || null,
      rfq: {
        id: quote.rfq.id.toString(),
        rfqNumber: quote.rfq.rfqNumber,
        buyerName: quote.rfq.buyerName,
        companyName: quote.rfq.companyName,
        customerCode: quote.rfq.customerCode,
        customerClassification: quote.rfq.customerClassification,
        priority: quote.rfq.priority,
        deliveryLocation: quote.rfq.deliveryLocation,
        rfqDate: quote.rfq.rfqDate.toISOString(),
        requiredDate: quote.rfq.requiredDate ? quote.rfq.requiredDate.toISOString() : null,
        deadlineDate: quote.rfq.deadlineDate ? quote.rfq.deadlineDate.toISOString() : null,
        creditRequired: quote.rfq.creditRequired,
        creditTerms: quote.rfq.creditTerms,
        remarks: quote.rfq.remarks,
      },
      manufacturer: {
        id: quote.manufacturer.id.toString(),
        companyName: quote.manufacturer.companyName,
        registrationCode: quote.manufacturer.registrationCode,
      },
      lines: quote.lines.map((l) => {
        const matchingRfqLine = quote.rfq.lines.find(
          (rl) => (l.rfqLineId && rl.id === l.rfqLineId) || (l.productId && rl.productId === l.productId)
        );

        return {
          id: l.id.toString(),
          rfqLineId: l.rfqLineId ? l.rfqLineId.toString() : null,
          productId: l.productId,
          productName: l.productName,
          category: matchingRfqLine?.category || null,
          dosageForm: matchingRfqLine?.dosageForm || null,
          packSize: matchingRfqLine?.packSize || null,
          uom: matchingRfqLine?.uom || 'Units',
          responseType: l.responseType,
          quotedQuantity: l.quotedQuantity,
          unitPrice: Number(l.unitPrice),
          moq: l.moq,
          leadTimeDays: l.leadTimeDays,
          calculatedTotal: Number(l.calculatedTotal),
          deliveryTerms: l.deliveryTerms,
          cannotSupplyReason: l.cannotSupplyReason,
          cannotSupplyRemarks: l.cannotSupplyRemarks,
          remarks: l.remarks,
        };
      }),
    };
  }
}
