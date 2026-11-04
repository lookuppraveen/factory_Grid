import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { AuthUser } from '@factorygrid/auth';
import { ValidationException } from '@factorygrid/errors';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService, UploadResult } from '../storage/storage.service';
import {
  MANUFACTURER_DOCUMENT_CATEGORIES,
  ManufacturerReviewDocumentDto,
  ManufacturerStep1Dto,
  ManufacturerStep2Dto,
  ManufacturerStep3Dto,
  ManufacturerStep4Dto,
  ManufacturerStepResponseDto,
  ManufacturerSubmitDto,
  ManufacturerVerificationPatchDto,
  resolveManufacturerCategory,
} from './dto/manufacturer-registration.dto';
import {
  CreateAchievementDto,
  CreateGalleryEntryDto,
  FactoryGalleryEntryDto,
  ManufacturerAchievementDto,
  ReviewSubmissionDto,
  UpdateAchievementDto,
  UpdateGalleryEntryDto,
} from './dto/gallery-and-achievements.dto';

const BCRYPT_ROUNDS = 12;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const OPEN_DOC_STATUSES = ['REJECTED', 'NEEDS_REPLACEMENT'];

/** Verifies the bytes really look like the declared type, so a renamed .exe cannot pass as a PDF. */
function matchesSignature(buffer: Buffer, mime: string): boolean {
  if (mime === 'application/pdf') return buffer.subarray(0, 4).toString('latin1') === '%PDF';
  if (mime === 'image/png') return buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  return buffer[0] === 0xff && buffer[1] === 0xd8; // jpeg
}

function matchesGalleryImageSignature(buffer: Buffer, mime: string): boolean {
  if (mime === 'image/png') return buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  if (mime === 'image/jpeg' || mime === 'image/jpg') return buffer[0] === 0xff && buffer[1] === 0xd8;
  if (mime === 'image/webp') return buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP';
  return false;
}

function matchesCertSignature(buffer: Buffer, mime: string): boolean {
  if (mime === 'application/pdf') return buffer.subarray(0, 4).toString('latin1') === '%PDF';
  return matchesGalleryImageSignature(buffer, mime);
}

const todayIso = () => new Date().toISOString().slice(0, 10);

function parseIsoDate(value: string, field: string): Date {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException(`${field} must be a valid date (YYYY-MM-DD).`);
  }
  return parsed;
}

/** Issue date cannot be in the future; expiry must be after issue and not already past. */
function assertDateRules(issueDate: string, expiryDate: string, label: string): { issue: Date; expiry: Date } {
  const issue = parseIsoDate(issueDate, `${label} issueDate`);
  const expiry = parseIsoDate(expiryDate, `${label} expiryDate`);
  if (issueDate > todayIso()) {
    throw new BadRequestException(`${label}: issue date cannot be in the future.`);
  }
  if (expiryDate <= issueDate) {
    throw new BadRequestException(`${label}: expiry date must be after the issue date.`);
  }
  if (expiryDate < todayIso()) {
    throw new BadRequestException(`${label}: certificate has already expired.`);
  }
  return { issue, expiry };
}

