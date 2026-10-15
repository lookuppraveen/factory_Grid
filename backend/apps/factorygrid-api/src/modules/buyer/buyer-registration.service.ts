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
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  BuyerFullRegistrationDto,
  Step1CompanyDto,
  Step2ContactDto,
  Step3AddressDto,
  StepResponseDto,
} from './dto/buyer-registration.dto';
import {
  CATEGORY_KEY_MAP,
  MANDATORY_DOCUMENT_CATEGORIES,
  UploadDocumentResponseDto,
} from './dto/buyer-document.dto';
import { CustomerVerificationResponseDto } from './dto/verification.dto';

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class BuyerRegistrationService {
  private readonly logger = new Logger(BuyerRegistrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Unguessable code: it doubles as the capability token for the pre-login draft. */
  private generateCode(prefix: string): string {
    return `${prefix}-${randomBytes(8).toString('hex').toUpperCase()}`;
  }

  private assertFormats(gstRaw: string, panRaw: string): void {
    if (!gstRaw || !gstRaw.trim()) {
      throw new BadRequestException('GST Number is required.');
    }
    if (!panRaw || !panRaw.trim()) {
      throw new BadRequestException('PAN Number is required.');
    }
    // Temporary testing acceptance: Accept any non-empty GST and PAN without government API verification.
    // Production government verification will be separated and performed in compliance review.
  }

  private async getEditableDraft(registrationCode: string) {
    const reg = await this.prisma.buyerRegistration.findUnique({ where: { registrationCode } });
    if (!reg) {
      throw new NotFoundException(`Registration draft ${registrationCode} not found.`);
    }
    if (reg.status !== 'DRAFT') {
      throw new ConflictException(`Registration ${registrationCode} has already been submitted.`);
    }
    return reg;
  }

  /**
   * Step 1: Save Company and Regulatory Information
   */
  async saveStep1(dto: Step1CompanyDto, existingCode?: string): Promise<StepResponseDto> {
    this.assertFormats(dto.gstNumber, dto.panNumber);

    const data = {
      companyName: dto.companyName.trim(),
      businessType: dto.businessType.trim(),
      gstNumber: dto.gstNumber.trim().toUpperCase(),
      panNumber: dto.panNumber.trim().toUpperCase(),
      drugLicenseNumber: dto.drugLicenseNumber.trim(),
      cinNumber: dto.cinNumber?.trim() || null,
      website: dto.website?.trim() || null,
    };

    let reg;
    if (existingCode) {
      const draft = await this.getEditableDraft(existingCode);
      reg = await this.prisma.buyerRegistration.update({
        where: { id: draft.id },
        data: { ...data, currentStep: Math.max(draft.currentStep, 1) },
      });
    } else {
      reg = await this.prisma.buyerRegistration.create({
        data: {
          ...data,
          registrationCode: this.generateCode('REG-BUYER'),
          contactPerson: '',
          designation: '',
          mobileNumber: '',
          email: '',
          billingAddress: '',
          shippingAddress: '',
          state: '',
          country: 'India',
          pincode: '',
          currentStep: 1,
          status: 'DRAFT',
        },
      });
    }

    return {
      success: true,
      message: 'Company and regulatory details saved successfully',
      registrationCode: reg.registrationCode,
      currentStep: 1,
    };
  }

  /**
   * Step 2: Save Contact Information
   */
  async saveStep2(dto: Step2ContactDto, registrationCode: string): Promise<StepResponseDto> {
    const reg = await this.getEditableDraft(registrationCode);

    const updated = await this.prisma.buyerRegistration.update({
      where: { id: reg.id },
      data: {
        contactPerson: dto.contactPerson.trim(),
        designation: dto.designation.trim(),
        mobileNumber: dto.mobileNumber.trim(),
        email: dto.email.trim().toLowerCase(),
        currentStep: Math.max(reg.currentStep, 2),
      },
    });

    return {
      success: true,
      message: 'Contact details saved successfully',
      registrationCode: updated.registrationCode,
      currentStep: 2,
    };
  }

  /**
   * Step 3: Save Business Details, Addresses & Customer-Type Parameters
   */
  async saveStep3(dto: Step3AddressDto, registrationCode: string): Promise<StepResponseDto> {
    const reg = await this.getEditableDraft(registrationCode);

    const typeParameters = this.collectTypeDetails(dto);

    const updated = await this.prisma.buyerRegistration.update({
      where: { id: reg.id },
      data: {
        billingAddress: dto.billingAddress.trim(),
        shippingAddress: dto.shippingAddress.trim(),
        state: dto.state.trim(),
        country: dto.country?.trim() || 'India',
        pincode: dto.pincode.trim(),
        customerTypeDetails: Object.keys(typeParameters).length > 0 ? typeParameters : undefined,
        currentStep: Math.max(reg.currentStep, 3),
      },
    });

    return {
      success: true,
      message: 'Address and business details saved successfully',
      registrationCode: updated.registrationCode,
      currentStep: 3,
    };
  }

  private collectTypeDetails(dto: Step3AddressDto | BuyerFullRegistrationDto): Record<string, any> {
    const details: Record<string, any> = {};
    if (dto.pcdDetails) details.pcdDetails = dto.pcdDetails;
    if (dto.tpmDetails) details.tpmDetails = dto.tpmDetails;
    if (dto.distributorDetails) details.distributorDetails = dto.distributorDetails;
    if (dto.hospitalDetails) details.hospitalDetails = dto.hospitalDetails;
    if (dto.wholesalerDetails) details.wholesalerDetails = dto.wholesalerDetails;
    if (dto.exportDetails) details.exportDetails = dto.exportDetails;
    return details;
  }

  /**
   * Step 4 & Document Re-upload: Upload Regulatory Document to Storage (MinIO / S3) & Persist Metadata.
   * If replacing an existing document, stores the new file, archives previous version as SUPERSEDED,
   * associates new document with incremented version, and returns case to Under Review.
   */
  async uploadDocument(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    categoryRaw: string,
    registrationCode?: string,
    callerUser?: AuthUser,
  ): Promise<UploadDocumentResponseDto> {
    if (!registrationCode) {
      throw new BadRequestException('registrationCode is required.');
    }
    if (!buffer.length) {
      throw new BadRequestException('Uploaded file is empty.');
    }
    if (buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException(`File size exceeds maximum allowed limit of 10 MB.`);
    }

    if (!ALLOWED_MIME_TYPES.includes((mimeType || '').toLowerCase())) {
      throw new BadRequestException(
        `Invalid file format "${mimeType}". Only PDF, PNG, and JPEG formats are permitted.`,
      );
    }

    const canonicalCategory = CATEGORY_KEY_MAP[categoryRaw] || categoryRaw;
    if (!MANDATORY_DOCUMENT_CATEGORIES.includes(canonicalCategory as any)) {
      throw new BadRequestException(
        `Invalid document category "${categoryRaw}". Must be one of: ${MANDATORY_DOCUMENT_CATEGORIES.join(', ')}`,
      );
    }

    const reg = await this.prisma.buyerRegistration.findUnique({ where: { registrationCode } });
    if (!reg) {
      throw new NotFoundException(`Registration ${registrationCode} not found.`);
    }

    // Authorization: a registration already linked to an account only accepts uploads from its owner or staff.
    const isStaff =
      !!callerUser &&
      (callerUser.roles.includes('ROLE_ADMIN') || callerUser.roles.includes('ROLE_COMPLIANCE_OFFICER'));
    if (reg.userId && !isStaff) {
      if (!callerUser) {
        throw new ForbiddenException('Please log in to replace documents for a submitted registration.');
      }
      if (reg.userId !== BigInt(callerUser.id)) {
        throw new ForbiddenException("Access to another buyer's documents is denied.");
      }
    }

    const sanitizedFileName = (fileName || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `documents/buyer/${reg.registrationCode}/${Date.now()}_${sanitizedFileName}`;

    // Upload to MinIO / S3 first: no metadata row is written unless the object was really stored.
    const uploadResult = await this.storage.uploadFile(buffer, storageKey, mimeType);

    const doc = await this.prisma.$transaction(async (tx) => {
      // Find latest version of this category for version history
      const existingDocs = await tx.buyerDocument.findMany({
        where: { registrationId: reg.id, category: canonicalCategory },
        orderBy: { version: 'desc' },
      });
      const latestDoc = existingDocs[0];
      const nextVersion = latestDoc ? latestDoc.version + 1 : 1;

      // Mark previous documents as SUPERSEDED to preserve audit history
      if (existingDocs.length > 0) {
        await tx.buyerDocument.updateMany({
          where: { registrationId: reg.id, category: canonicalCategory, status: { not: 'SUPERSEDED' } },
          data: { status: 'SUPERSEDED' },
        });
      }

      await tx.buyerRegistration.update({
        where: { id: reg.id },
        data: {
          currentStep: Math.max(reg.currentStep, 4),
          status: reg.status === 'DRAFT' ? 'DRAFT' : 'SUBMITTED',
        },
      });

      // If there's an associated verification request that was rejected or needed replacement, return it to Under Review!
      await tx.customerVerificationRequest.updateMany({
        where: { registrationId: reg.id, verificationStatus: { in: ['Rejected', 'Need More Docs'] } },
        data: {
          verificationStatus: 'Under Review',
          rejectionReason: null,
        },
      });

      return tx.buyerDocument.create({
        data: {
          registrationId: reg.id,
          category: canonicalCategory,
          categoryDisplayName: canonicalCategory,
          fileName: sanitizedFileName,
          fileSize: BigInt(uploadResult.fileSize),
          mimeType: uploadResult.mimeType,
          storageKey: uploadResult.storageKey,
          storageBucket: uploadResult.storageBucket,
          status: 'PENDING',
          version: nextVersion,
        },
      });
    });

    return this.toDocumentDto(doc, reg.id);
  }

  private toDocumentDto(d: any, registrationId: bigint): UploadDocumentResponseDto {
    return {
      id: d.id.toString(),
      documentCode: `DOC-${d.id}`,
      registrationId: registrationId.toString(),
      category: d.category,
      categoryDisplayName: d.categoryDisplayName,
      fileName: d.fileName,
      fileSize: Number(d.fileSize),
      mimeType: d.mimeType,
      status: d.status,
      rejectionReason: d.rejectionReason ?? undefined,
      reviewedBy: d.reviewedBy ?? undefined,
      reviewedAt: d.reviewedAt ? d.reviewedAt.toISOString() : undefined,
      reviewDecision: d.reviewDecision ?? undefined,
      version: d.version ?? 1,
      uploadedAt: d.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves all active documents attached to a registration with cross-buyer authorization protection
   */
  async getDocuments(registrationCode: string, callerUser?: AuthUser): Promise<UploadDocumentResponseDto[]> {
    const reg = await this.prisma.buyerRegistration.findUnique({
      where: { registrationCode },
      include: {
        documents: {
          where: { status: { not: 'SUPERSEDED' } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!reg) {
      throw new NotFoundException(`Registration ${registrationCode} not found.`);
    }

    if (
      callerUser &&
      callerUser.roles.includes('ROLE_BUYER') &&
      !callerUser.roles.includes('ROLE_ADMIN') &&
      !callerUser.roles.includes('ROLE_COMPLIANCE_OFFICER')
    ) {
      if (reg.userId && reg.userId !== BigInt(callerUser.id)) {
        throw new ForbiddenException("Access to another buyer's documents is denied.");
      }
    }

    return reg.documents.map((d) => this.toDocumentDto(d, reg.id));
  }

  async getDocumentForDownload(documentId: string, callerUser?: AuthUser) {
    let docIdNum: bigint;
    try {
      docIdNum = BigInt(documentId);
    } catch {
      throw new BadRequestException('Invalid document ID format.');
    }

    const doc = await this.prisma.buyerDocument.findUnique({
      where: { id: docIdNum },
      include: { registration: true },
    });

    if (!doc) {
      throw new NotFoundException(`Buyer document #${documentId} not found.`);
    }

    if (
      callerUser &&
      callerUser.roles?.some((r: string) => r.includes('BUYER')) &&
      !callerUser.roles?.some((r: string) => r.includes('ADMIN') || r.includes('COMPLIANCE'))
    ) {
      if (doc.registration.userId && doc.registration.userId !== BigInt(callerUser.id)) {
        throw new ForbiddenException("Access to another buyer's regulatory document is denied.");
      }
    }

    const file = await this.storage.getFile(doc.storageKey);
    return {
      ...file,
      fileName: doc.fileName,
      mimeType: doc.mimeType || file.contentType || 'application/pdf',
    };
  }

  /**
   * Step 5: Final Review & Submit. Validates every field and the six documents
   * actually stored for the draft, hashes the buyer-configured password, creates/links
   * a single buyer account (inactive until approval), and creates the compliance case.
   */
  async submitRegistration(dto: BuyerFullRegistrationDto): Promise<CustomerVerificationResponseDto> {
    const draft = await this.getEditableDraft(dto.registrationCode);

    if (dto.confirmAccurate === false) {
      throw new BadRequestException('You must confirm that the information provided is accurate.');
    }

    const gst = dto.gstNumber.trim().toUpperCase();
    const pan = dto.panNumber.trim().toUpperCase();
    this.assertFormats(gst, pan);

    // Required documents come from what is really stored, never from client-supplied metadata.
    const stored = await this.prisma.buyerDocument.findMany({
      where: { registrationId: draft.id, status: { not: 'SUPERSEDED' } },
    });
    const storedCategories = new Set(stored.map((d) => d.category));
    const missing = MANDATORY_DOCUMENT_CATEGORIES.filter((c) => !storedCategories.has(c));
    if (missing.length > 0) {
      throw new BadRequestException(`Missing required documents: ${missing.join(', ')}`);
    }

    const email = dto.email.trim().toLowerCase();
    let username = (dto.username || email.split('@')[0] || 'buyer')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .padEnd(3, '_')
      .slice(0, 40);

    const existingUserWithEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingUserWithEmail && draft.userId && draft.userId !== existingUserWithEmail.id) {
      throw new ConflictException('An account with this email already exists.');
    }
    if (existingUserWithEmail && !draft.userId) {
      throw new ConflictException('An account with this email already exists.');
    }

    const existingUserWithUsername = await this.prisma.user.findUnique({ where: { username } });
    if (existingUserWithUsername && (!draft.userId || draft.userId !== existingUserWithUsername.id)) {
      if (dto.username) {
        throw new ConflictException(`Username '${username}' is already registered.`);
      }
      username = `${username}_${randomBytes(2).toString('hex')}`;
    }

    const buyerRole = await this.prisma.role.findUnique({ where: { name: 'ROLE_BUYER' } });
    if (!buyerRole) {
      throw new BadRequestException('Buyer role is not configured on the server.');
    }

    // Hash buyer-chosen password using bcrypt (10 rounds) or generate secure random fallback
    const passwordHash = await bcrypt.hash(dto.password || randomBytes(18).toString('base64url'), 10);
    const customerTypeDetails = this.collectTypeDetails(dto);

    // Testing acceptance: clearly separated from government verification
    const autoVal = {
      gstCheck: 'Accepted for Testing (Unverified)',
      panCheck: 'Accepted for Testing (Unverified)',
      governmentVerified: false,
      gstGovernmentVerified: false,
      panGovernmentVerified: false,
      testingAccepted: true,
      requiredDocsCheck: 'Valid',
      requiredFieldsCheck: 'Valid',
      overallStatus: 'Pending Verification',
      validationDetails: [
        `GSTIN (${gst}) accepted for testing without government verification.`,
        `PAN (${pan}) accepted for testing without government verification.`,
        `All ${MANDATORY_DOCUMENT_CATEGORIES.length} required onboarding documents stored.`,
        'Required corporate & regulatory details completed.',
      ],
    };

    const verificationReq = await this.prisma.$transaction(async (tx) => {
      let user = existingUserWithEmail;
      if (!user) {
        user = await tx.user.create({
          data: {
            userCode: `USR-B-${randomBytes(4).toString('hex').toUpperCase()}`,
            username,
            email,
            passwordHash,
            fullName: dto.contactPerson.trim(),
            phone: dto.mobileNumber.trim(),
            companyName: dto.companyName.trim(),
            companyCode: dto.companyCode || `CMP-${randomBytes(3).toString('hex').toUpperCase()}`,
            department: dto.department || 'Procurement',
            jobTitle: dto.designation.trim(),
            accountStatus: 'INACTIVE',
            roles: { create: [{ roleId: buyerRole.id }] },
          },
        });
      } else {
        user = await tx.user.update({
          where: { id: existingUserWithEmail!.id },
          data: {
            fullName: dto.contactPerson.trim(),
            phone: dto.mobileNumber.trim(),
            companyName: dto.companyName.trim(),
            passwordHash,
          },
        });
      }

      const registration = await tx.buyerRegistration.update({
        where: { id: draft.id },
        data: {
          userId: user.id,
          companyName: dto.companyName.trim(),
          businessType: dto.businessType.trim(),
          gstNumber: gst,
          panNumber: pan,
          drugLicenseNumber: dto.drugLicenseNumber.trim(),
          cinNumber: dto.cinNumber?.trim() || null,
          website: dto.website?.trim() || null,
          contactPerson: dto.contactPerson.trim(),
          designation: dto.designation.trim(),
          mobileNumber: dto.mobileNumber.trim(),
          email,
          billingAddress: dto.billingAddress.trim(),
          shippingAddress: dto.shippingAddress.trim(),
          state: dto.state.trim(),
          country: dto.country?.trim() || 'India',
          pincode: dto.pincode.trim(),
          customerTypeDetails: Object.keys(customerTypeDetails).length > 0 ? customerTypeDetails : undefined,
          currentStep: 5,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          assignedOfficer: 'Rajesh Kumar (Compliance Desk A)',
          autoValidation: autoVal,
        },
      });

      const existingReq = await tx.customerVerificationRequest.findFirst({
        where: { registrationId: registration.id },
      });

      if (existingReq) {
        return tx.customerVerificationRequest.update({
          where: { id: existingReq.id },
          data: {
            customerName: dto.contactPerson.trim(),
            companyName: dto.companyName.trim(),
            customerType: this.mapCustomerType(dto.businessType),
            verificationStatus: 'Under Review',
            gstNumber: gst,
            panNumber: pan,
            drugLicenseNumber: dto.drugLicenseNumber.trim(),
            cinNumber: dto.cinNumber?.trim() || null,
            website: dto.website?.trim() || null,
            email,
            phone: dto.mobileNumber.trim(),
            contactPerson: dto.contactPerson.trim(),
            designation: dto.designation.trim(),
            billingAddress: dto.billingAddress.trim(),
            shippingAddress: dto.shippingAddress.trim(),
            state: dto.state.trim(),
            country: dto.country?.trim() || 'India',
            pincode: dto.pincode.trim(),
            customerTypeDetails: Object.keys(customerTypeDetails).length > 0 ? customerTypeDetails : undefined,
            autoValidation: autoVal,
            rejectionReason: null,
          },
        });
      } else {
        const requestCode = `CUS-VER-${randomBytes(4).toString('hex').toUpperCase()}`;
        return tx.customerVerificationRequest.create({
          data: {
            requestCode,
            registrationId: registration.id,
            userId: user.id,
            customerName: dto.contactPerson.trim(),
            companyName: dto.companyName.trim(),
            customerType: this.mapCustomerType(dto.businessType),
            customerClassification: 'REGULAR',
            verificationStatus: 'Under Review',
            assignedComplianceOfficer: 'Rajesh Kumar (Compliance Desk A)',
            gstNumber: gst,
            panNumber: pan,
            drugLicenseNumber: dto.drugLicenseNumber.trim(),
            cinNumber: dto.cinNumber?.trim() || null,
            website: dto.website?.trim() || null,
            email,
            phone: dto.mobileNumber.trim(),
            contactPerson: dto.contactPerson.trim(),
            designation: dto.designation.trim(),
            billingAddress: dto.billingAddress.trim(),
            shippingAddress: dto.shippingAddress.trim(),
            state: dto.state.trim(),
            country: dto.country?.trim() || 'India',
            pincode: dto.pincode.trim(),
            customerTypeDetails: Object.keys(customerTypeDetails).length > 0 ? customerTypeDetails : undefined,
            autoValidation: autoVal,
            businessVerification: {
              status: 'Pending manual verification',
              gstActiveStatus: 'Pending Manual Review',
              panValidation: 'Pending Manual Review',
              companyRegistrationValidation: 'Pending Manual Review',
              cinValidation: dto.cinNumber ? 'Pending Manual Review' : 'N/A',
              governmentVerified: false,
              submittedAt: new Date().toISOString(),
            },
            regulatoryVerification: {
              status: 'Pending manual verification',
              drugLicenseValidity: 'Pending Manual Review',
              licenseExpiryCheck: 'Pending Manual Review',
              stateRegulatoryAuthorityValidation: 'Pending Manual Review',
              governmentVerified: false,
              submittedAt: new Date().toISOString(),
            },
            financialVerification: {
              status: 'Pending manual verification',
              bankVerification: 'Pending Manual Review',
              creditRating: 'Pending Assessment',
              riskClassification: 'UNDER_EVALUATION',
              submittedAt: new Date().toISOString(),
            },
            portalLoginCreated: false,
            portalUsername: email,
          },
        });
      }
    });

    return {
      requestCode: verificationReq.requestCode,
      customerName: verificationReq.customerName,
      companyName: verificationReq.companyName,
      customerType: verificationReq.customerType,
      verificationStatus: verificationReq.verificationStatus,
      assignedComplianceOfficer: verificationReq.assignedComplianceOfficer ?? undefined,
      autoValidation: autoVal as any,
      customerCode: verificationReq.customerCode ?? undefined,
      createdAt: verificationReq.createdAt.toISOString(),
    };
  }

  private mapCustomerType(bType: string): string {
    const upper = (bType || '').toUpperCase();
    if (upper.includes('PCD')) return 'PCD';
    if (upper.includes('TPM') || upper.includes('THIRD PARTY')) return 'TPM';
    if (upper.includes('DISTRIBUTOR')) return 'Distributor';
    if (upper.includes('HOSPITAL') || upper.includes('HEALTHCARE')) return 'Hospital';
    if (upper.includes('EXPORT')) return 'Export';
    return 'Wholesaler';
  }

  /**
   * Retrieves registration for the currently authenticated buyer user
   */
  async getMyRegistration(userId: number) {
    const reg = await this.prisma.buyerRegistration.findFirst({
      where: { userId: BigInt(userId) },
      include: {
        documents: {
          where: { status: { not: 'SUPERSEDED' } },
          orderBy: { createdAt: 'desc' },
        },
        verificationRequests: true,
      },
    });

    if (!reg) {
      throw new NotFoundException('No buyer registration found for this account.');
    }

    return {
      ...reg,
      id: reg.id.toString(),
      userId: reg.userId ? reg.userId.toString() : null,
      documents: reg.documents.map((d) => this.toDocumentDto(d, reg.id)),
      verificationRequests: reg.verificationRequests.map((v) => ({
        ...v,
        id: v.id.toString(),
        registrationId: v.registrationId ? v.registrationId.toString() : null,
        userId: v.userId ? v.userId.toString() : null,
      })),
    };
  }

  /**
   * Retrieves registration by code or email
   */
  async getRegistration(codeOrEmail: string, callerUser?: AuthUser) {
    const reg = await this.prisma.buyerRegistration.findFirst({
      where: {
        OR: [{ registrationCode: codeOrEmail }, { email: codeOrEmail.toLowerCase() }],
      },
      include: {
        documents: {
          where: { status: { not: 'SUPERSEDED' } },
          orderBy: { createdAt: 'desc' },
        },
        verificationRequests: true,
      },
    });

    if (!reg) {
      throw new NotFoundException(`Buyer registration for ${codeOrEmail} not found.`);
    }

    if (
      callerUser &&
      callerUser.roles.includes('ROLE_BUYER') &&
      !callerUser.roles.includes('ROLE_ADMIN') &&
      !callerUser.roles.includes('ROLE_COMPLIANCE_OFFICER')
    ) {
      if (reg.userId && reg.userId !== BigInt(callerUser.id)) {
        throw new ForbiddenException("Access to another buyer's registration is denied.");
      }
    }

    return {
      ...reg,
      id: reg.id.toString(),
      userId: reg.userId ? reg.userId.toString() : null,
      documents: reg.documents.map((d) => this.toDocumentDto(d, reg.id)),
      verificationRequests: reg.verificationRequests.map((v) => ({
        ...v,
        id: v.id.toString(),
        registrationId: v.registrationId ? v.registrationId.toString() : null,
        userId: v.userId ? v.userId.toString() : null,
      })),
    };
  }
}
