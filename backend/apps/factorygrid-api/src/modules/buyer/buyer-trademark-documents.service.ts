import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '@factorygrid/auth';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { BuyerTrademarkDocumentDto } from './dto/brand-trademark-documents.dto';

const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

@Injectable()
export class BuyerTrademarkDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  toDto(doc: any): BuyerTrademarkDocumentDto {
    return {
      id: doc.id.toString(),
      userId: doc.userId.toString(),
      registrationId: doc.registrationId ? doc.registrationId.toString() : null,
      trademarkName: doc.trademarkName,
      tmNumber: doc.tmNumber,
      tmClass: doc.tmClass,
      documentType: doc.documentType,
      verificationSource: doc.verificationSource,
      issueDate: doc.issueDate ? doc.issueDate.toISOString().split('T')[0] : null,
      expiryDate: doc.expiryDate ? doc.expiryDate.toISOString().split('T')[0] : null,
      fileName: doc.fileName,
      fileSize: Number(doc.fileSize),
      mimeType: doc.mimeType,
      status: doc.status,
      checks: (doc.checks as Record<string, string>) || null,
      conflictNotes: doc.conflictNotes,
      rejectionReason: doc.rejectionReason,
      reviewedBy: doc.reviewedBy,
      reviewedAt: doc.reviewedAt ? doc.reviewedAt.toISOString() : null,
      approvedAt: doc.approvedAt ? doc.approvedAt.toISOString().split('T')[0] : null,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  async listMyTrademarkDocuments(userId: number): Promise<BuyerTrademarkDocumentDto[]> {
    const docs = await this.prisma.buyerTrademarkDocument.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map(d => this.toDto(d));
  }

  async uploadTrademarkDocument(
    userId: number,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    fields: {
      trademarkName: string;
      tmNumber: string;
      tmClass?: string;
      documentType: string;
      verificationSource?: string;
      issueDate?: string;
      expiryDate?: string;
    },
  ): Promise<BuyerTrademarkDocumentDto> {
    if (!fields.trademarkName || !fields.trademarkName.trim()) {
      throw new BadRequestException('Trademark name is required.');
    }
    if (!fields.tmNumber || !fields.tmNumber.trim()) {
      throw new BadRequestException('Trademark number / application number is required.');
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

    const reg = await this.prisma.buyerRegistration.findFirst({
      where: { userId: BigInt(userId) },
    });

    const sanitizedFileName = (fileName || 'certificate.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `trademark-documents/${userId}/${Date.now()}_${sanitizedFileName}`;

    const uploaded = await this.storage.uploadFile(fileBuffer, storageKey, mimeType);

    const doc = await this.prisma.buyerTrademarkDocument.create({
      data: {
        userId: BigInt(userId),
        registrationId: reg ? reg.id : null,
        trademarkName: fields.trademarkName.trim(),
        tmNumber: fields.tmNumber.trim(),
        tmClass: fields.tmClass && fields.tmClass.trim() ? fields.tmClass.trim() : 'Class 5 (Pharmaceuticals & Medicinal Preparations)',
        documentType: fields.documentType.trim(),
        verificationSource: fields.verificationSource && fields.verificationSource.trim() ? fields.verificationSource.trim() : 'Customer Uploaded TM Certificate',
        issueDate: fields.issueDate ? new Date(fields.issueDate) : null,
        expiryDate: fields.expiryDate ? new Date(fields.expiryDate) : null,
        fileName: sanitizedFileName,
        fileSize: BigInt(uploaded.fileSize),
        mimeType: uploaded.mimeType,
        storageKey: uploaded.storageKey,
        storageBucket: uploaded.storageBucket,
        status: 'UNDER REVIEW',
        checks: {
          existence: 'Pending',
          owner: 'Pending',
          status: 'Under Review',
          classMatch: 'Pending',
          validity: 'Pending',
        },
      },
    });

    return this.toDto(doc);
  }

  async updateTrademarkDocument(
    id: number,
    userId: number,
    fields: {
      trademarkName?: string;
      tmNumber?: string;
      tmClass?: string;
      documentType?: string;
      verificationSource?: string;
      issueDate?: string;
      expiryDate?: string;
    },
    file?: { buffer: Buffer; fileName: string; mimeType: string },
  ): Promise<BuyerTrademarkDocumentDto> {
    const existing = await this.prisma.buyerTrademarkDocument.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(`Trademark document ${id} not found.`);
    }
    if (existing.userId !== BigInt(userId)) {
      throw new ForbiddenException('You do not have permission to update this trademark document.');
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
      const sanitizedFileName = (file.fileName || 'certificate.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
      const storageKey = `trademark-documents/${userId}/${Date.now()}_${sanitizedFileName}`;
      const uploaded = await this.storage.uploadFile(file.buffer, storageKey, file.mimeType);
      fileData = {
        fileName: sanitizedFileName,
        fileSize: BigInt(uploaded.fileSize),
        mimeType: uploaded.mimeType,
        storageKey: uploaded.storageKey,
        storageBucket: uploaded.storageBucket,
      };
    }

    const updated = await this.prisma.buyerTrademarkDocument.update({
      where: { id: BigInt(id) },
      data: {
        ...(fields.trademarkName ? { trademarkName: fields.trademarkName.trim() } : {}),
        ...(fields.tmNumber ? { tmNumber: fields.tmNumber.trim() } : {}),
        ...(fields.tmClass ? { tmClass: fields.tmClass.trim() } : {}),
        ...(fields.documentType ? { documentType: fields.documentType.trim() } : {}),
        ...(fields.verificationSource ? { verificationSource: fields.verificationSource.trim() } : {}),
        ...(fields.issueDate !== undefined ? { issueDate: fields.issueDate ? new Date(fields.issueDate) : null } : {}),
        ...(fields.expiryDate !== undefined ? { expiryDate: fields.expiryDate ? new Date(fields.expiryDate) : null } : {}),
        ...fileData,
        // Reset status back to review if re-uploading
        status: 'UNDER REVIEW',
        conflictNotes: null,
        rejectionReason: null,
        checks: {
          existence: 'Pending',
          owner: 'Pending',
          status: 'Under Review',
          classMatch: 'Pending',
          validity: 'Pending',
        },
      },
    });

    return this.toDto(updated);
  }

  async getTrademarkDocument(id: number, user: AuthUser) {
    const doc = await this.prisma.buyerTrademarkDocument.findUnique({
      where: { id: BigInt(id) },
    });
    if (!doc) {
      throw new NotFoundException(`Trademark document ${id} not found.`);
    }

    const roles = user.roles || [];
    const isPrivileged = roles.some(r =>
      ['ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER'].includes(r.toUpperCase()),
    );
    if (!isPrivileged && doc.userId !== BigInt(user.id)) {
      throw new ForbiddenException('Access denied to this trademark document.');
    }

    return doc;
  }
}
