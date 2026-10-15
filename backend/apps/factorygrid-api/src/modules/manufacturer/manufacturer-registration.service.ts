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
import { StorageService } from '../storage/storage.service';
import {
  MANUFACTURER_DOCUMENT_CATEGORIES,
  ManufacturerReviewDocumentDto,
  ManufacturerStep1Dto,
  ManufacturerStep2Dto,
  ManufacturerStep3Dto,
  ManufacturerStep4Dto,
  ManufacturerStepResponseDto,
  ManufacturerSubmitDto,
  resolveManufacturerCategory,
} from './dto/manufacturer-registration.dto';

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

  // ------------------------------------------------------------------- step 1

  async saveStep1(dto: ManufacturerStep1Dto, existingCode?: string): Promise<ManufacturerStepResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const data = {
      companyName: dto.companyName.trim(),
      facilityAddress: dto.facilityAddress.trim(),
      city: dto.city.trim(),
      state: dto.state.trim(),
      pincode: dto.pincode.trim(),
      mfgCapacity: dto.mfgCapacity.trim(),
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
    if (!issueDate || !expiryDate) {
      throw new BadRequestException('issueDate and expiryDate are required for every certification.');
    }
    const { issue, expiry } = assertDateRules(issueDate, expiryDate, category.name);

    const reg = await this.findByCode(registrationCode);
    this.assertAccess(reg, caller);

    const safeName = (fileName || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `documents/manufacturer/${reg.registrationCode}/${Date.now()}_${safeName}`;

    // Store the object first: no metadata row exists unless the file was really stored.
    const stored = await this.storage.uploadFile(buffer, storageKey, mime);

    const doc = await this.prisma.$transaction(async (tx) => {
      const previous = await tx.manufacturerDocument.findMany({
        where: { registrationId: reg.id, category: category.key },
        orderBy: { version: 'desc' },
      });
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
    await this.prisma.manufacturerDocument.delete({ where: { id } });
    return { success: true, message: 'Document removed' };
  }

  async saveStep2(dto: ManufacturerStep2Dto, code: string): Promise<ManufacturerStepResponseDto> {
    const reg = await this.getEditableDraft(code);
    const seen = new Set<string>();
    const updates: { id: bigint; issue: Date; expiry: Date }[] = [];
    for (const item of dto.documents) {
      const category = resolveManufacturerCategory(item.category);
      if (!category) throw new BadRequestException(`Invalid document category "${item.category}".`);
      if (seen.has(category.key)) throw new BadRequestException(`Duplicate entry for ${category.name}.`);
      seen.add(category.key);
      const { issue, expiry } = assertDateRules(item.issueDate, item.expiryDate, category.name);
      const doc = await this.prisma.manufacturerDocument.findFirst({
        where: { registrationId: reg.id, category: category.key, status: { not: 'SUPERSEDED' } },
      });
      if (!doc) throw new BadRequestException(`${category.name} has not been uploaded yet.`);
      updates.push({ id: doc.id, issue, expiry });
    }
    await this.prisma.$transaction([
      ...updates.map((u) =>
        this.prisma.manufacturerDocument.update({ where: { id: u.id }, data: { issueDate: u.issue, expiryDate: u.expiry } }),
      ),
      this.prisma.manufacturerRegistration.update({
        where: { id: reg.id },
        data: { currentStep: Math.max(reg.currentStep, 2) },
      }),
    ]);
    return { success: true, message: 'Certifications saved successfully', registrationCode: code, currentStep: 2 };
  }

  // ------------------------------------------------------------------- step 3

  async saveStep3(dto: ManufacturerStep3Dto, code: string): Promise<ManufacturerStepResponseDto> {
    const reg = await this.getEditableDraft(code);
    const ids = dto.productIds;
    if (ids.length) {
      const found = await this.prisma.catalogProduct.findMany({ where: { id: { in: ids }, active: true }, select: { id: true } });
      const foundIds = new Set(found.map((p) => p.id));
      const unknown = ids.filter((id) => !foundIds.has(id));
      if (unknown.length) {
        throw new BadRequestException(`Unknown product IDs: ${unknown.join(', ')}`);
      }
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
    return { success: true, message: 'Product capabilities saved successfully', registrationCode: code, currentStep: 3 };
  }

  // ------------------------------------------------------------------- step 4

  async saveStep4(dto: ManufacturerStep4Dto, code: string): Promise<ManufacturerStepResponseDto> {
    const reg = await this.getEditableDraft(code);
    const selected = await this.prisma.manufacturerProduct.findMany({ where: { registrationId: reg.id } });
    const selectedIds = new Set(selected.map((s) => s.productId));
    const seen = new Set<string>();
    for (const item of dto.items) {
      if (!selectedIds.has(item.productId)) {
        throw new BadRequestException(`Product ${item.productId} is not part of this manufacturer's selected products.`);
      }
      if (seen.has(item.productId)) {
        throw new BadRequestException(`Duplicate MOQ entry for product ${item.productId}.`);
      }
      seen.add(item.productId);
    }
    await this.prisma.$transaction([
      ...dto.items.map((item) =>
        this.prisma.manufacturerProduct.update({
          where: { registrationId_productId: { registrationId: reg.id, productId: item.productId } },
          data: { moq: item.moq, leadTimeDays: item.leadTimeDays },
        }),
      ),
      this.prisma.manufacturerRegistration.update({
        where: { id: reg.id },
        data: { currentStep: Math.max(reg.currentStep, 4) },
      }),
    ]);
    return { success: true, message: 'MOQ and delivery schedule saved successfully', registrationCode: code, currentStep: 4 };
  }

  // ----------------------------------------------------------- read / review

  private parseId(raw: string): bigint {
    if (!/^\d+$/.test(raw)) throw new BadRequestException(`Invalid id "${raw}".`);
    return BigInt(raw);
  }

  private toDocumentDto(d: any) {
    return {
      id: d.id.toString(),
      documentCode: `DOC-${d.id}`,
      category: d.category,
      categoryDisplayName: d.categoryDisplayName,
      fileName: d.fileName,
      fileSize: Number(d.fileSize),
      mimeType: d.mimeType,
      issueDate: d.issueDate.toISOString().slice(0, 10),
      expiryDate: d.expiryDate.toISOString().slice(0, 10),
      status: d.status,
      rejectionReason: d.rejectionReason ?? null,
      reviewedBy: d.reviewedBy ?? null,
      reviewedAt: d.reviewedAt ? d.reviewedAt.toISOString() : null,
      reviewDecision: d.reviewDecision ?? null,
      version: d.version,
      uploadedAt: d.createdAt.toISOString(),
    };
  }

  private async buildView(regId: bigint) {
    const reg = await this.prisma.manufacturerRegistration.findUniqueOrThrow({
      where: { id: regId },
      include: {
        documents: { where: { status: { not: 'SUPERSEDED' } }, orderBy: { id: 'asc' } },
        products: { include: { product: true }, orderBy: { id: 'asc' } },
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
      company: {
        companyName: reg.companyName,
        facilityAddress: reg.facilityAddress,
        city: reg.city,
        state: reg.state,
        pincode: reg.pincode,
        mfgCapacity: reg.mfgCapacity,
        contactPerson: reg.contactPerson,
        designation: reg.designation,
        email: reg.email,
        phone: reg.phone,
      },
      documents: reg.documents.map((d) => this.toDocumentDto(d)),
      products: reg.products.map((p) => ({
        productId: p.productId,
        productCode: p.product.productCode,
        name: p.product.name,
        genericName: p.product.genericName,
        dosageForm: p.product.dosageForm,
        category: p.product.category,
        packSize: p.product.packSize,
        moq: p.moq,
        leadTimeDays: p.leadTimeDays,
      })),
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

  async getDocumentForDownload(documentId: string, caller?: AuthUser) {
    const doc = await this.prisma.manufacturerDocument.findUnique({
      where: { id: this.parseId(documentId) },
      include: { registration: true },
    });
    if (!doc) throw new NotFoundException(`Document ${documentId} not found.`);
    // Downloads are never public: even for drafts the caller must be the owner or staff.
    if (doc.registration.userId === null) {
      if (!this.isStaff(caller)) throw new ForbiddenException('Documents are private until the registration is submitted.');
    } else {
      this.assertAccess(doc.registration, caller);
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
    for (const c of MANUFACTURER_DOCUMENT_CATEGORIES) {
      const doc = docs.find((d) => d.category === c.key);
      if (!doc) errors[`documents.${c.key}`] = `${c.name} has not been uploaded.`;
      else if (doc.expiryDate.toISOString().slice(0, 10) < todayIso()) errors[`documents.${c.key}`] = `${c.name} has expired.`;
    }
    if (!products.length) errors.products = 'Select at least one product capability.';
    for (const p of products) {
      if (!p.moq || p.moq < 1) errors[`products.${p.productId}.moq`] = `MOQ is required for product ${p.productId}.`;
      if (!p.leadTimeDays || p.leadTimeDays < 1) {
        errors[`products.${p.productId}.leadTimeDays`] = `Delivery days are required for product ${p.productId}.`;
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
          data: { userId: user.id, currentStep: 5, submittedAt: new Date() },
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
        status: status ? status : { not: 'DRAFT' },
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
    if (reg.status !== 'SUBMITTED') {
      throw new BadRequestException(`Registration cannot be approved while its status is ${reg.status}.`);
    }
    const docs = await this.prisma.manufacturerDocument.findMany({
      where: { registrationId: reg.id, status: { not: 'SUPERSEDED' } },
    });
    const notApproved = MANUFACTURER_DOCUMENT_CATEGORIES.filter(
      (c) => docs.find((d) => d.category === c.key)?.status !== 'VALID',
    ).map((c) => c.name);
    if (notApproved.length) {
      throw new BadRequestException(`All six certifications must be approved first. Pending: ${notApproved.join(', ')}.`);
    }
    if (!reg.userId) throw new BadRequestException('Registration has no linked account.');
    const manufacturerCode = `MFG${String(reg.id).padStart(6, '0')}`;
    await this.prisma.$transaction([
      this.prisma.manufacturerRegistration.update({
        where: { id: reg.id },
        data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: reviewer, rejectionReason: null, manufacturerCode },
      }),
      this.prisma.user.update({ where: { id: reg.userId }, data: { accountStatus: 'ACTIVE' } }),
    ]);
    return { registrationCode: code, status: 'APPROVED', manufacturerCode };
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
}