@Injectable()
export class ManufacturerRegistrationService {
  private readonly logger = new Logger(ManufacturerRegistrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Unguessable code: it doubles as the capability token for the pre-login draft. */
  private generateCode(prefix: string): string {
    return `${prefix}-${randomBytes(8).toString('hex').toUpperCase()}`;
  }

  private isStaff(user?: AuthUser): boolean {
    return !!user && (user.roles.includes('ROLE_ADMIN') || user.roles.includes('ROLE_COMPLIANCE_OFFICER'));
  }

  /** Drafts are reachable by their secret code; once an account exists only the owner or staff may touch it. */
  private assertAccess(reg: { userId: bigint | null }, user?: AuthUser): void {
    if (reg.userId === null) return;
    if (this.isStaff(user)) return;
    if (!user) {
      throw new ForbiddenException('Please log in to access this registration.');
    }
    if (reg.userId !== BigInt(user.id)) {
      throw new ForbiddenException("Access to another manufacturer's registration is denied.");
    }
  }

  private async findByCode(code: string) {
    const reg = await this.prisma.manufacturerRegistration.findUnique({ where: { registrationCode: code } });
    if (!reg) {
      throw new NotFoundException(`Manufacturer registration ${code} not found.`);
    }
    return reg;
  }

  private async getEditableDraft(code: string) {
    const reg = await this.findByCode(code);
    if (reg.status !== 'DRAFT') {
      throw new ConflictException(`Registration ${code} has already been submitted.`);
    }
    return reg;
  }

  // ---------------------------------------------------------------- catalogue

  async listCatalog(search?: string) {
    const term = search?.trim();
    const products = await this.prisma.catalogProduct.findMany({
      where: {
        active: true,
        ...(term
          ? {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { genericName: { contains: term, mode: 'insensitive' } },
                { category: { contains: term, mode: 'insensitive' } },
                { productCode: { contains: term, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { productCode: 'asc' },
    });
    return products.map((p) => ({
      id: p.id,
      productCode: p.productCode,
      name: p.name,
      genericName: p.genericName,
      dosageForm: p.dosageForm,
      category: p.category,
      packSize: p.packSize,
    }));
  }

  async listCategoryHierarchy() {
    const categories = await this.prisma.category.findMany({
      where: { lifecycleStatus: 'ACTIVE' },
      orderBy: [{ productTypeId: 'asc' }, { category: 'asc' }, { displayOrder: 'asc' }],
    });

    // Also load active catalog products that are distinct from mirrored category records
    const existingCatIds = new Set(categories.map(c => c.id));
    const activeProducts = await this.prisma.catalogProduct.findMany({
      where: {
        lifecycleStatus: 'ACTIVE',
        id: { notIn: Array.from(existingCatIds) },
      },
      orderBy: [{ productCode: 'asc' }],
    });

    const treeMap = new Map<string, {
      category: string;
      productTypeId: string;
      subCategories: Map<string, {
        subCategory: string;
        items: Array<{
          id: string;
          categoryId: string;
          categoryCode: string;
          subSubCategory: string | null;
          name: string;
          description: string | null;
        }>;
      }>;
    }>();

    for (const cat of categories) {
      const catName = cat.category.trim();
      if (!treeMap.has(catName)) {
        treeMap.set(catName, {
          category: catName,
          productTypeId: cat.productTypeId,
          subCategories: new Map(),
        });
      }
      const catNode = treeMap.get(catName)!;
      const subName = (cat.subCategory || 'General').trim();
      if (!catNode.subCategories.has(subName)) {
        catNode.subCategories.set(subName, {
          subCategory: subName,
          items: [],
        });
      }
      catNode.subCategories.get(subName)!.items.push({
        id: cat.id,
        categoryId: cat.categoryId,
        categoryCode: cat.categoryCode,
        subSubCategory: cat.subSubCategory || null,
        name: cat.subSubCategory || cat.subCategory || cat.category,
        description: cat.description,
      });
    }

    // Merge active catalog products into hierarchy under their respective category & sub-category
    const productCategoryItems = activeProducts.map((p) => {
      const catName = (p.category || 'Drugs').trim();
      const subName = (p.subCategory || 'General').trim();
      const prodTypeId = p.productTypeId || 'pt_med';

      if (!treeMap.has(catName)) {
        treeMap.set(catName, {
          category: catName,
          productTypeId: prodTypeId,
          subCategories: new Map(),
        });
      }
      const catNode = treeMap.get(catName)!;
      if (!catNode.subCategories.has(subName)) {
        catNode.subCategories.set(subName, {
          subCategory: subName,
          items: [],
        });
      }

      catNode.subCategories.get(subName)!.items.push({
        id: p.id,
        categoryId: p.categoryId || p.id,
        categoryCode: p.productCode,
        subSubCategory: p.subSubCategory || p.name,
        name: `${p.name} (${p.productCode})`,
        description: p.description || p.genericName || null,
      });

      return {
        id: p.id,
        categoryId: p.categoryId || p.id,
        productTypeId: prodTypeId,
        category: catName,
        subCategory: subName,
        subSubCategory: p.subSubCategory || p.name,
        categoryCode: p.productCode,
        description: p.description || p.genericName || null,
        name: `${p.name} (${p.productCode})`,
        fullName: [catName, subName, p.name].filter(Boolean).join(' → '),
      };
    });

    const tree = Array.from(treeMap.values()).map(cat => ({
      category: cat.category,
      productTypeId: cat.productTypeId,
      subCategories: Array.from(cat.subCategories.values()).map(sub => ({
        subCategory: sub.subCategory,
        items: sub.items,
      })),
    }));

    const allCategoryItems = [
      ...categories.map(c => ({
        id: c.id,
        categoryId: c.categoryId,
        productTypeId: c.productTypeId,
        category: c.category,
        subCategory: c.subCategory,
        subSubCategory: c.subSubCategory,
        categoryCode: c.categoryCode,
        description: c.description,
        name: c.subSubCategory || c.subCategory || c.category,
        fullName: [c.category, c.subCategory, c.subSubCategory].filter(Boolean).join(' → '),
      })),
      ...productCategoryItems,
    ];

    return {
      categories: allCategoryItems,
      tree,
    };
  }

  // ------------------------------------------------------------------- step 1

  async saveStep1(dto: ManufacturerStep1Dto, existingCode?: string): Promise<ManufacturerStepResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const data = {
      companyName: dto.companyName.trim(),
      facilityAddress: dto.facilityAddress.trim(),
      city: dto.city.trim(),
      state: dto.state.trim(),
      pincode: dto.pincode.trim(),
      mfgCapacity: (dto.mfgCapacity || '').trim(),
      contactPerson: dto.contactPerson.trim(),
      designation: dto.designation.trim(),
      email,
      phone: dto.phone.trim(),
    };

    let reg;
    if (existingCode) {
      const draft = await this.getEditableDraft(existingCode);
      reg = await this.prisma.manufacturerRegistration.update({
        where: { id: draft.id },
        data: { ...data, currentStep: Math.max(draft.currentStep, 1) },
      });
    } else {
      if (await this.prisma.user.findUnique({ where: { email } })) {
        throw new ConflictException('An account with this email already exists.');
      }
      reg = await this.prisma.manufacturerRegistration.create({
        data: { ...data, registrationCode: this.generateCode('REG-MFG'), currentStep: 1, status: 'DRAFT' },
      });
    }
    return {
      success: true,
      message: 'Company details saved successfully',
      registrationCode: reg.registrationCode,
      currentStep: 1,
    };
  }

  // ------------------------------------------------------------------- step 2

  async uploadDocument(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    categoryRaw: string,
    registrationCode: string | undefined,
    issueDate: string | undefined,
    expiryDate: string | undefined,
    caller?: AuthUser,
    documentNumber?: string,
  ) {
    if (!registrationCode) throw new BadRequestException('registrationCode is required.');
    const category = resolveManufacturerCategory(categoryRaw);
    if (!category) {
      throw new BadRequestException(
        `Invalid document category "${categoryRaw}". Must be one of: ${MANUFACTURER_DOCUMENT_CATEGORIES.map((c) => c.key).join(', ')}`,
      );
    }
    if (!buffer.length) throw new BadRequestException('Uploaded file is empty.');
    if (buffer.length > MAX_FILE_SIZE) throw new BadRequestException('File size exceeds maximum allowed limit of 10 MB.');
    const mime = (mimeType || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mime)) {
      throw new BadRequestException(`Invalid file format "${mimeType}". Only PDF, PNG, and JPEG formats are permitted.`);
    }
    if (!matchesSignature(buffer, mime)) {
      throw new BadRequestException('File content does not match its declared type.');
    }
    let issue: Date | null = null;
    let expiry: Date | null = null;
    if (issueDate && expiryDate) {
      const parsed = assertDateRules(issueDate, expiryDate, category.name);
      issue = parsed.issue;
      expiry = parsed.expiry;
    }

    const reg = await this.findByCode(registrationCode);
    this.assertAccess(reg, caller);

    const safeName = (fileName || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `documents/manufacturer/${reg.registrationCode}/${Date.now()}_${safeName}`;

    // Store the object first: no metadata row exists unless the file was really stored.
    const stored = await this.storage.uploadFile(buffer, storageKey, mime);

    const doc = await this.prisma.$transaction(async (tx) => {
      const isOther = category.key === 'otherCert';
      const previous = isOther
        ? []
        : await tx.manufacturerDocument.findMany({
            where: { registrationId: reg.id, category: category.key },
            orderBy: { version: 'desc' },
          });
      if (reg.status === 'DRAFT' && previous.length > 0) {
        const existing = previous[0];
        if (existing.storageKey && existing.storageKey !== stored.storageKey) {
          this.storage.deleteFile(existing.storageKey).catch((e) => {
            this.logger.warn(`Failed to delete replaced storage object: ${e?.message}`);
          });
        }
        const updated = await tx.manufacturerDocument.update({
          where: { id: existing.id },
          data: {
            categoryDisplayName: category.name,
            documentNumber: documentNumber?.trim() || existing.documentNumber || null,
            fileName: safeName,
            fileSize: BigInt(stored.fileSize),
            mimeType: stored.mimeType,
            storageKey: stored.storageKey,
            storageBucket: stored.storageBucket,
            issueDate: issue !== null ? issue : existing.issueDate,
            expiryDate: expiry !== null ? expiry : existing.expiryDate,
            status: 'PENDING',
            rejectionReason: null,
            adminRemarks: null,
            reviewedBy: null,
            reviewedAt: null,
            reviewDecision: null,
            version: existing.version + 1,
            updatedAt: new Date(),
          },
        });
        await tx.manufacturerRegistration.update({
          where: { id: reg.id },
          data: { currentStep: Math.max(reg.currentStep, 2) },
        });
        return updated;
      }

      const nextVersion = previous.length ? previous[0].version + 1 : 1;
      if (previous.length) {
        await tx.manufacturerDocument.updateMany({
          where: { registrationId: reg.id, category: category.key, status: { not: 'SUPERSEDED' } },
          data: { status: 'SUPERSEDED' },
        });
      }
      const created = await tx.manufacturerDocument.create({
        data: {
          registrationId: reg.id,
          category: category.key,
          categoryDisplayName: category.name,
          documentNumber: documentNumber?.trim() || null,
          fileName: safeName,
          fileSize: BigInt(stored.fileSize),
          mimeType: stored.mimeType,
          storageKey: stored.storageKey,
          storageBucket: stored.storageBucket,
          issueDate: issue,
          expiryDate: expiry,
          status: 'PENDING',
          version: nextVersion,
        },
      });

      if (reg.status === 'DRAFT') {
        await tx.manufacturerRegistration.update({
          where: { id: reg.id },
          data: { currentStep: Math.max(reg.currentStep, 2) },
        });
      } else if (reg.status === 'ACTION_REQUIRED') {
        // Return to review only once no rejected / replacement-requested document remains open.
        const open = await tx.manufacturerDocument.count({
          where: { registrationId: reg.id, status: { in: OPEN_DOC_STATUSES } },
        });
        if (open === 0) {
          await tx.manufacturerRegistration.update({
            where: { id: reg.id },
            data: { status: 'SUBMITTED', rejectionReason: null },
          });
        }
      }
      return created;
    });
    return this.toDocumentDto(doc);
  }

  async removeDocument(documentId: string, caller?: AuthUser): Promise<{ success: boolean; message: string }> {
    const id = this.parseId(documentId);
    const doc = await this.prisma.manufacturerDocument.findUnique({ where: { id }, include: { registration: true } });
    if (!doc) throw new NotFoundException(`Document ${documentId} not found.`);
    this.assertAccess(doc.registration, caller);
    if (doc.registration.status !== 'DRAFT') {
      throw new ConflictException('Documents of a submitted registration can only be replaced, not removed.');
    }
    if (doc.storageKey) {
      this.storage.deleteFile(doc.storageKey).catch((e) => {
        this.logger.warn(`Failed to delete removed storage object: ${e?.message}`);
      });
    }
    await this.prisma.manufacturerDocument.delete({ where: { id } });
    return { success: true, message: 'Document removed' };
  }

  async saveStep2(dto: ManufacturerStep2Dto, code: string): Promise<ManufacturerStepResponseDto> {
    const reg = await this.getEditableDraft(code);
    const seen = new Set<string>();
    const updates: { id: bigint; issue?: Date; expiry?: Date; documentNumber?: string }[] = [];
    if (dto.documents && dto.documents.length) {
      for (const item of dto.documents) {
        const category = resolveManufacturerCategory(item.category);
        if (!category) throw new BadRequestException(`Invalid document category "${item.category}".`);
        if (seen.has(category.key)) throw new BadRequestException(`Duplicate entry for ${category.name}.`);
        seen.add(category.key);
        let issue: Date | undefined;
        let expiry: Date | undefined;
        if (item.issueDate && item.expiryDate) {
          const parsed = assertDateRules(item.issueDate, item.expiryDate, category.name);
          issue = parsed.issue;
          expiry = parsed.expiry;
        }
        const doc = await this.prisma.manufacturerDocument.findFirst({
          where: { registrationId: reg.id, category: category.key, status: { not: 'SUPERSEDED' } },
        });
        if (doc) {
          updates.push({ id: doc.id, issue, expiry, documentNumber: item.documentNumber });
        }
      }
    }
    await this.prisma.$transaction([
      ...updates.map((u) =>
        this.prisma.manufacturerDocument.update({
          where: { id: u.id },
          data: {
            ...(u.issue !== undefined ? { issueDate: u.issue } : {}),
            ...(u.expiry !== undefined ? { expiryDate: u.expiry } : {}),
            ...(u.documentNumber !== undefined ? { documentNumber: u.documentNumber.trim() || null } : {}),
          },
        }),
      ),
      this.prisma.manufacturerRegistration.update({
        where: { id: reg.id },
        data: {
          currentStep: Math.max(reg.currentStep, 2),
          ...(dto.whoGmpApplicable !== undefined ? { whoGmpApplicable: dto.whoGmpApplicable } : {}),
        },
      }),
    ]);
    return { success: true, message: 'Certifications saved successfully', registrationCode: code, currentStep: 2 };
  }

  // ------------------------------------------------------------------- step 3

  async saveStep3(dto: ManufacturerStep3Dto, code: string): Promise<ManufacturerStepResponseDto> {
    const reg = await this.getEditableDraft(code);
    const ids = dto.categoryIds || dto.productIds || [];
    if (!ids.length) {
      throw new BadRequestException('At least one manufacturing category or product capability must be selected.');
    }
    const found = await this.prisma.catalogProduct.findMany({ where: { id: { in: ids }, active: true }, select: { id: true } });
    const foundIds = new Set(found.map((p) => p.id));
    const unknown = ids.filter((id) => !foundIds.has(id));
    if (unknown.length) {
      throw new BadRequestException(`Unknown category or product IDs: ${unknown.join(', ')}`);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.manufacturerProduct.deleteMany({ where: { registrationId: reg.id, productId: { notIn: ids } } });
      const existing = await tx.manufacturerProduct.findMany({ where: { registrationId: reg.id }, select: { productId: true } });
      const have = new Set(existing.map((e) => e.productId));
      const toCreate = ids.filter((id) => !have.has(id));
      if (toCreate.length) {
        await tx.manufacturerProduct.createMany({
          data: toCreate.map((productId) => ({ registrationId: reg.id, productId })),
          skipDuplicates: true,
        });
      }
      await tx.manufacturerRegistration.update({
        where: { id: reg.id },
        data: { currentStep: Math.max(reg.currentStep, 3) },
      });
    });
    return { success: true, message: 'Category capabilities saved successfully', registrationCode: code, currentStep: 3 };
  }

  // ------------------------------------------------------------------- step 4

  async saveStep4(dto: ManufacturerStep4Dto, code: string): Promise<ManufacturerStepResponseDto> {
    const reg = await this.getEditableDraft(code);
    const selected = await this.prisma.manufacturerProduct.findMany({ where: { registrationId: reg.id } });
    const selectedIds = new Set(selected.map((s) => s.productId));
    const seen = new Set<string>();
    const normalizedItems: Array<{ id: string; moq: number; leadTimeDays: number }> = [];

    for (const item of dto.items) {
      const id = item.categoryId || item.productId;
      if (!id) {
        throw new BadRequestException('categoryId or productId is required for each capability item.');
      }
      if (!selectedIds.has(id)) {
        throw new BadRequestException(`Category ${id} is not part of this manufacturer's selected capabilities.`);
      }
      if (seen.has(id)) {
        throw new BadRequestException(`Duplicate entry for category ${id}.`);
      }
      seen.add(id);

      const batchSize = item.batchSize ?? item.moq;
      if (!batchSize || batchSize < 1) {
        throw new BadRequestException(`Batch Size is required and must be at least 1 for category ${id}.`);
      }
      const deliveryDays = item.deliveryScheduleDays ?? item.leadTimeDays;
      if (!deliveryDays || deliveryDays < 1) {
        throw new BadRequestException(`Delivery Schedule in days is required and must be at least 1 for category ${id}.`);
      }
      normalizedItems.push({ id, moq: batchSize, leadTimeDays: deliveryDays });
    }

    await this.prisma.$transaction([
      ...normalizedItems.map((item) =>
        this.prisma.manufacturerProduct.update({
          where: { registrationId_productId: { registrationId: reg.id, productId: item.id } },
          data: { moq: item.moq, leadTimeDays: item.leadTimeDays },
        }),
      ),
      this.prisma.manufacturerRegistration.update({
        where: { id: reg.id },
        data: { currentStep: Math.max(reg.currentStep, 4) },
      }),
    ]);
    return { success: true, message: 'Batch size and delivery schedule saved successfully', registrationCode: code, currentStep: 4 };
  }

  // ----------------------------------------------------------- read / review

  private parseId(raw: string): bigint {
    if (!/^\d+$/.test(raw)) throw new BadRequestException(`Invalid id "${raw}".`);
    return BigInt(raw);
  }

  private toDocumentDto(d: any) {
    const remarks = d.adminRemarks ?? d.rejectionReason ?? null;
    const reviewer = d.reviewedBy ?? null;
    const reviewedTime = d.reviewedAt ? (d.reviewedAt instanceof Date ? d.reviewedAt.toISOString() : String(d.reviewedAt)) : null;
    return {
      id: d.id.toString(),
      documentId: d.id.toString(),
      document_id: d.id.toString(),
      manufacturerId: d.registrationId.toString(),
      manufacturer_id: d.registrationId.toString(),
      documentCode: `DOC-${d.id}`,
      documentNumber: d.documentNumber ?? null,
      category: d.category,
      documentType: d.category,
      document_type: d.category,
      categoryDisplayName: d.categoryDisplayName,
      documentName: d.categoryDisplayName,
      fileName: d.fileName,
      file_name: d.fileName,
      originalFileName: d.fileName,
      original_file_name: d.fileName,
      fileSize: Number(d.fileSize),
      file_size: Number(d.fileSize),
      mimeType: d.mimeType,
      mime_type: d.mimeType,
      contentType: d.mimeType,
      content_type: d.mimeType,
      storageKey: d.storageKey,
      storage_key: d.storageKey,
      fileReference: d.storageKey,
      file_reference: d.storageKey,
      issueDate: d.issueDate ? (d.issueDate instanceof Date ? d.issueDate.toISOString().slice(0, 10) : String(d.issueDate).slice(0, 10)) : '',
      expiryDate: d.expiryDate ? (d.expiryDate instanceof Date ? d.expiryDate.toISOString().slice(0, 10) : String(d.expiryDate).slice(0, 10)) : '',
      status: d.status,
      verificationStatus: d.status,
      verification_status: d.status,
      rejectionReason: remarks,
      adminRemarks: remarks,
      admin_remarks: remarks,
      reviewedBy: reviewer,
      verifiedBy: reviewer,
      verified_by: reviewer,
      reviewedAt: reviewedTime,
      verifiedAt: reviewedTime,
      verified_at: reviewedTime,
      reviewDecision: d.reviewDecision ?? null,
      version: d.version,
      uploadedAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
      uploaded_at: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
      downloadUrl: `/api/v1/manufacturer/documents/${d.id}/download`,
    };
  }

  toGalleryDto(entry: any, regCode: string): FactoryGalleryEntryDto {
    return {
      id: entry.id.toString(),
      registrationCode: regCode,
      title: entry.title,
      description: entry.description ?? null,
      fileName: entry.fileName,
      fileSize: Number(entry.fileSize),
      mimeType: entry.mimeType,
      storageKey: entry.storageKey,
      imageUrl: `/api/v1/manufacturer/gallery/${entry.id}/image`,
      captureDate: entry.captureDate ? entry.captureDate.toISOString().slice(0, 10) : null,
      factoryLocation: entry.factoryLocation,
      gpsCoordinates: entry.gpsCoordinates ?? null,
      uploadedBy: entry.uploadedBy,
      verificationStatus: entry.verificationStatus,
      reviewedBy: entry.reviewedBy ?? null,
      reviewedAt: entry.reviewedAt ? entry.reviewedAt.toISOString() : null,
      rejectionReason: entry.rejectionReason ?? null,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    };
  }

  toAchievementDto(ach: any, regCode: string): ManufacturerAchievementDto {
    return {
      id: ach.id.toString(),
      registrationCode: regCode,
      title: ach.title,
      awardType: ach.awardType,
      issuingOrganization: ach.issuingOrganization,
      issueDate: ach.issueDate.toISOString().slice(0, 10),
      expiryDate: ach.expiryDate ? ach.expiryDate.toISOString().slice(0, 10) : null,
      description: ach.description ?? null,
      hasCertificate: !!ach.certificateStorageKey,
      certificateFileName: ach.certificateFileName ?? null,
      certificateFileSize: ach.certificateFileSize ? Number(ach.certificateFileSize) : null,
      certificateMimeType: ach.certificateMimeType ?? null,
      certificateUrl: ach.certificateStorageKey ? `/api/v1/manufacturer/achievements/${ach.id}/certificate` : null,
      verificationStatus: ach.verificationStatus,
      reviewedBy: ach.reviewedBy ?? null,
      reviewedAt: ach.reviewedAt ? ach.reviewedAt.toISOString() : null,
      rejectionReason: ach.rejectionReason ?? null,
      createdAt: ach.createdAt.toISOString(),
      updatedAt: ach.updatedAt.toISOString(),
    };
  }

  private async buildView(regId: bigint) {
    const reg = await this.prisma.manufacturerRegistration.findUniqueOrThrow({
      where: { id: regId },
      include: {
        documents: { where: { status: { not: 'SUPERSEDED' } }, orderBy: { id: 'asc' } },
        products: { include: { product: true }, orderBy: { id: 'asc' } },
        galleryEntries: { orderBy: { id: 'desc' } },
        achievements: { orderBy: { id: 'desc' } },
      },
    });
    return {
      registrationCode: reg.registrationCode,
      status: reg.status,
      currentStep: reg.currentStep,
      submittedAt: reg.submittedAt?.toISOString() ?? null,
      reviewedAt: reg.reviewedAt?.toISOString() ?? null,
      reviewedBy: reg.reviewedBy ?? null,
      rejectionReason: reg.rejectionReason ?? null,
      manufacturerCode: reg.manufacturerCode ?? null,
      whoGmpApplicable: (reg as any).whoGmpApplicable !== false,
      company: {
        companyName: reg.companyName,
        facilityAddress: reg.facilityAddress,
        city: reg.city,
        state: reg.state,
        pincode: reg.pincode,
        mfgCapacity: reg.mfgCapacity,
        plantCapacity: reg.mfgCapacity,
        contactPerson: reg.contactPerson,
        designation: reg.designation,
        email: reg.email,
        phone: reg.phone,
      },
      documents: reg.documents.map((d) => this.toDocumentDto(d)),
      products: await (async () => {
        const catMap = new Map((await this.prisma.category.findMany()).map((c) => [c.id, c]));
        return reg.products.map((p) => {
          const matched = catMap.get(p.productId) || catMap.get(p.product.productCode);
          const fullName = matched
            ? [matched.category, matched.subCategory, matched.subSubCategory].filter(Boolean).join(' → ')
            : p.product.name;
          return {
            productId: p.productId,
            categoryId: p.productId,
            productCode: p.product.productCode,
            name: p.product.name,
            categoryName: p.product.name,
            genericName: p.product.genericName,
            dosageForm: p.product.dosageForm,
            category: matched?.category || p.product.category,
            subCategory: matched?.subCategory || null,
            subSubCategory: matched?.subSubCategory || null,
            fullName,
            packSize: p.product.packSize,
            moq: p.moq,
            batchSize: p.moq,
            leadTimeDays: p.leadTimeDays,
            deliveryScheduleDays: p.leadTimeDays,
          };
        });
      })(),
      gallery: reg.galleryEntries.map((g) => this.toGalleryDto(g, reg.registrationCode)),
      achievements: reg.achievements.map((a) => this.toAchievementDto(a, reg.registrationCode)),
    };
  }

  async getRegistration(code: string, caller?: AuthUser) {
    const reg = await this.findByCode(code);
    this.assertAccess(reg, caller);
    return this.buildView(reg.id);
  }

  async getMyRegistration(userId: number) {
    const reg = await this.prisma.manufacturerRegistration.findFirst({
      where: { userId: BigInt(userId) },
      orderBy: { id: 'desc' },
    });
    if (!reg) throw new NotFoundException('No manufacturer registration found for this account.');
    return this.buildView(reg.id);
  }

  async getDocuments(code: string, caller?: AuthUser) {
    return (await this.getRegistration(code, caller)).documents;
  }

  async getDocumentForDownload(documentId: string, caller?: AuthUser, registrationCode?: string) {
    const doc = await this.prisma.manufacturerDocument.findUnique({
      where: { id: this.parseId(documentId) },
      include: { registration: true },
    });
    if (!doc) throw new NotFoundException(`Document ${documentId} not found.`);
    // If explicit registrationCode is provided matching the document's registration, allow access
    const isMatchingDraftCode = registrationCode && doc.registration.registrationCode === registrationCode;
    if (!isMatchingDraftCode) {
      if (doc.registration.userId === null) {
        if (!this.isStaff(caller)) throw new ForbiddenException('Documents are private until the registration is submitted.');
      } else {
        this.assertAccess(doc.registration, caller);
      }
    }
    const file = await this.storage.getFile(doc.storageKey);
    return {
      ...file,
      fileName: doc.fileName,
      mimeType: doc.mimeType || file.contentType || 'application/pdf',
    };
  }

  // ------------------------------------------------------------------- submit

  async submit(dto: ManufacturerSubmitDto) {
    if (dto.confirmAccurate !== true) {
      throw new ValidationException({ confirmAccurate: 'You must confirm that the information and documents are accurate.' });
    }
    const reg = await this.findByCode(dto.registrationCode);
    if (reg.status !== 'DRAFT') {
      throw new ConflictException(`Registration ${reg.registrationCode} has already been submitted.`);
    }

    const [docs, products] = await Promise.all([
      this.prisma.manufacturerDocument.findMany({ where: { registrationId: reg.id, status: { not: 'SUPERSEDED' } } }),
      this.prisma.manufacturerProduct.findMany({ where: { registrationId: reg.id } }),
    ]);
    const errors: Record<string, string> = {};
    const mandatoryCategories = MANUFACTURER_DOCUMENT_CATEGORIES.filter((c) => (c as any).isMandatory && c.key !== 'whoGmpCert');
    for (const c of mandatoryCategories) {
      const doc = docs.find((d) => d.category === c.key);
      if (!doc) errors[`documents.${c.key}`] = `${c.name} has not been uploaded.`;
      else if (doc.expiryDate && doc.expiryDate.toISOString().slice(0, 10) < todayIso()) errors[`documents.${c.key}`] = `${c.name} has expired.`;
    }

    // Dynamic WHO-GMP compliance validation:
    const isWhoGmpApplicable = dto.whoGmpApplicable !== undefined ? dto.whoGmpApplicable : ((reg as any).whoGmpApplicable !== false);
    const whoGmpDoc = docs.find((d) => d.category === 'whoGmpCert');
    if (isWhoGmpApplicable) {
      if (!whoGmpDoc) {
        errors['documents.whoGmpCert'] = 'WHO-GMP Certificate has not been uploaded.';
      } else if (whoGmpDoc.expiryDate && whoGmpDoc.expiryDate.toISOString().slice(0, 10) < todayIso()) {
        errors['documents.whoGmpCert'] = 'WHO-GMP Certificate has expired.';
      }
    } else if (whoGmpDoc && whoGmpDoc.expiryDate && whoGmpDoc.expiryDate.toISOString().slice(0, 10) < todayIso()) {
      errors['documents.whoGmpCert'] = 'WHO-GMP Certificate has expired.';
    }

    // Also validate expiry date on any uploaded optional documents
    for (const d of docs) {
      if (d.category !== 'whoGmpCert' && !mandatoryCategories.some(c => c.key === d.category)) {
        if (d.expiryDate && d.expiryDate.toISOString().slice(0, 10) < todayIso()) {
          errors[`documents.${d.category}`] = `${d.categoryDisplayName || d.category} has expired.`;
        }
      }
    }
    if (!products.length) errors.products = 'Select at least one manufacturing category capability.';
    for (const p of products) {
      if (!p.moq || p.moq < 1) errors[`products.${p.productId}.batchSize`] = `Batch Size is required for category ${p.productId}.`;
      if (!p.leadTimeDays || p.leadTimeDays < 1) {
        errors[`products.${p.productId}.deliveryScheduleDays`] = `Delivery Schedule is required for category ${p.productId}.`;
      }
    }
    if (Object.keys(errors).length) throw new ValidationException(errors);

    const email = reg.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('An account with this email already exists.');

    const roles = await this.prisma.role.findMany({ where: { name: { in: ['ROLE_MANUFACTURER', 'ROLE_SUPPLIER'] } } });
    if (roles.length !== 2) throw new BadRequestException('Manufacturer roles are not configured on the server.');

    let username = email.slice(0, 100);
    if (await this.prisma.user.findUnique({ where: { username } })) {
      username = `${email.slice(0, 90)}_${randomBytes(3).toString('hex')}`;
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      await this.prisma.$transaction(async (tx) => {
        // Re-check inside the transaction so concurrent retries cannot submit twice.
        const claimed = await tx.manufacturerRegistration.updateMany({
          where: { id: reg.id, status: 'DRAFT' },
          data: { status: 'SUBMITTED' },
        });
        if (claimed.count !== 1) throw new ConflictException('Registration has already been submitted.');
        const user = await tx.user.create({
          data: {
            userCode: `USR-M-${randomBytes(4).toString('hex').toUpperCase()}`,
            username,
            email,
            passwordHash,
            fullName: reg.contactPerson,
            phone: reg.phone,
            companyName: reg.companyName,
            companyCode: `CMP-${randomBytes(3).toString('hex').toUpperCase()}`,
            department: 'Manufacturing',
            jobTitle: reg.designation,
            accountStatus: 'INACTIVE',
            roles: { create: roles.map((r) => ({ roleId: r.id })) },
          },
        });
        await tx.manufacturerRegistration.update({
          where: { id: reg.id },
          data: {
            userId: user.id,
            currentStep: 5,
            submittedAt: new Date(),
            whoGmpApplicable: isWhoGmpApplicable,
          },
        });
      });
    } catch (err: any) {
      if (err?.code === 'P2002') throw new ConflictException('An account with this email already exists.');
      throw err;
    }
    return { success: true, message: 'Manufacturer registration submitted for compliance review', ...(await this.buildView(reg.id)) };
  }

  // ------------------------------------------------------- admin / compliance

  async listForReview(status?: string, search?: string) {
    const term = search?.trim();
    const regs = await this.prisma.manufacturerRegistration.findMany({
      where: {
        status: status && status !== 'ALL' ? status : { not: 'DRAFT' },
        ...(term
          ? {
              OR: [
                { companyName: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
                { registrationCode: { contains: term, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { documents: { where: { status: { not: 'SUPERSEDED' } } } },
      orderBy: { id: 'desc' },
    });
    return regs.map((r) => ({
      registrationCode: r.registrationCode,
      companyName: r.companyName,
      city: r.city,
      state: r.state,
      contactPerson: r.contactPerson,
      email: r.email,
      status: r.status,
      submittedAt: r.submittedAt?.toISOString() ?? null,
      manufacturerCode: r.manufacturerCode ?? null,
      documentsTotal: r.documents.length,
      documentsApproved: r.documents.filter((d) => d.status === 'VALID').length,
      documentsOpen: r.documents.filter((d) => OPEN_DOC_STATUSES.includes(d.status)).length,
    }));
  }

  async getForReview(code: string) {
    const reg = await this.findByCode(code);
    if (reg.status === 'DRAFT') throw new NotFoundException(`Manufacturer registration ${code} has not been submitted.`);
    return this.buildView(reg.id);
  }

  async reviewDocument(code: string, documentId: string, dto: ManufacturerReviewDocumentDto, reviewer: string) {
    if ((dto.decision === 'REJECTED' || dto.decision === 'NEEDS_REPLACEMENT') && !dto.reason?.trim()) {
      throw new BadRequestException('A reason is required when a document is rejected or replacement is requested.');
    }
    const reg = await this.findByCode(code);
    if (reg.status === 'DRAFT') throw new ConflictException('Registration has not been submitted yet.');
    const doc = await this.prisma.manufacturerDocument.findFirst({
      where: { id: this.parseId(documentId), registrationId: reg.id },
    });
    if (!doc) throw new NotFoundException(`Document ${documentId} not found for this registration.`);
    if (doc.status === 'SUPERSEDED') throw new ConflictException('This document version has been superseded by a newer upload.');

    const status = dto.decision === 'APPROVED' ? 'VALID' : dto.decision;
    const updated = await this.prisma.$transaction(async (tx) => {
      const d = await tx.manufacturerDocument.update({
        where: { id: doc.id },
        data: {
          status,
          reviewDecision: dto.decision,
          rejectionReason: dto.decision === 'APPROVED' ? null : dto.reason!.trim(),
          adminRemarks: dto.decision === 'APPROVED' ? null : dto.reason!.trim(),
          reviewedBy: reviewer,
          reviewedAt: new Date(),
        },
      });
      if (dto.decision !== 'APPROVED' && reg.status !== 'APPROVED') {
        await tx.manufacturerRegistration.update({
          where: { id: reg.id },
          data: { status: 'ACTION_REQUIRED', rejectionReason: dto.reason!.trim() },
        });
      }
      return d;
    });
    return { document: this.toDocumentDto(updated), registrationStatus: dto.decision === 'APPROVED' ? reg.status : 'ACTION_REQUIRED' };
  }

  async approve(code: string, reviewer: string) {
    const reg = await this.findByCode(code);
    if (reg.status === 'APPROVED') throw new ConflictException('Registration is already approved.');
    const approvableStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED'];
    if (!approvableStatuses.includes(reg.status)) {
      throw new BadRequestException(`Registration cannot be approved while its status is ${reg.status}.`);
    }
    const docs = await this.prisma.manufacturerDocument.findMany({
      where: { registrationId: reg.id, status: { not: 'SUPERSEDED' } },
    });
    const mandatoryCategories = MANUFACTURER_DOCUMENT_CATEGORIES.filter((c) => (c as any).isMandatory);
    const notApproved = mandatoryCategories.filter(
      (c) => docs.find((d) => d.category === c.key)?.status !== 'VALID',
    ).map((c) => c.name);
    if (notApproved.length) {
      throw new BadRequestException(`All mandatory certifications must be approved first. Pending: ${notApproved.join(', ')}.`);
    }
    if (reg.whoGmpApplicable) {
      const whoGmp = docs.find((d) => d.category === 'whoGmpCert');
      if (!whoGmp || (whoGmp.status !== 'VALID' && whoGmp.status !== 'APPROVED')) {
        throw new BadRequestException('WHO-GMP Certificate is required and must be approved for WHO-GMP applicable facility.');
      }
    }
    const unapprovedUploaded = docs.filter((d) => d.status !== 'VALID' && d.status !== 'APPROVED');
    if (unapprovedUploaded.length) {
      throw new BadRequestException(`All uploaded documents must be approved first. Pending: ${unapprovedUploaded.map((d) => d.categoryDisplayName).join(', ')}.`);
    }
    let userId = reg.userId;
    if (!userId) {
      const matchedUser = await this.prisma.user.findFirst({
        where: { email: { equals: reg.email.trim(), mode: 'insensitive' } },
      });
      if (matchedUser) {
        userId = matchedUser.id;
      }
    }

    const manufacturerCode = reg.manufacturerCode || `MFG${String(reg.id).padStart(6, '0')}`;

    await this.prisma.$transaction(async (tx) => {
      await tx.manufacturerRegistration.update({
        where: { id: reg.id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: reviewer,
          rejectionReason: null,
          manufacturerCode,
          ...(userId && !reg.userId ? { userId } : {}),
        },
      });

      if (userId) {
        await tx.user.update({
          where: { id: userId },
          data: {
            accountStatus: 'ACTIVE',
            companyCode: manufacturerCode,
          },
        });
      }
    });

    return {
      success: true,
      message: `Manufacturer ${reg.companyName} approved & activated successfully.`,
      registrationCode: code,
      status: 'APPROVED',
      manufacturerCode,
    };
  }

  async reject(code: string, reason: string, reviewer: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('A reason is required to reject a manufacturer registration.');
    }
    const reg = await this.findByCode(code);
    if (reg.status === 'APPROVED') {
      throw new ConflictException('Cannot reject an already approved manufacturer registration.');
    }
    const updated = await this.prisma.manufacturerRegistration.update({
      where: { id: reg.id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason.trim(),
        reviewedAt: new Date(),
        reviewedBy: reviewer,
      },
    });
    return {
      registrationCode: code,
      status: 'REJECTED',
      rejectionReason: reason.trim(),
      reviewedBy: reviewer,
      reviewedAt: updated.reviewedAt?.toISOString(),
    };
  }

  async requestDocs(code: string, notes: string | string[], reviewer: string) {
    const notesStr = Array.isArray(notes) ? notes.filter(Boolean).join('; ') : String(notes || '').trim();
    if (!notesStr) {
      throw new BadRequestException('Notes or replacement instructions are required.');
    }
    const reg = await this.findByCode(code);
    if (reg.status === 'APPROVED') {
      throw new ConflictException('Cannot request documents for an already approved manufacturer registration.');
    }
    const updated = await this.prisma.manufacturerRegistration.update({
      where: { id: reg.id },
      data: {
        status: 'ACTION_REQUIRED',
        rejectionReason: notesStr,
        reviewedAt: new Date(),
        reviewedBy: reviewer,
      },
    });
    return {
      registrationCode: code,
      status: 'ACTION_REQUIRED',
      rejectionReason: notesStr,
      reviewedBy: reviewer,
      reviewedAt: updated.reviewedAt?.toISOString(),
    };
  }

  // ------------------------------------------------------------- Factory Gallery & Achievements

  async resolveRegistration(regCode?: string, user?: AuthUser) {
    if (regCode) {
      const reg = await this.findByCode(regCode);
      this.assertAccess(reg, user);
      return reg;
    }
    if (!user) {
      throw new BadRequestException('registrationCode is required for unauthenticated requests.');
    }
    if (this.isStaff(user)) {
      throw new BadRequestException('registrationCode query parameter is required for staff operations.');
    }
    const reg = await this.prisma.manufacturerRegistration.findFirst({
      where: { userId: BigInt(user.id) },
      orderBy: { id: 'desc' },
    });
    if (!reg) {
      throw new NotFoundException('No manufacturer registration found for this account.');
    }
    return reg;
  }

  async listGallery(regCode?: string, user?: AuthUser) {
    const reg = await this.resolveRegistration(regCode, user);
    const entries = await this.prisma.factoryGalleryEntry.findMany({
      where: { registrationId: reg.id },
      orderBy: { id: 'desc' },
    });
    return entries.map((e) => this.toGalleryDto(e, reg.registrationCode));
  }

  async uploadGalleryEntry(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    dto: CreateGalleryEntryDto,
    user?: AuthUser,
  ) {
    const reg = await this.resolveRegistration(dto.registrationCode, user);

    if (buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException(`File size ${buffer.length} exceeds 10 MB limit.`);
    }

    const normalizedMime = mimeType?.toLowerCase().trim() || 'image/jpeg';
    const allowedGalleryMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedGalleryMimes.includes(normalizedMime) || !matchesGalleryImageSignature(buffer, normalizedMime)) {
      throw new BadRequestException('Only valid JPG, PNG, and WebP images are permitted for factory gallery photos.');
    }

    let parsedCaptureDate: Date | null = null;
    if (dto.captureDate) {
      parsedCaptureDate = parseIsoDate(dto.captureDate, 'captureDate');
      if (dto.captureDate > todayIso()) {
        throw new BadRequestException('captureDate cannot be in the future.');
      }
    }

    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `manufacturers/${reg.registrationCode}/gallery/${Date.now()}-${randomBytes(4).toString('hex')}-${cleanFileName}`;

    const uploaded = await this.storage.uploadFile(buffer, storageKey, normalizedMime);
    const uploadedBy = user?.username || reg.contactPerson || 'Manufacturer';

    const entry = await this.prisma.factoryGalleryEntry.create({
      data: {
        registrationId: reg.id,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        fileName: cleanFileName,
        fileSize: BigInt(uploaded.fileSize),
        mimeType: normalizedMime,
        storageKey: uploaded.storageKey,
        storageBucket: uploaded.storageBucket,
        captureDate: parsedCaptureDate,
        factoryLocation: dto.factoryLocation.trim(),
        gpsCoordinates: dto.gpsCoordinates?.trim() || null,
        uploadedBy,
        verificationStatus: 'PENDING_VERIFICATION',
      },
    });

    return this.toGalleryDto(entry, reg.registrationCode);
  }

  async getGalleryImage(id: string, user?: AuthUser) {
    const entry = await this.prisma.factoryGalleryEntry.findUnique({
      where: { id: this.parseId(id) },
      include: { registration: true },
    });
    if (!entry) throw new NotFoundException(`Gallery entry ${id} not found.`);
    if (entry.registration.userId !== null && entry.registration.status === 'DRAFT') {
      this.assertAccess(entry.registration, user);
    }
    const file = await this.storage.getFile(entry.storageKey);
    return {
      stream: file.stream,
      contentType: entry.mimeType || file.contentType,
      contentLength: Number(entry.fileSize),
      fileName: entry.fileName,
    };
  }

  async updateGalleryEntry(id: string, dto: UpdateGalleryEntryDto, user?: AuthUser) {
    const entry = await this.prisma.factoryGalleryEntry.findUnique({
      where: { id: this.parseId(id) },
      include: { registration: true },
    });
    if (!entry) throw new NotFoundException(`Gallery entry ${id} not found.`);
    this.assertAccess(entry.registration, user);

    let parsedCaptureDate: Date | null | undefined = undefined;
    if (dto.captureDate !== undefined) {
      if (dto.captureDate) {
        parsedCaptureDate = parseIsoDate(dto.captureDate, 'captureDate');
        if (dto.captureDate > todayIso()) {
          throw new BadRequestException('captureDate cannot be in the future.');
        }
      } else {
        parsedCaptureDate = null;
      }
    }

    const updated = await this.prisma.factoryGalleryEntry.update({
      where: { id: entry.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.factoryLocation !== undefined ? { factoryLocation: dto.factoryLocation.trim() } : {}),
        ...(dto.gpsCoordinates !== undefined ? { gpsCoordinates: dto.gpsCoordinates?.trim() || null } : {}),
        ...(parsedCaptureDate !== undefined ? { captureDate: parsedCaptureDate } : {}),
      },
    });

    return this.toGalleryDto(updated, entry.registration.registrationCode);
  }

  async deleteGalleryEntry(id: string, user?: AuthUser) {
    const entry = await this.prisma.factoryGalleryEntry.findUnique({
      where: { id: this.parseId(id) },
      include: { registration: true },
    });
    if (!entry) throw new NotFoundException(`Gallery entry ${id} not found.`);
    this.assertAccess(entry.registration, user);

    await this.prisma.factoryGalleryEntry.delete({ where: { id: entry.id } });
    await this.storage.deleteFile(entry.storageKey);

    return { success: true, message: 'Gallery entry deleted successfully.' };
  }

  async listAchievements(regCode?: string, user?: AuthUser) {
    const reg = await this.resolveRegistration(regCode, user);
    const achievements = await this.prisma.manufacturerAchievement.findMany({
      where: { registrationId: reg.id },
      orderBy: { id: 'desc' },
    });
    return achievements.map((a) => this.toAchievementDto(a, reg.registrationCode));
  }

  async createAchievement(
    dto: CreateAchievementDto,
    user?: AuthUser,
    certFile?: { buffer: Buffer; fileName: string; mimeType: string },
  ) {
    const reg = await this.resolveRegistration(dto.registrationCode, user);

    const issueDate = parseIsoDate(dto.issueDate, 'issueDate');
    if (dto.issueDate > todayIso()) {
      throw new BadRequestException('issueDate cannot be in the future.');
    }

    let expiryDate: Date | null = null;
    if (dto.expiryDate) {
      expiryDate = parseIsoDate(dto.expiryDate, 'expiryDate');
      if (dto.expiryDate <= dto.issueDate) {
        throw new BadRequestException('expiryDate must be after the issueDate.');
      }
    }

    let certUpload: UploadResult | null = null;
    let cleanCertName: string | null = null;

    if (certFile) {
      if (certFile.buffer.length > MAX_FILE_SIZE) {
        throw new BadRequestException(`Certificate size ${certFile.buffer.length} exceeds 10 MB limit.`);
      }
      const certMime = certFile.mimeType?.toLowerCase().trim() || 'application/pdf';
      const allowedCertMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedCertMimes.includes(certMime) || !matchesCertSignature(certFile.buffer, certMime)) {
        throw new BadRequestException('Only PDF, JPG, PNG, and WebP files are accepted for supporting certificates.');
      }
      cleanCertName = certFile.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storageKey = `manufacturers/${reg.registrationCode}/achievements/${Date.now()}-${randomBytes(4).toString('hex')}-${cleanCertName}`;
      certUpload = await this.storage.uploadFile(certFile.buffer, storageKey, certMime);
    }

    const ach = await this.prisma.manufacturerAchievement.create({
      data: {
        registrationId: reg.id,
        title: dto.title.trim(),
        awardType: dto.awardType.trim(),
        issuingOrganization: dto.issuingOrganization.trim(),
        issueDate,
        expiryDate,
        description: dto.description?.trim() || null,
        certificateFileName: cleanCertName,
        certificateFileSize: certUpload ? BigInt(certUpload.fileSize) : null,
        certificateMimeType: certUpload ? certUpload.mimeType : null,
        certificateStorageKey: certUpload ? certUpload.storageKey : null,
        certificateStorageBucket: certUpload ? certUpload.storageBucket : null,
        verificationStatus: 'PENDING_VERIFICATION',
      },
    });

    return this.toAchievementDto(ach, reg.registrationCode);
  }

  async updateAchievement(id: string, dto: UpdateAchievementDto, user?: AuthUser) {
    const ach = await this.prisma.manufacturerAchievement.findUnique({
      where: { id: this.parseId(id) },
      include: { registration: true },
    });
    if (!ach) throw new NotFoundException(`Achievement ${id} not found.`);
    this.assertAccess(ach.registration, user);

    let issueDate = ach.issueDate;
    if (dto.issueDate) {
      issueDate = parseIsoDate(dto.issueDate, 'issueDate');
      if (dto.issueDate > todayIso()) {
        throw new BadRequestException('issueDate cannot be in the future.');
      }
    }

    let expiryDate = ach.expiryDate;
    if (dto.expiryDate !== undefined) {
      if (dto.expiryDate) {
        expiryDate = parseIsoDate(dto.expiryDate, 'expiryDate');
        const issueIso = dto.issueDate || ach.issueDate.toISOString().slice(0, 10);
        if (dto.expiryDate <= issueIso) {
          throw new BadRequestException('expiryDate must be after issueDate.');
        }
      } else {
        expiryDate = null;
      }
    }

    const updated = await this.prisma.manufacturerAchievement.update({
      where: { id: ach.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.awardType !== undefined ? { awardType: dto.awardType.trim() } : {}),
        ...(dto.issuingOrganization !== undefined ? { issuingOrganization: dto.issuingOrganization.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        issueDate,
        expiryDate,
      },
    });

    return this.toAchievementDto(updated, ach.registration.registrationCode);
  }

  async uploadAchievementCertificate(
    id: string,
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    user?: AuthUser,
  ) {
    const ach = await this.prisma.manufacturerAchievement.findUnique({
      where: { id: this.parseId(id) },
      include: { registration: true },
    });
    if (!ach) throw new NotFoundException(`Achievement ${id} not found.`);
    this.assertAccess(ach.registration, user);

    if (buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException(`Certificate size ${buffer.length} exceeds 10 MB limit.`);
    }
    const certMime = mimeType?.toLowerCase().trim() || 'application/pdf';
    const allowedCertMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedCertMimes.includes(certMime) || !matchesCertSignature(buffer, certMime)) {
      throw new BadRequestException('Only PDF, JPG, PNG, and WebP files are accepted for supporting certificates.');
    }

    if (ach.certificateStorageKey) {
      await this.storage.deleteFile(ach.certificateStorageKey);
    }

    const cleanCertName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `manufacturers/${ach.registration.registrationCode}/achievements/${Date.now()}-${randomBytes(4).toString('hex')}-${cleanCertName}`;
    const certUpload = await this.storage.uploadFile(buffer, storageKey, certMime);

    const updated = await this.prisma.manufacturerAchievement.update({
      where: { id: ach.id },
      data: {
        certificateFileName: cleanCertName,
        certificateFileSize: BigInt(certUpload.fileSize),
        certificateMimeType: certUpload.mimeType,
        certificateStorageKey: certUpload.storageKey,
        certificateStorageBucket: certUpload.storageBucket,
      },
    });

    return this.toAchievementDto(updated, ach.registration.registrationCode);
  }

  async getAchievementCertificate(id: string, user?: AuthUser) {
    const ach = await this.prisma.manufacturerAchievement.findUnique({
      where: { id: this.parseId(id) },
      include: { registration: true },
    });
    if (!ach || !ach.certificateStorageKey) {
      throw new NotFoundException(`Certificate for achievement ${id} not found.`);
    }
    if (ach.registration.userId !== null && ach.registration.status === 'DRAFT') {
      this.assertAccess(ach.registration, user);
    }
    const file = await this.storage.getFile(ach.certificateStorageKey);
    return {
      stream: file.stream,
      contentType: ach.certificateMimeType || file.contentType,
      contentLength: ach.certificateFileSize ? Number(ach.certificateFileSize) : file.contentLength,
      fileName: ach.certificateFileName || 'certificate.pdf',
    };
  }

  async deleteAchievement(id: string, user?: AuthUser) {
    const ach = await this.prisma.manufacturerAchievement.findUnique({
      where: { id: this.parseId(id) },
      include: { registration: true },
    });
    if (!ach) throw new NotFoundException(`Achievement ${id} not found.`);
    this.assertAccess(ach.registration, user);

    if (ach.certificateStorageKey) {
      await this.storage.deleteFile(ach.certificateStorageKey);
    }
    await this.prisma.manufacturerAchievement.delete({ where: { id: ach.id } });

    return { success: true, message: 'Achievement deleted successfully.' };
  }

  async reviewGalleryEntry(code: string, id: string, dto: ReviewSubmissionDto, reviewer: string) {
    const reg = await this.findByCode(code);
    const entry = await this.prisma.factoryGalleryEntry.findFirst({
      where: { id: this.parseId(id), registrationId: reg.id },
    });
    if (!entry) throw new NotFoundException(`Gallery entry ${id} not found for this registration.`);

    if (dto.decision === 'REJECTED' && !dto.reason?.trim()) {
      throw new BadRequestException('A reason is required when rejecting a gallery entry.');
    }

    const updated = await this.prisma.factoryGalleryEntry.update({
      where: { id: entry.id },
      data: {
        verificationStatus: dto.decision,
        rejectionReason: dto.decision === 'REJECTED' ? dto.reason!.trim() : null,
        reviewedBy: reviewer,
        reviewedAt: new Date(),
      },
    });

    return this.toGalleryDto(updated, reg.registrationCode);
  }

  async reviewAchievement(code: string, id: string, dto: ReviewSubmissionDto, reviewer: string) {
    const reg = await this.findByCode(code);
    const ach = await this.prisma.manufacturerAchievement.findFirst({
      where: { id: this.parseId(id), registrationId: reg.id },
    });
    if (!ach) throw new NotFoundException(`Achievement ${id} not found for this registration.`);

    if (dto.decision === 'REJECTED' && !dto.reason?.trim()) {
      throw new BadRequestException('A reason is required when rejecting an achievement.');
    }

    const updated = await this.prisma.manufacturerAchievement.update({
      where: { id: ach.id },
      data: {
        verificationStatus: dto.decision,
        rejectionReason: dto.decision === 'REJECTED' ? dto.reason!.trim() : null,
        reviewedBy: reviewer,
        reviewedAt: new Date(),
      },
    });

    return this.toAchievementDto(updated, reg.registrationCode);
  }

  // ------------------------------------------------------------- Authenticated Manufacturer Documents (/me/documents)

  async getMyDocuments(userId: number) {
    const regView = await this.getMyRegistration(userId);
    return regView.documents;
  }

  async uploadMyDocument(
    userId: number,
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    categoryRaw: string,
    documentNumber?: string,
    issueDate?: string,
    expiryDate?: string,
    caller?: AuthUser,
  ) {
    const reg = await this.prisma.manufacturerRegistration.findFirst({
      where: { userId: BigInt(userId) },
      orderBy: { id: 'desc' },
    });
    if (!reg) throw new NotFoundException('No manufacturer registration found for this account.');
    return this.uploadDocument(
      buffer,
      fileName,
      mimeType,
      categoryRaw,
      reg.registrationCode,
      issueDate,
      expiryDate,
      caller,
      documentNumber,
    );
  }

  async replaceMyDocument(
    userId: number,
    documentId: string,
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    documentNumber?: string,
    issueDate?: string,
    expiryDate?: string,
    caller?: AuthUser,
  ) {
    const reg = await this.prisma.manufacturerRegistration.findFirst({
      where: { userId: BigInt(userId) },
      orderBy: { id: 'desc' },
    });
    if (!reg) throw new NotFoundException('No manufacturer registration found for this account.');
    const id = this.parseId(documentId);
    const existingDoc = await this.prisma.manufacturerDocument.findFirst({
      where: { id, registrationId: reg.id },
    });
    if (!existingDoc) throw new NotFoundException(`Document ${documentId} not found for this manufacturer.`);
    return this.uploadDocument(
      buffer,
      fileName,
      mimeType,
      existingDoc.category,
      reg.registrationCode,
      issueDate || (existingDoc.issueDate ? existingDoc.issueDate.toISOString().slice(0, 10) : undefined),
      expiryDate || (existingDoc.expiryDate ? existingDoc.expiryDate.toISOString().slice(0, 10) : undefined),
      caller,
      documentNumber || existingDoc.documentNumber || undefined,
    );
  }

  async downloadMyDocument(userId: number, documentId: string, caller?: AuthUser) {
    const reg = await this.prisma.manufacturerRegistration.findFirst({
      where: { userId: BigInt(userId) },
      orderBy: { id: 'desc' },
    });
    if (!reg) throw new NotFoundException('No manufacturer registration found for this account.');
    const id = this.parseId(documentId);
    const doc = await this.prisma.manufacturerDocument.findFirst({
      where: { id, registrationId: reg.id },
    });
    if (!doc) throw new NotFoundException(`Document ${documentId} not found for this manufacturer.`);
    return this.getDocumentForDownload(documentId, caller, reg.registrationCode);
  }

  // ------------------------------------------------------------- Admin Manufacturer Documents (/admin/manufacturers/...)

  async findManufacturerByIdentifier(identifier: string) {
    const raw = identifier.trim();
    let reg = null;
    if (/^\d+$/.test(raw)) {
      reg = await this.prisma.manufacturerRegistration.findUnique({
        where: { id: BigInt(raw) },
      });
    }
    if (!reg) {
      reg = await this.prisma.manufacturerRegistration.findUnique({
        where: { registrationCode: raw },
      });
    }
    if (!reg) {
      reg = await this.prisma.manufacturerRegistration.findFirst({
        where: { manufacturerCode: raw },
      });
    }
    if (!reg) {
      throw new NotFoundException(`Manufacturer "${identifier}" not found.`);
    }
    return reg;
  }

  async getAdminManufacturerDocuments(identifier: string) {
    const reg = await this.findManufacturerByIdentifier(identifier);
    const docs = await this.prisma.manufacturerDocument.findMany({
      where: { registrationId: reg.id, status: { not: 'SUPERSEDED' } },
      orderBy: { id: 'asc' },
    });
    return docs.map((d) => this.toDocumentDto(d));
  }

  async getAdminManufacturerDocumentDownload(identifier: string, documentId: string, caller?: AuthUser) {
    const reg = await this.findManufacturerByIdentifier(identifier);
    const id = this.parseId(documentId);
    const doc = await this.prisma.manufacturerDocument.findFirst({
      where: { id, registrationId: reg.id },
      include: { registration: true },
    });
    if (!doc) {
      throw new NotFoundException(`Document ${documentId} not found for manufacturer ${identifier}.`);
    }
    return this.getDocumentForDownload(documentId, caller, reg.registrationCode);
  }

  async patchAdminManufacturerDocumentVerification(
    identifier: string,
    documentId: string,
    dto: ManufacturerVerificationPatchDto,
    reviewer: string,
  ) {
    const reg = await this.findManufacturerByIdentifier(identifier);
    const id = this.parseId(documentId);
    const doc = await this.prisma.manufacturerDocument.findFirst({
      where: { id, registrationId: reg.id },
    });
    if (!doc) {
      throw new NotFoundException(`Document ${documentId} not found for manufacturer ${identifier}.`);
    }

    const decisionRaw = (dto.decision || dto.status || '').toUpperCase();
    let decision: 'APPROVED' | 'REJECTED' | 'NEEDS_REPLACEMENT' = 'APPROVED';
    let status = 'VALID';

    if (decisionRaw === 'REJECTED') {
      decision = 'REJECTED';
      status = 'REJECTED';
    } else if (decisionRaw === 'NEEDS_REPLACEMENT' || decisionRaw === 'REQUEST_MORE_DOCUMENTS') {
      decision = 'NEEDS_REPLACEMENT';
      status = 'NEEDS_REPLACEMENT';
    } else if (decisionRaw === 'APPROVED' || decisionRaw === 'VALID') {
      decision = 'APPROVED';
      status = 'VALID';
    } else {
      throw new BadRequestException(`Invalid verification status/decision "${decisionRaw}". Must be APPROVED, REJECTED, or NEEDS_REPLACEMENT.`);
    }

    const remarks = (dto.remarks || dto.reason || dto.adminRemarks || '').trim();
    if ((decision === 'REJECTED' || decision === 'NEEDS_REPLACEMENT') && !remarks) {
      throw new BadRequestException('Remarks/reason are required when rejecting or requesting replacement.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const d = await tx.manufacturerDocument.update({
        where: { id: doc.id },
        data: {
          status,
          reviewDecision: decision,
          rejectionReason: decision === 'APPROVED' ? null : remarks,
          adminRemarks: decision === 'APPROVED' ? (remarks || 'Approved by compliance verifier') : remarks,
          reviewedBy: reviewer,
          reviewedAt: new Date(),
        },
      });

      if (decision !== 'APPROVED' && reg.status !== 'APPROVED') {
        await tx.manufacturerRegistration.update({
          where: { id: reg.id },
          data: { status: 'ACTION_REQUIRED', rejectionReason: remarks },
        });
      }
      return d;
    });

    return {
      success: true,
      document: this.toDocumentDto(updated),
      verificationStatus: updated.status,
    };
  }
}
