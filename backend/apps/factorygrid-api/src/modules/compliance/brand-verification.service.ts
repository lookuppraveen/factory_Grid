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
export class BrandVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  toBrandRecord(d: any) {
    const checks = (d.checks as Record<string, string>) || {
      loaAuth: 'Pending',
      tmAgreement: 'Pending',
      formulaClearance: 'Pending',
      artworkCompliance: 'Pending',
    };

    return {
      id: d.id.toString(),
      recordCode: `BV-REC-${d.id}`,
      rawId: d.id.toString(),
      brandName: d.brandName,
      brandReference: d.brandReference || null,
      customerName: d.user?.companyName || d.user?.fullName || d.registration?.companyName || 'Buyer Enterprise',
      customerCode: d.user?.userCode || d.registration?.registrationCode || `CUS-${d.userId}`,
      submissionDate: d.createdAt ? d.createdAt.toISOString().split('T')[0] : '',
      status: d.status,
      tmRegistrationNo: d.tmRegistrationNo || 'N/A',
      dosageForm: d.dosageForm || 'Standard Formulation',
      documentNumber: d.documentNumber || null,
      checks,
      documents: [
        {
          id: `bd-${d.id}`,
          docType: d.documentType,
          fileName: d.fileName,
          fileSize: formatBytes(d.fileSize),
          uploadedAt: d.createdAt ? d.createdAt.toISOString().split('T')[0] : '',
          status:
            d.status === 'BRAND APPROVED'
              ? 'Verified'
              : d.status === 'BRAND REJECTED'
                ? 'Rejected'
                : 'Submitted',
          downloadUrl: `/api/v1/compliance/brand-verifications/${d.id}/download`,
        },
      ],
      rejectionReason: d.rejectionReason || undefined,
      authNotes: d.authNotes || undefined,
      approvedAt: d.approvedAt ? d.approvedAt.toISOString().split('T')[0] : undefined,
      reviewedBy: d.reviewedBy || undefined,
      reviewedAt: d.reviewedAt ? d.reviewedAt.toISOString() : undefined,
    };
  }

  async listAll(statusFilter?: string) {
    const where: any = {};
    if (statusFilter && statusFilter !== 'ALL') {
      if (statusFilter === 'UNDER_REVIEW') {
        where.status = { in: ['UNDER REVIEW', 'PENDING'] };
      } else if (statusFilter === 'APPROVED') {
        where.status = 'BRAND APPROVED';
      } else if (statusFilter === 'AUTH_REQUIRED') {
        where.status = 'AUTHORIZATION REQUIRED';
      } else if (statusFilter === 'REJECTED') {
        where.status = 'BRAND REJECTED';
      } else {
        where.status = statusFilter;
      }
    }

    const docs = await this.prisma.buyerBrandDocument.findMany({
      where,
      include: {
        user: true,
        registration: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return docs.map(d => this.toBrandRecord(d));
  }

  async getById(id: number) {
    const doc = await this.prisma.buyerBrandDocument.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: true,
        registration: true,
      },
    });
    if (!doc) {
      throw new NotFoundException(`Brand verification record ${id} not found.`);
    }
    return this.toBrandRecord(doc);
  }

  async approve(id: number, reviewer: string) {
    const doc = await this.prisma.buyerBrandDocument.findUnique({
      where: { id: BigInt(id) },
    });
    if (!doc) {
      throw new NotFoundException(`Brand verification record ${id} not found.`);
    }

    const updated = await this.prisma.buyerBrandDocument.update({
      where: { id: BigInt(id) },
      data: {
        status: 'BRAND APPROVED',
        approvedAt: new Date(),
        reviewedBy: reviewer,
        reviewedAt: new Date(),
        rejectionReason: null,
        checks: {
          loaAuth: 'Verified',
          tmAgreement: 'Verified',
          formulaClearance: 'Verified',
          artworkCompliance: 'Verified',
        },
      },
      include: {
        user: true,
        registration: true,
      },
    });

    return this.toBrandRecord(updated);
  }

  async requestAuth(id: number, reviewer: string, authNotes: string) {
    if (!authNotes || !authNotes.trim()) {
      throw new BadRequestException('Authorization notes are required.');
    }

    const doc = await this.prisma.buyerBrandDocument.findUnique({
      where: { id: BigInt(id) },
    });
    if (!doc) {
      throw new NotFoundException(`Brand verification record ${id} not found.`);
    }

    const existingChecks = (doc.checks as Record<string, string>) || {};

    const updated = await this.prisma.buyerBrandDocument.update({
      where: { id: BigInt(id) },
      data: {
        status: 'AUTHORIZATION REQUIRED',
        authNotes: authNotes.trim(),
        reviewedBy: reviewer,
        reviewedAt: new Date(),
        checks: {
          ...existingChecks,
          loaAuth: 'Failed',
        },
      },
      include: {
        user: true,
        registration: true,
      },
    });

    return this.toBrandRecord(updated);
  }

  async reject(id: number, reviewer: string, reason: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Rejection reason is required.');
    }

    const doc = await this.prisma.buyerBrandDocument.findUnique({
      where: { id: BigInt(id) },
    });
    if (!doc) {
      throw new NotFoundException(`Brand verification record ${id} not found.`);
    }

    const updated = await this.prisma.buyerBrandDocument.update({
      where: { id: BigInt(id) },
      data: {
        status: 'BRAND REJECTED',
        rejectionReason: reason.trim(),
        reviewedBy: reviewer,
        reviewedAt: new Date(),
      },
      include: {
        user: true,
        registration: true,
      },
    });

    return this.toBrandRecord(updated);
  }

  async updateCheck(id: number, reviewer: string, checkKey: string, checkStatus: string) {
    const doc = await this.prisma.buyerBrandDocument.findUnique({
      where: { id: BigInt(id) },
    });
    if (!doc) {
      throw new NotFoundException(`Brand verification record ${id} not found.`);
    }

    const checks = ((doc.checks as Record<string, string>) || {
      loaAuth: 'Pending',
      tmAgreement: 'Pending',
      formulaClearance: 'Pending',
      artworkCompliance: 'Pending',
    });

    checks[checkKey] = checkStatus;

    const updated = await this.prisma.buyerBrandDocument.update({
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

    return this.toBrandRecord(updated);
  }

  async getDocForDownload(id: number) {
    const doc = await this.prisma.buyerBrandDocument.findUnique({
      where: { id: BigInt(id) },
    });
    if (!doc) {
      throw new NotFoundException(`Brand verification record ${id} not found.`);
    }
    return doc;
  }
}
