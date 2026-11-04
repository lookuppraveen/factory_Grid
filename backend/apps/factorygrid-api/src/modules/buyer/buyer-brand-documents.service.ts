import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '@factorygrid/auth';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { BuyerBrandDocumentDto } from './dto/brand-trademark-documents.dto';

const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

@Injectable()
export class BuyerBrandDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  toDto(doc: any): BuyerBrandDocumentDto {
    return {
      id: doc.id.toString(),
      userId: doc.userId.toString(),
      registrationId: doc.registrationId ? doc.registrationId.toString() : null,
      brandName: doc.brandName,
      brandReference: doc.brandReference,
      documentType: doc.documentType,
      documentNumber: doc.documentNumber,
      dosageForm: doc.dosageForm,
      tmRegistrationNo: doc.tmRegistrationNo,
      issueDate: doc.issueDate ? doc.issueDate.toISOString().split('T')[0] : null,
      expiryDate: doc.expiryDate ? doc.expiryDate.toISOString().split('T')[0] : null,
      fileName: doc.fileName,
      fileSize: Number(doc.fileSize),
      mimeType: doc.mimeType,
      status: doc.status,
      checks: (doc.checks as Record<string, string>) || null,
      rejectionReason: doc.rejectionReason,
      authNotes: doc.authNotes,
      reviewedBy: doc.reviewedBy,
      reviewedAt: doc.reviewedAt ? doc.reviewedAt.toISOString() : null,
      approvedAt: doc.approvedAt ? doc.approvedAt.toISOString().split('T')[0] : null,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  async listMyBrandDocuments(userId: number): Promise<BuyerBrandDocumentDto[]> {
    const docs = await this.prisma.buyerBrandDocument.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map(d => this.toDto(d));
  }

  async uploadBrandDocument(
    userId: number,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    fields: {
      brandName: string;
      brandReference?: string;
      documentType: string;
      documentNumber?: string;
      dosageForm?: string;
      tmRegistrationNo?: string;
      issueDate?: string;
      expiryDate?: string;
    },
  ): Promise<BuyerBrandDocumentDto> {
    if (!fields.brandName || !fields.brandName.trim()) {
      throw new BadRequestException('Brand name is required.');
    }
    if (!fields.documentType || !fields.documentType.trim()) {
      throw new BadRequestException('Document type is required.');
    }
    if (fileBuffer.length > MAX_DOC_BYTES) {
      throw new BadRequestException('File exceeds 10 MB limit.');
    }
    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      throw new BadRequestException(
        `Unsupported format ${mimeType}. Only PDF, PNG, JPG, and WebP are accepted.`,
      );
    }

    // Lookup user registration if available
    const reg = await this.prisma.buyerRegistration.findFirst({
      where: { userId: BigInt(userId) },
    });

    const sanitizedFileName = (fileName || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `brand-documents/${userId}/${Date.now()}_${sanitizedFileName}`;

    const uploaded = await this.storage.uploadFile(fileBuffer, storageKey, mimeType);

    const doc = await this.prisma.buyerBrandDocument.create({
      data: {
        userId: BigInt(userId),
        registrationId: reg ? reg.id : null,
        brandName: fields.brandName.trim(),
        brandReference: fields.brandReference ? fields.brandReference.trim() : null,
        documentType: fields.documentType.trim(),
        documentNumber: fields.documentNumber ? fields.documentNumber.trim() : null,
        dosageForm: fields.dosageForm ? fields.dosageForm.trim() : null,
        tmRegistrationNo: fields.tmRegistrationNo ? fields.tmRegistrationNo.trim() : null,
        issueDate: fields.issueDate ? new Date(fields.issueDate) : null,
        expiryDate: fields.expiryDate ? new Date(fields.expiryDate) : null,
        fileName: sanitizedFileName,
        fileSize: BigInt(uploaded.fileSize),
        mimeType: uploaded.mimeType,
        storageKey: uploaded.storageKey,
        storageBucket: uploaded.storageBucket,
        status: 'UNDER REVIEW',
        checks: {
          loaAuth: 'Pending',
          tmAgreement: 'Pending',
          formulaClearance: 'Pending',
          artworkCompliance: 'Pending',
        },
      },
    });

    return this.toDto(doc);
  }

  async updateBrandDocument(
    id: number,
    userId: number,
    fields: {
      brandName?: string;
      brandReference?: string;
      documentType?: string;
      documentNumber?: string;
      dosageForm?: string;
      tmRegistrationNo?: string;
      issueDate?: string;
      expiryDate?: string;
    },
    file?: { buffer: Buffer; fileName: string; mimeType: string },
  ): Promise<BuyerBrandDocumentDto> {
    const existing = await this.prisma.buyerBrandDocument.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(`Brand document ${id} not found.`);
    }
    if (existing.userId !== BigInt(userId)) {
      throw new ForbiddenException('You do not have permission to update this brand document.');
    }

    let fileData = {};
    if (file && file.buffer) {
      if (file.buffer.length > MAX_DOC_BYTES) {
        throw new BadRequestException('File exceeds 10 MB limit.');
      }
      if (!ALLOWED_MIME_TYPES.includes(file.mimeType.toLowerCase())) {
        throw new BadRequestException(
          `Unsupported format ${file.mimeType}. Only PDF, PNG, JPG, and WebP are accepted.`,
        );
      }
      const sanitizedFileName = (file.fileName || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
      const storageKey = `brand-documents/${userId}/${Date.now()}_${sanitizedFileName}`;
      const uploaded = await this.storage.uploadFile(file.buffer, storageKey, file.mimeType);
      fileData = {
        fileName: sanitizedFileName,
        fileSize: BigInt(uploaded.fileSize),
        mimeType: uploaded.mimeType,
        storageKey: uploaded.storageKey,
        storageBucket: uploaded.storageBucket,
      };
    }

    const updated = await this.prisma.buyerBrandDocument.update({
      where: { id: BigInt(id) },
      data: {
        ...(fields.brandName ? { brandName: fields.brandName.trim() } : {}),
        ...(fields.brandReference !== undefined ? { brandReference: fields.brandReference ? fields.brandReference.trim() : null } : {}),
        ...(fields.documentType ? { documentType: fields.documentType.trim() } : {}),
        ...(fields.documentNumber !== undefined ? { documentNumber: fields.documentNumber ? fields.documentNumber.trim() : null } : {}),
        ...(fields.dosageForm !== undefined ? { dosageForm: fields.dosageForm ? fields.dosageForm.trim() : null } : {}),
        ...(fields.tmRegistrationNo !== undefined ? { tmRegistrationNo: fields.tmRegistrationNo ? fields.tmRegistrationNo.trim() : null } : {}),
        ...(fields.issueDate !== undefined ? { issueDate: fields.issueDate ? new Date(fields.issueDate) : null } : {}),
        ...(fields.expiryDate !== undefined ? { expiryDate: fields.expiryDate ? new Date(fields.expiryDate) : null } : {}),
        ...fileData,
        // Reset status back to review if re-uploading
        status: 'UNDER REVIEW',
        rejectionReason: null,
        authNotes: null,
        checks: {
          loaAuth: 'Pending',
          tmAgreement: 'Pending',
          formulaClearance: 'Pending',
          artworkCompliance: 'Pending',
        },
      },
    });

    return this.toDto(updated);
  }

  async getBrandDocument(id: number, user: AuthUser) {
    const doc = await this.prisma.buyerBrandDocument.findUnique({
      where: { id: BigInt(id) },
    });
    if (!doc) {
      throw new NotFoundException(`Brand document ${id} not found.`);
    }

    const roles = user.roles || [];
    const isPrivileged = roles.some(r =>
      ['ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER'].includes(r.toUpperCase()),
    );
    if (!isPrivileged && doc.userId !== BigInt(user.id)) {
      throw new ForbiddenException('Access denied to this brand document.');
    }

    return doc;
  }
}
