import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '@factorygrid/auth';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async listVerifications(status?: string, search?: string) {
    const where: any = {};
    if (status && status !== 'ALL') {
      where.verificationStatus = status;
    }
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { requestCode: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const records = await this.prisma.customerVerificationRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        registration: {
          include: { documents: true },
        },
        user: true,
      },
    });

    return records.map((r) => this.formatRecord(r));
  }

  async getVerification(idOrCode: string) {
    const isId = /^\d+$/.test(idOrCode);
    const record = await this.prisma.customerVerificationRequest.findFirst({
      where: isId ? { id: BigInt(idOrCode) } : { requestCode: idOrCode },
      include: {
        registration: {
          include: { documents: true },
        },
        user: true,
      },
    });

    if (!record) {
      throw new NotFoundException(`Verification record ${idOrCode} not found.`);
    }

    return this.formatRecord(record);
  }

  async getDocumentForDownload(documentId: string, caller?: AuthUser) {
    let docIdNum: bigint;
    try {
      docIdNum = BigInt(documentId);
    } catch {
      throw new BadRequestException('Invalid document ID format.');
    }

    const doc = await this.prisma.buyerDocument.findUnique({
      where: { id: docIdNum },
      include: {
        registration: {
          include: { user: true },
        },
      },
    });

    if (!doc) {
      throw new NotFoundException(`Buyer document #${documentId} not found.`);
    }

    // Role check: staff (Admin / Compliance) can view any case. Buyers can only view their own.
    if (
      caller &&
      caller.roles?.some((r: string) => r.includes('BUYER')) &&
      !caller.roles?.some((r: string) => r.includes('ADMIN') || r.includes('COMPLIANCE'))
    ) {
      if (doc.registration.userId && BigInt(caller.id) !== doc.registration.userId) {
        throw new ForbiddenException("Access to another company's regulatory document is denied.");
      }
    }

    const file = await this.storageService.getFile(doc.storageKey);
    return {
      ...file,
      fileName: doc.fileName,
      mimeType: doc.mimeType || file.contentType || 'application/pdf',
    };
  }

  async assignOfficer(idOrCode: string, officer: string) {
    const record = await this.getVerification(idOrCode);
    const updated = await this.prisma.customerVerificationRequest.update({
      where: { requestCode: record.requestCode },
      data: { assignedComplianceOfficer: officer },
    });
    return this.formatRecord(updated);
  }

  async approveVerification(idOrCode: string, customerCodeCustom?: string) {
    const record = await this.getVerification(idOrCode);

    if (record.registrationId) {
      const rejectedDocs = await this.prisma.buyerDocument.findMany({
        where: {
          registrationId: BigInt(record.registrationId),
          status: { in: ['REJECTED', 'NEEDS_REPLACEMENT'] },
        },
      });
      if (rejectedDocs.length > 0) {
        throw new BadRequestException('Cannot approve verification while documents are rejected or awaiting replacement.');
      }
    }

    const customerCode = customerCodeCustom || `CUS000${Math.floor(Math.random() * 900 + 100)}`;
    const approvedAt = new Date();

    if (record.registrationId) {
      await this.prisma.buyerDocument.updateMany({
        where: {
          registrationId: BigInt(record.registrationId),
          status: 'PENDING',
        },
        data: {
          status: 'VALID',
          reviewDecision: 'APPROVED',
          reviewedBy: 'Compliance Desk Officer',
          reviewedAt: approvedAt,
        },
      });
    }

    const updated = await this.prisma.customerVerificationRequest.update({
      where: { requestCode: record.requestCode },
      data: {
        verificationStatus: 'Active',
        customerCode,
        portalLoginCreated: true,
        portalUsername: record.email,
        approvedAt,
        businessVerification: {
          ...(typeof record.businessVerification === 'object' && record.businessVerification ? record.businessVerification : {}),
          status: 'Approved by Compliance Officer',
          gstActiveStatus: 'Verified (Active)',
          panValidation: 'Verified',
          companyRegistrationValidation: 'Verified (ROC)',
          cinValidation: record.cinNumber ? 'Active & Verified' : 'N/A',
          approvedAt: approvedAt.toISOString(),
        },
        regulatoryVerification: {
          ...(typeof record.regulatoryVerification === 'object' && record.regulatoryVerification ? record.regulatoryVerification : {}),
          status: 'Approved by Compliance Officer',
          drugLicenseValidity: 'Verified (Form 20B/21B)',
          licenseExpiryCheck: 'Verified Active',
          stateRegulatoryAuthorityValidation: 'Verified with State Authority',
          approvedAt: approvedAt.toISOString(),
        },
        financialVerification: {
          ...(typeof record.financialVerification === 'object' && record.financialVerification ? record.financialVerification : {}),
          status: 'Approved by Compliance Officer',
          bankVerification: 'Verified (Account Active)',
          creditRating: 'Satisfactory',
          riskClassification: record.customerClassification === 'SPECIAL_PARTY' ? 'LOW (Special Partner)' : 'MODERATE (Standard Terms)',
          approvedAt: approvedAt.toISOString(),
        },
      },
    });

    // If a linked user exists, activate the user account
    if (record.userId) {
      await this.prisma.user.update({
        where: { id: BigInt(record.userId) },
        data: { accountStatus: 'ACTIVE' },
      });
    }

    if (record.registrationId) {
      await this.prisma.buyerRegistration.update({
        where: { id: BigInt(record.registrationId) },
        data: { status: 'APPROVED' },
      });
    }

    return this.formatRecord(updated);
  }

  async rejectVerification(idOrCode: string, reason: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Rejection reason is required.');
    }

    const record = await this.getVerification(idOrCode);
    const updated = await this.prisma.customerVerificationRequest.update({
      where: { requestCode: record.requestCode },
      data: {
        verificationStatus: 'Rejected',
        rejectionReason: reason.trim(),
      },
    });

    if (record.registrationId) {
      await this.prisma.buyerRegistration.update({
        where: { id: BigInt(record.registrationId) },
        data: {
          status: 'ACTION_REQUIRED',
          rejectionReason: reason.trim(),
        },
      });
    }

    return this.formatRecord(updated);
  }

  async requestMoreDocs(idOrCode: string, notes: string[]) {
    const record = await this.getVerification(idOrCode);
    const updated = await this.prisma.customerVerificationRequest.update({
      where: { requestCode: record.requestCode },
      data: {
        verificationStatus: 'Need More Docs',
        requestedDocumentsNotes: notes,
      },
    });

    if (record.registrationId) {
      await this.prisma.buyerRegistration.update({
        where: { id: BigInt(record.registrationId) },
        data: {
          status: 'ACTION_REQUIRED',
          rejectionReason: notes.join('; '),
        },
      });
    }

    return this.formatRecord(updated);
  }

  async reviewDocument(
    requestIdOrCode: string,
    documentId: string,
    dto: { decision: 'APPROVED' | 'REJECTED' | 'NEEDS_REPLACEMENT'; reason?: string; reviewer?: string },
  ) {
    if (!['APPROVED', 'REJECTED', 'NEEDS_REPLACEMENT'].includes(dto?.decision)) {
      throw new BadRequestException('decision must be one of APPROVED, REJECTED, NEEDS_REPLACEMENT.');
    }
    if ((dto.decision === 'REJECTED' || dto.decision === 'NEEDS_REPLACEMENT') && (!dto.reason || !dto.reason.trim())) {
      throw new BadRequestException('A reason is required when a document is rejected or replacement is requested.');
    }

    const verification = await this.getVerification(requestIdOrCode);
    const docIdNum = BigInt(documentId);
    const doc = await this.prisma.buyerDocument.findFirst({
      where: { id: docIdNum, registrationId: BigInt(verification.registrationId) },
    });

    if (!doc) {
      throw new NotFoundException(`Document ${documentId} not found for this verification request.`);
    }

    const docStatus = dto.decision === 'APPROVED' ? 'VALID' : dto.decision === 'REJECTED' ? 'REJECTED' : 'NEEDS_REPLACEMENT';
    const updatedDoc = await this.prisma.buyerDocument.update({
      where: { id: docIdNum },
      data: {
        status: docStatus,
        reviewDecision: dto.decision,
        rejectionReason: dto.reason?.trim() || null,
        reviewedBy: dto.reviewer?.trim() || 'Compliance Officer',
        reviewedAt: new Date(),
      },
    });

    if (dto.decision === 'REJECTED' || dto.decision === 'NEEDS_REPLACEMENT') {
      const caseStatus = dto.decision === 'REJECTED' ? 'Rejected' : 'Need More Docs';
      await this.prisma.customerVerificationRequest.update({
        where: { requestCode: verification.requestCode },
        data: {
          verificationStatus: caseStatus,
          rejectionReason: dto.reason?.trim(),
        },
      });
      await this.prisma.buyerRegistration.update({
        where: { id: BigInt(verification.registrationId) },
        data: {
          status: 'ACTION_REQUIRED',
          rejectionReason: dto.reason?.trim(),
        },
      });
    }

    return {
      document: {
        ...updatedDoc,
        id: updatedDoc.id.toString(),
        registrationId: updatedDoc.registrationId.toString(),
        fileSize: Number(updatedDoc.fileSize),
      },
      verificationStatus:
        dto.decision === 'APPROVED'
          ? verification.verificationStatus
          : dto.decision === 'REJECTED'
            ? 'Rejected'
            : 'Need More Docs',
    };
  }

  async updateClassification(idOrCode: string, classification: string, updatedBy = 'Platform Admin') {
    const valid = classification === 'SPECIAL_PARTY' ? 'SPECIAL_PARTY' : 'REGULAR';
    const record = await this.getVerification(idOrCode);
    const updated = await this.prisma.customerVerificationRequest.update({
      where: { requestCode: record.requestCode },
      data: {
        customerClassification: valid,
      },
      include: {
        registration: {
          include: { documents: true },
        },
      },
    });
    return this.formatRecord(updated);
  }

  private formatRecord(r: any) {
    const rawDocs = r.registration?.documents || [];
    const formattedDocs = rawDocs.map((d: any) => ({
      id: d.id.toString(),
      documentType: d.categoryDisplayName || d.category,
      category: d.category,
      fileName: d.fileName,
      fileSize: typeof d.fileSize === 'bigint' ? `${(Number(d.fileSize) / (1024 * 1024)).toFixed(1)} MB` : `${(Number(d.fileSize || 0) / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: d.createdAt ? d.createdAt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: d.status === 'VALID' ? 'Valid' : d.status === 'REJECTED' ? 'Invalid' : d.status === 'NEEDS_REPLACEMENT' ? 'Need Replacement' : 'Pending',
      rawStatus: d.status,
      rejectionReason: d.rejectionReason,
      reviewDecision: d.reviewDecision,
      reviewedBy: d.reviewedBy,
      notes: d.rejectionReason,
      url: `/api/v1/compliance/documents/${d.id}/download`,
      downloadUrl: `/api/v1/compliance/documents/${d.id}/download`,
    }));

    const userClean = r.user
      ? {
          id: r.user.id.toString(),
          userCode: r.user.userCode,
          username: r.user.username,
          email: r.user.email,
          fullName: r.user.fullName,
          phone: r.user.phone,
          companyName: r.user.companyName,
          accountStatus: r.user.accountStatus,
        }
      : null;

    return {
      ...r,
      id: r.id.toString(),
      registrationId: r.registrationId ? r.registrationId.toString() : null,
      userId: r.userId ? r.userId.toString() : null,
      user: userClean,
      registrationDate: r.createdAt ? r.createdAt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      documents: formattedDocs,
      companyName: r.companyName || r.registration?.companyName || r.user?.companyName || 'Unknown Entity',
      customerName: r.customerName || r.registration?.contactPerson || r.user?.fullName || r.contactPerson || 'Unknown Contact',
      contactPerson: r.contactPerson || r.registration?.contactPerson || r.user?.fullName || r.customerName || 'Unknown Contact',
      email: r.email || r.registration?.email || r.user?.email || '',
      mobileNumber: r.phone || r.mobileNumber || r.registration?.mobileNumber || r.user?.phone || '',
      businessType: r.registration?.businessType || 'Private Limited',
      gstNumber: r.gstNumber || r.registration?.gstNumber || '',
      panNumber: r.panNumber || r.registration?.panNumber || '',
      drugLicenseNumber: r.drugLicenseNumber || r.registration?.drugLicenseNumber || '',
      cinNumber: r.cinNumber || r.registration?.cinNumber || null,
      businessVerification: r.businessVerification || {
        status: 'Pending manual verification',
        gstActiveStatus: 'Pending Manual Review',
        panValidation: 'Pending Manual Review',
        companyRegistrationValidation: 'Pending Manual Review',
        cinValidation: r.cinNumber ? 'Pending Manual Review' : 'N/A',
      },
      regulatoryVerification: r.regulatoryVerification || {
        status: 'Pending manual verification',
        drugLicenseValidity: 'Pending Manual Review',
        licenseExpiryCheck: 'Pending Manual Review',
        stateRegulatoryAuthorityValidation: 'Pending Manual Review',
      },
      financialVerification: r.financialVerification || {
        status: 'Pending manual verification',
        bankVerification: 'Pending Manual Review',
        creditRating: 'Pending Assessment',
        riskClassification: 'UNDER_EVALUATION',
      },
      registration: r.registration
        ? {
            ...r.registration,
            id: r.registration.id.toString(),
            userId: r.registration.userId ? r.registration.userId.toString() : null,
            documents: formattedDocs,
          }
        : undefined,
    };
  }
}

