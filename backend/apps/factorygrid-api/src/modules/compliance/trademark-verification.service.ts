import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

function formatBytes(bytes: bigint | number): string {
  const n = Number(bytes);
  if (n === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${parseFloat((n / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

@Injectable()
export class TrademarkVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  toTrademarkRecord(d: any) {
    const checks = (d.checks as Record<string, string>) || {
      existence: 'Pending',
      owner: 'Pending',
      status: 'Under Review',
      classMatch: 'Pending',
      validity: 'Pending',
    };

    return {
      id: d.id.toString(),
      recordCode: `TM-REC-${d.id}`,
      rawId: d.id.toString(),
      trademarkName: d.trademarkName,
      customerName: d.user?.companyName || d.user?.fullName || d.registration?.companyName || 'Buyer Enterprise',
      customerCode: d.user?.userCode || d.registration?.registrationCode || `CUS-${d.userId}`,
      submissionDate: d.createdAt ? d.createdAt.toISOString().split('T')[0] : '',
      verificationStatus: d.status,
      verificationSource: d.verificationSource || 'Customer Uploaded TM Certificate',
      tmClass: d.tmClass || 'Class 5 (Pharmaceuticals & Medicinal Preparations)',
      tmNumber: d.tmNumber,
      expiryDate: d.expiryDate ? d.expiryDate.toISOString().split('T')[0] : 'N/A',
      issueDate: d.issueDate ? d.issueDate.toISOString().split('T')[0] : null,
      documentType: d.documentType || 'Trademark Certificate',
      checks,
      conflictNotes: d.conflictNotes || undefined,
      rejectionReason: d.rejectionReason || undefined,
      certificateFileName: d.fileName,
      fileSize: formatBytes(d.fileSize),
      downloadUrl: `/api/v1/compliance/trademark-verifications/${d.id}/download`,
      approvedAt: d.approvedAt ? d.approvedAt.toISOString().split('T')[0] : undefined,
      reviewedBy: d.reviewedBy || undefined,
      reviewedAt: d.reviewedAt ? d.reviewedAt.toISOString() : undefined,
    };
  }

  async listAll(statusFilter?: string) {
    const where: any = {};
    if (statusFilter && statusFilter !== 'ALL') {
      if (statusFilter === 'UNDER_REVIEW') {
        where.status = { in: ['Under Review', 'UNDER REVIEW', 'PENDING'] };
      } else if (statusFilter === 'APPROVED') {
        where.status = { in: ['Approved', 'APPROVED'] };
      } else if (statusFilter === 'CONFLICT') {
        where.status = { in: ['Conflict Found', 'CONFLICT FOUND'] };
      } else if (statusFilter === 'EXPIRED') {
        where.status = { in: ['Expired', 'EXPIRED'] };
      } else if (statusFilter === 'REJECTED') {
        where.status = { in: ['Rejected', 'REJECTED'] };
      } else {
        where.status = statusFilter;
      }
    }

    const docs = await this.prisma.buyerTrademarkDocument.findMany({
      where,
      include: {
        user: true,
        registration: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return docs.map(d => this.toTrademarkRecord(d));
  }

  async getById(id: number) {
    const doc = await this.prisma.buyerTrademarkDocument.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: true,
        registration: true,
      },
    });
    if (!doc) {
      throw new NotFoundException(`Trademark verification record ${id} not found.`);
    }
    return this.toTrademarkRecord(doc);
  }

  async approve(id: number, reviewer: string) {
    const doc = await this.prisma.buyerTrademarkDocument.findUnique({
      where: { id: BigInt(id) },
    });
    if (!doc) {
      throw new NotFoundException(`Trademark verification record ${id} not found.`);
    }

    const updated = await this.prisma.buyerTrademarkDocument.update({
      where: { id: BigInt(id) },
      data: {
        status: 'Approved',
        approvedAt: new Date(),
        reviewedBy: reviewer,
        reviewedAt: new Date(),
        rejectionReason: null,
        conflictNotes: null,
        checks: {
          existence: 'Verified',
          owner: 'Verified',
          status: 'Verified',
          classMatch: 'Verified',
          validity: 'Verified',
        },
      },
      include: {
        user: true,
        registration: true,
      },
    });

    return this.toTrademarkRecord(updated);
  }

  async markConflict(id: number, reviewer: string, conflictNotes: string) {
    if (!conflictNotes || !conflictNotes.trim()) {
      throw new BadRequestException('Conflict details are required.');
    }

    const doc = await this.prisma.buyerTrademarkDocument.findUnique({
      where: { id: BigInt(id) },
    });
    if (!doc) {
      throw new NotFoundException(`Trademark verification record ${id} not found.`);
    }

    const existingChecks = (doc.checks as Record<string, string>) || {};

    const updated = await this.prisma.buyerTrademarkDocument.update({
      where: { id: BigInt(id) },
      data: {
        status: 'Conflict Found',
        conflictNotes: conflictNotes.trim(),
        reviewedBy: reviewer,
        reviewedAt: new Date(),
        checks: {
          ...existingChecks,
          owner: 'Failed',
          status: 'Failed',
        },
      },
      include: {
        user: true,
        registration: true,
      },
    });

    return this.toTrademarkRecord(updated);
  }

  async markExpired(id: number, reviewer: string) {
    const doc = await this.prisma.buyerTrademarkDocument.findUnique({
      where: { id: BigInt(id) },
    });
    if (!doc) {
      throw new NotFoundException(`Trademark verification record ${id} not found.`);
    }

    const existingChecks = (doc.checks as Record<string, string>) || {};

    const updated = await this.prisma.buyerTrademarkDocument.update({
      where: { id: BigInt(id) },
      data: {
        status: 'Expired',
        reviewedBy: reviewer,
        reviewedAt: new Date(),
        checks: {
          ...existingChecks,
          status: 'Failed',
          validity: 'Failed',
        },
      },
      include: {
        user: true,
        registration: true,
      },
    });

    return this.toTrademarkRecord(updated);
  }

  async reject(id: number, reviewer: string, reason: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Rejection reason is required.');
    }

    const doc = await this.prisma.buyerTrademarkDocument.findUnique({
      where: { id: BigInt(id) },
    });
    if (!doc) {
      throw new NotFoundException(`Trademark verification record ${id} not found.`);
    }

    const updated = await this.prisma.buyerTrademarkDocument.update({
      where: { id: BigInt(id) },
      data: {
        status: 'Rejected',
        rejectionReason: reason.trim(),
        reviewedBy: reviewer,
        reviewedAt: new Date(),
      },
      include: {
        user: true,
        registration: true,
      },
    });

    return this.toTrademarkRecord(updated);
  }

  async updateCheck(id: number, reviewer: string, checkKey: string, checkStatus: string) {
    const doc = await this.prisma.buyerTrademarkDocument.findUnique({
      where: { id: BigInt(id) },
    });
    if (!doc) {
      throw new NotFoundException(`Trademark verification record ${id} not found.`);
    }

    const checks = ((doc.checks as Record<string, string>) || {
      existence: 'Pending',
      owner: 'Pending',
      status: 'Under Review',
      classMatch: 'Pending',
      validity: 'Pending',
    });

    checks[checkKey] = checkStatus;

    const updated = await this.prisma.buyerTrademarkDocument.update({
      where: { id: BigInt(id) },
      data: {
        checks,
        reviewedBy: reviewer,
        reviewedAt: new Date(),
      },
      include: {
        user: true,
        registration: true,
      },
    });

    return this.toTrademarkRecord(updated);
  }

  async getDocForDownload(id: number) {
    const doc = await this.prisma.buyerTrademarkDocument.findUnique({
      where: { id: BigInt(id) },
    });
    if (!doc) {
      throw new NotFoundException(`Trademark verification record ${id} not found.`);
    }
    return doc;
  }
}
