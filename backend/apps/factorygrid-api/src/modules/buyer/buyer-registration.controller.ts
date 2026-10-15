import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthUser, CurrentUser, Public, Roles } from '@factorygrid/auth';
import { StorageService } from '../storage/storage.service';
import { BuyerRegistrationService } from './buyer-registration.service';
import {
  BuyerFullRegistrationDto,
  Step1CompanyDto,
  Step2ContactDto,
  Step3AddressDto,
  StepResponseDto,
} from './dto/buyer-registration.dto';
import {
  MANDATORY_DOCUMENT_CATEGORIES,
  UploadDocumentResponseDto,
} from './dto/buyer-document.dto';
import { CustomerVerificationResponseDto } from './dto/verification.dto';

@ApiTags('Buyer Onboarding & Registration')
@Controller('buyer')
export class BuyerRegistrationController {
  constructor(
    private readonly buyerService: BuyerRegistrationService,
    private readonly storageService: StorageService,
  ) {}

  @Public()
  @Post('registration/step-1')
  @ApiOperation({
    summary: 'Step 1: Save Company & Regulatory Information',
    description: 'Saves company name, business type, GST, PAN, and drug license number.',
  })
  @ApiCreatedResponse({ type: StepResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid GSTIN, PAN, or required fields' })
  saveStep1(
    @Body() dto: Step1CompanyDto,
    @Query('registrationCode') registrationCode?: string,
  ): Promise<StepResponseDto> {
    return this.buyerService.saveStep1(dto, registrationCode);
  }

  @Public()
  @Post('registration/step-2')
  @ApiOperation({
    summary: 'Step 2: Save Contact Information',
    description: 'Saves primary contact person, designation, mobile number, and email address.',
  })
  @ApiQuery({ name: 'registrationCode', required: true, description: 'Existing registration code from Step 1' })
  @ApiCreatedResponse({ type: StepResponseDto })
  @ApiBadRequestResponse({ description: 'Missing required contact fields' })
  saveStep2(
    @Body() dto: Step2ContactDto,
    @Query('registrationCode') registrationCode: string,
  ): Promise<StepResponseDto> {
    if (!registrationCode) {
      throw new BadRequestException('registrationCode query parameter is required.');
    }
    return this.buyerService.saveStep2(dto, registrationCode);
  }

  @Public()
  @Post('registration/step-3')
  @ApiOperation({
    summary: 'Step 3: Save Business Details, Addresses & Customer-Type Specifics',
    description: 'Saves billing/shipping addresses, state, pincode, and customer-type-specific parameters (e.g. PCD territory/portfolio).',
  })
  @ApiQuery({ name: 'registrationCode', required: true, description: 'Existing registration code' })
  @ApiCreatedResponse({ type: StepResponseDto })
  @ApiBadRequestResponse({ description: 'Missing required address fields' })
  saveStep3(
    @Body() dto: Step3AddressDto,
    @Query('registrationCode') registrationCode: string,
  ): Promise<StepResponseDto> {
    if (!registrationCode) {
      throw new BadRequestException('registrationCode query parameter is required.');
    }
    return this.buyerService.saveStep3(dto, registrationCode);
  }

  @Public()
  @Post('documents/upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Step 4 & Document Re-upload: Upload Mandatory Regulatory Document',
    description: 'Accepts multipart/form-data file upload for one of the 6 regulatory categories. Stores file in MinIO/S3 and records metadata in database.',
  })
  @ApiQuery({
    name: 'category',
    required: true,
    enum: MANDATORY_DOCUMENT_CATEGORIES,
    description: 'Regulatory document category',
  })
  @ApiQuery({
    name: 'registrationCode',
    required: true,
    description: 'Registration code returned by step-1; allows draft uploads and post-review replacement uploads',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Regulatory document PDF/Image (max 10MB)' },
      },
      required: ['file'],
    },
  })
  @ApiCreatedResponse({ type: UploadDocumentResponseDto })
  @ApiBadRequestResponse({ description: 'File missing, oversized, or invalid category' })
  async uploadDocument(
    @Req() req: FastifyRequest,
    @Query('category') categoryParam?: string,
    @Query('registrationCode') registrationCodeParam?: string,
  ): Promise<UploadDocumentResponseDto> {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request must be multipart/form-data.');
    }

    const part = await req.file();
    if (!part) {
      throw new BadRequestException('No file uploaded in "file" field.');
    }

    const buffer = await part.toBuffer();
    const fieldCategory = (part.fields as any)?.category?.value;
    const fieldRegCode = (part.fields as any)?.registrationCode?.value;

    const category = categoryParam || fieldCategory;
    const regCode = registrationCodeParam || fieldRegCode;

    if (!category) {
      throw new BadRequestException('Document category is required.');
    }

    const callerUser = (req as any).user as AuthUser | undefined;

    return this.buyerService.uploadDocument(
      buffer,
      part.filename,
      part.mimetype,
      category,
      regCode,
      callerUser,
    );
  }

  @Get('documents')
  @ApiBearerAuth()
  @Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER', 'BUYER', 'ROLE_BUYER')
  @ApiOperation({ summary: 'List all regulatory documents for a registration' })
  @ApiQuery({ name: 'registrationCode', required: false, description: 'Optional for authenticated buyer' })
  @ApiOkResponse({ type: [UploadDocumentResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiForbiddenResponse({ description: 'Access denied' })
  @ApiNotFoundResponse({ description: 'Registration not found' })
  async getDocuments(
    @Query('registrationCode') registrationCode?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<UploadDocumentResponseDto[]> {
    let regCode = registrationCode;
    if (!regCode && user) {
      const myReg = await this.buyerService.getMyRegistration(Number(user.id));
      regCode = myReg.registrationCode;
    }
    if (!regCode) {
      throw new BadRequestException('registrationCode query parameter is required.');
    }
    return this.buyerService.getDocuments(regCode, user);
  }

  @Get('documents/download/*')
  @ApiBearerAuth()
  @Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER', 'BUYER', 'ROLE_BUYER')
  @ApiOperation({ summary: 'Download a regulatory document from private storage' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiForbiddenResponse({ description: 'Access denied' })
  async downloadDocument(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    const rawPath = (req.params as any)['*'];
    if (!rawPath || !rawPath.startsWith('documents/buyer/') || rawPath.includes('..')) {
      throw new BadRequestException('Invalid document key path.');
    }

    // Cross-buyer protection: verify buyer owns this file
    if (
      user.roles.some((r: string) => r.includes('BUYER')) &&
      !user.roles.some((r: string) => r.includes('ADMIN') || r.includes('COMPLIANCE'))
    ) {
      const myReg = await this.buyerService.getMyRegistration(Number(user.id));
      const expectedPrefix = `documents/buyer/${myReg.registrationCode}/`;
      if (!rawPath.startsWith(expectedPrefix)) {
        throw new ForbiddenException("Access to another buyer's document is denied.");
      }
    }

    const file = await this.storageService.getFile(rawPath);
    res.header('Content-Type', file.contentType);
    if (file.contentLength) {
      res.header('Content-Length', file.contentLength);
    }
    return res.send(file.stream);
  }

  @Get('documents/:id/download')
  @ApiBearerAuth()
  @Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER', 'BUYER', 'ROLE_BUYER')
  @ApiOperation({ summary: 'Download or stream an uploaded buyer regulatory document by ID' })
  async downloadDocumentById(
    @Param('id') id: string,
    @Res() res: FastifyReply,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    const file = await this.buyerService.getDocumentForDownload(id, user);
    res.header('Content-Type', file.mimeType || file.contentType || 'application/pdf');
    res.header('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
    if (file.contentLength) {
      res.header('Content-Length', file.contentLength);
    }
    return res.send(file.stream);
  }

  @Public()
  @Post('registration/submit')
  @ApiOperation({
    summary: 'Step 5: Review & Submit Complete Buyer Registration',
    description: 'Submits all 5 registration steps, executes server-side auto-validation, persists details in PostgreSQL, and enqueues customer verification.',
  })
  @ApiCreatedResponse({ type: CustomerVerificationResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed or required documents missing' })
  @ApiNotFoundResponse({ description: 'Registration draft not found' })
  @ApiConflictResponse({ description: 'Already submitted, or an account with this email/username exists' })
  submitRegistration(@Body() dto: BuyerFullRegistrationDto): Promise<CustomerVerificationResponseDto> {
    return this.buyerService.submitRegistration(dto);
  }

  @Get('my-registration')
  @ApiBearerAuth()
  @Roles('BUYER', 'ROLE_BUYER', 'ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Get current authenticated buyer registration, documents, and verification status' })
  @ApiOkResponse({ description: 'Current buyer registration details' })
  getMyRegistration(@CurrentUser() user: AuthUser) {
    return this.buyerService.getMyRegistration(Number(user.id));
  }

  @Get('registration/:code')
  @ApiBearerAuth()
  @Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER', 'BUYER', 'ROLE_BUYER')
  @ApiOperation({ summary: 'Get buyer registration details by code or email' })
  @ApiParam({ name: 'code', description: 'Registration Code (REG-BUYER-...) or Email' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN, COMPLIANCE_OFFICER, or owning BUYER' })
  @ApiNotFoundResponse({ description: 'Registration not found' })
  getRegistration(@Param('code') code: string, @CurrentUser() user?: AuthUser) {
    return this.buyerService.getRegistration(code, user);
  }
}
